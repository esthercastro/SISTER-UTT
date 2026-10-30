import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { NodoUTT, ReporteGeocodificacion } from './src/types.js';
import {
  limpiarTexto,
  aTitleCase,
  normalizarRegion,
  normalizarDiasEntrega,
  normalizarTelefono,
} from './server/normalizador.js';
import { geocodificarDireccion } from './server/geocoding.js';
import { importarPlanillaExcel } from './scripts/importar_excel.js';

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  // In AI Studio Cloud Run containers, Nginx listens on 8080 and proxies to 3000.
  // Therefore default to 3000 unless specified via CLI or non-8080 env.
  if (process.env.APP_PORT) {
    const parsed = parseInt(process.env.APP_PORT, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}

function getHost(): string {
  const hostArgIndex = process.argv.indexOf('--host');
  if (hostArgIndex !== -1 && process.argv[hostArgIndex + 1]) {
    return process.argv[hostArgIndex + 1];
  }
  return '0.0.0.0';
}

const dataDir = path.join(process.cwd(), 'data');
const nodosFilePath = path.join(dataDir, 'nodos.json');
const reporteFilePath = path.join(dataDir, 'geocoding_report.json');

function obtenerNodos(): NodoUTT[] {
  try {
    if (fs.existsSync(nodosFilePath)) {
      const data = fs.readFileSync(nodosFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error al leer nodos.json:', err);
  }
  return [];
}

function guardarNodos(nodos: NodoUTT[]) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(nodosFilePath, JSON.stringify(nodos, null, 2), 'utf-8');
}

function obtenerReporte(): ReporteGeocodificacion {
  try {
    if (fs.existsSync(reporteFilePath)) {
      const data = fs.readFileSync(reporteFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error al leer geocoding_report.json:', err);
  }
  const nodos = obtenerNodos();
  const sinCoord = nodos.filter((n) => !n.geocodificado_ok || !n.latitud || !n.longitud);
  return {
    total_procesados: nodos.length,
    geocodificados_ok: nodos.length - sinCoord.length,
    sin_coordenadas: sinCoord.length,
    nodos_sin_coordenadas: sinCoord.map((n) => ({
      id: n.id,
      nombre: n.nombre,
      direccion: n.direccion,
      localidad: n.localidad,
    })),
    fecha: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ==========================================
  // RUTAS DE LA API (Siempre antes de Vite)
  // ==========================================

  // 1. Obtener listado de nodos
  app.get('/api/nodos', (req, res) => {
    try {
      const nodos = obtenerNodos();
      res.json(nodos);
    } catch (error) {
      res.status(500).json({ error: 'No se pudieron cargar los nodos.' });
    }
  });

  // 2. Obtener un nodo por id
  app.get('/api/nodos/:id', (req, res) => {
    const nodos = obtenerNodos();
    const nodo = nodos.find((n) => n.id === req.params.id);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado.' });
    }
    res.json(nodo);
  });

  // 3. Crear nuevo nodo (geocodificación automática en backend)
  app.post('/api/nodos', async (req, res) => {
    try {
      const {
        nombre,
        direccion,
        localidad,
        provincia,
        region,
        telefono,
        dias_entrega,
        mostrar_direccion_publica,
      } = req.body;

      if (!nombre || !direccion) {
        return res.status(400).json({ error: 'El nombre y la dirección son obligatorios.' });
      }

      const nombreNormalizado = aTitleCase(nombre);
      const direccionLimpia = limpiarTexto(direccion);
      const localidadNormalizada = aTitleCase(localidad || 'Buenos Aires');
      const regionCalculada = region || normalizarRegion(provincia, localidadNormalizada);
      const diasNormalizados = normalizarDiasEntrega(dias_entrega);
      const telInfo = normalizarTelefono(telefono);

      // Geocodificación automática sin pedir lat/long a mano
      const geo = await geocodificarDireccion(
        direccionLimpia,
        localidadNormalizada,
        provincia || regionCalculada
      );
      const tieneCoords = geo.lat !== 0 && geo.lng !== 0;

      const nodos = obtenerNodos();
      const nuevoId = `nodo-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;

      const nuevoNodo: NodoUTT = {
        id: nuevoId,
        nombre: nombreNormalizado,
        direccion: direccionLimpia,
        localidad: localidadNormalizada,
        provincia: provincia || 'Buenos Aires',
        region: regionCalculada,
        telefono: telInfo.display,
        whatsapp_url: telInfo.whatsapp_url,
        dias_entrega: diasNormalizados,
        latitud: tieneCoords ? geo.lat : null,
        longitud: tieneCoords ? geo.lng : null,
        estado: 'activo',
        mostrar_direccion_publica: Boolean(mostrar_direccion_publica),
        geocodificado_ok: tieneCoords,
        fecha_actualizacion: new Date().toISOString(),
        datos_originales: {
          direccion_raw: direccion,
          localidad_raw: localidad,
          region_raw: region,
          telefono_raw: telefono,
          dias_raw: dias_entrega,
        },
      };

      nodos.unshift(nuevoNodo);
      guardarNodos(nodos);

      res.status(201).json({
        mensaje: tieneCoords
          ? '¡Nodo creado y geocodificado con éxito!'
          : 'Nodo creado, pero no se encontraron coordenadas automáticas precisas. Podés revisarlo desde el panel.',
        nodo: nuevoNodo,
        metodo_geocodificacion: geo.metodo,
      });
    } catch (error) {
      console.error('Error al crear nodo:', error);
      res.status(500).json({ error: 'Hubo un error al crear el nodo.' });
    }
  });

  // 4. Editar nodo existente
  app.put('/api/nodos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const nodos = obtenerNodos();
      const index = nodos.findIndex((n) => n.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Nodo no encontrado.' });
      }

      const nodoActual = nodos[index];
      const {
        nombre,
        direccion,
        localidad,
        provincia,
        region,
        telefono,
        dias_entrega,
        mostrar_direccion_publica,
        estado,
      } = req.body;

      const direccionLimpia = direccion ? limpiarTexto(direccion) : nodoActual.direccion;
      const localidadNormalizada = localidad ? aTitleCase(localidad) : nodoActual.localidad;

      // Si cambió la dirección o localidad, o si no tenía coordenadas, re-geocodificar
      let latitud = nodoActual.latitud;
      let longitud = nodoActual.longitud;
      let geocodificado_ok = nodoActual.geocodificado_ok;
      let metodoGeo = 'mantuvo_anterior';

      const direccionCambio =
        direccionLimpia !== nodoActual.direccion || localidadNormalizada !== nodoActual.localidad;

      if (direccionCambio || !latitud || !longitud) {
        const geo = await geocodificarDireccion(
          direccionLimpia,
          localidadNormalizada,
          provincia || region || nodoActual.provincia
        );
        if (geo.lat !== 0 && geo.lng !== 0) {
          latitud = geo.lat;
          longitud = geo.lng;
          geocodificado_ok = true;
          metodoGeo = geo.metodo;
        }
      }

      const telInfo = telefono ? normalizarTelefono(telefono) : { display: nodoActual.telefono, whatsapp_url: nodoActual.whatsapp_url };

      const nodoActualizado: NodoUTT = {
        ...nodoActual,
        nombre: nombre ? aTitleCase(nombre) : nodoActual.nombre,
        direccion: direccionLimpia,
        localidad: localidadNormalizada,
        provincia: provincia !== undefined ? provincia : nodoActual.provincia,
        region: region || normalizarRegion(provincia || nodoActual.provincia, localidadNormalizada),
        telefono: telInfo.display,
        whatsapp_url: telInfo.whatsapp_url,
        dias_entrega: dias_entrega ? normalizarDiasEntrega(dias_entrega) : nodoActual.dias_entrega,
        mostrar_direccion_publica:
          mostrar_direccion_publica !== undefined
            ? Boolean(mostrar_direccion_publica)
            : nodoActual.mostrar_direccion_publica,
        estado: estado || nodoActual.estado,
        latitud,
        longitud,
        geocodificado_ok,
        fecha_actualizacion: new Date().toISOString(),
      };

      nodos[index] = nodoActualizado;
      guardarNodos(nodos);

      res.json({
        mensaje: 'Nodo actualizado con éxito.',
        nodo: nodoActualizado,
        metodo_geocodificacion: metodoGeo,
      });
    } catch (error) {
      console.error('Error al editar nodo:', error);
      res.status(500).json({ error: 'Hubo un error al editar el nodo.' });
    }
  });

  // 5. Borrado lógico (toggle estado activo/inactivo)
  app.patch('/api/nodos/:id/toggle-estado', (req, res) => {
    try {
      const { id } = req.params;
      const nodos = obtenerNodos();
      const index = nodos.findIndex((n) => n.id === id);

      if (index === -1) {
        return res.status(404).json({ error: 'Nodo no encontrado.' });
      }

      const nuevoEstado = nodos[index].estado === 'activo' ? 'inactivo' : 'activo';
      nodos[index].estado = nuevoEstado;
      nodos[index].fecha_actualizacion = new Date().toISOString();

      guardarNodos(nodos);
      res.json({
        mensaje: `El nodo ahora está ${nuevoEstado}.`,
        nodo: nodos[index],
      });
    } catch (error) {
      res.status(500).json({ error: 'No se pudo cambiar el estado del nodo.' });
    }
  });

  // 6. Probar geocodificación en vivo
  app.post('/api/geocode', async (req, res) => {
    try {
      const { direccion, localidad, provincia } = req.body;
      const geo = await geocodificarDireccion(direccion, localidad, provincia);
      res.json(geo);
    } catch (error) {
      res.status(500).json({ error: 'Falla en el servicio de geocodificación.' });
    }
  });

  // 7. Re-geocodificar en lote los nodos sin coordenadas
  app.post('/api/regeocode-all', async (req, res) => {
    try {
      const nodos = obtenerNodos();
      const pendientes = nodos.filter((n) => !n.geocodificado_ok || !n.latitud || !n.longitud);

      let resueltos = 0;
      for (const nodo of pendientes) {
        const geo = await geocodificarDireccion(nodo.direccion, nodo.localidad, nodo.provincia);
        if (geo.lat !== 0 && geo.lng !== 0) {
          nodo.latitud = geo.lat;
          nodo.longitud = geo.lng;
          nodo.geocodificado_ok = true;
          nodo.fecha_actualizacion = new Date().toISOString();
          resueltos++;
        }
      }

      guardarNodos(nodos);
      res.json({
        mensaje: `Proceso completado. Se lograron geocodificar ${resueltos} de ${pendientes.length} nodos pendientes.`,
        resueltos,
        total_pendientes_previos: pendientes.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error al re-geocodificar en lote.' });
    }
  });

  // 8. Re-importar desde la planilla Excel
  app.post('/api/import-excel', async (req, res) => {
    try {
      const resultado = await importarPlanillaExcel();
      res.json({
        mensaje: 'Planilla importada y geocodificada correctamente.',
        reporte: resultado.reporte,
      });
    } catch (error) {
      console.error('Error al importar:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // 9. Reporte de geocodificación
  app.get('/api/reporte', (req, res) => {
    res.json(obtenerReporte());
  });

  // ==========================================
  // VITE O SERVICIO DE ARCHIVOS ESTÁTICOS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/*.json'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = getPort();
  const HOST = getHost();

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n==============================================`);
    console.log(`Servidor Mapeo Territorial UTT activo`);
    console.log(`Corriendo en: http://${HOST}:${PORT}`);
    console.log(`==============================================\n`);
  });

  server.on('error', (err) => {
    console.error('Error en el servidor HTTP:', err);
  });
}

startServer();
