import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { NodoUTT, ReporteGeocodificacion } from '../src/types.js';
import {
  limpiarTexto,
  aTitleCase,
  normalizarRegion,
  normalizarDiasEntrega,
  normalizarTelefono,
} from '../server/normalizador.js';
import { geocodificarDireccion } from '../server/geocoding.js';

export async function importarPlanillaExcel(rutaExcel?: string): Promise<{
  nodos: NodoUTT[];
  reporte: ReporteGeocodificacion;
}> {
  const dataDir = path.join(process.cwd(), 'data');
  const archivo = rutaExcel || path.join(dataDir, 'NODOS_UTT.xlsx');

  if (!fs.existsSync(archivo)) {
    throw new Error(`No se encontró el archivo de planilla en: ${archivo}`);
  }

  console.log(`\n==============================================`);
  console.log(`Iniciando importación desde: ${archivo}`);
  console.log(`==============================================\n`);

  const fileBuffer = fs.readFileSync(archivo);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const filas = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

  console.log(`Total de filas detectadas en la planilla: ${filas.length}`);

  const nodos: NodoUTT[] = [];
  const sinCoordenadas: ReporteGeocodificacion['nodos_sin_coordenadas'] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const id = `nodo-${String(i + 1).padStart(3, '0')}`;

    const nombreRaw = fila['Nombre'] || fila['nombre'] || `Nodo ${i + 1}`;
    const direccionRaw = fila['Dirección'] || fila['Direccion'] || fila['direccion'] || '';
    const localidadRaw = fila['Localidad'] || fila['localidad'] || fila['Barrio'] || '';
    const provinciaRaw = fila['Provincia'] || fila['provincia'] || '';
    const telefonoRaw = fila['Teléfono'] || fila['Telefono'] || fila['telefono'] || '';
    const diasRaw = fila['Días de entrega'] || fila['Dias de entrega'] || fila['dias_entrega'] || '';

    const nombre = aTitleCase(nombreRaw);
    const direccion = limpiarTexto(direccionRaw);
    const localidad = aTitleCase(localidadRaw);
    const region = normalizarRegion(provinciaRaw, localidadRaw);
    const dias_entrega = normalizarDiasEntrega(diasRaw);
    const telInfo = normalizarTelefono(telefonoRaw);

    console.log(`[${i + 1}/${filas.length}] Geocodificando: ${nombre} (${direccion}, ${localidad})...`);

    // Geocodificación
    const geo = await geocodificarDireccion(direccion, localidad, provinciaRaw);
    const tieneCoords = geo.lat !== 0 && geo.lng !== 0;

    const nodo: NodoUTT = {
      id,
      nombre,
      direccion,
      localidad,
      provincia: provinciaRaw,
      region,
      telefono: telInfo.display,
      whatsapp_url: telInfo.whatsapp_url,
      dias_entrega,
      latitud: tieneCoords ? geo.lat : null,
      longitud: tieneCoords ? geo.lng : null,
      estado: 'activo',
      mostrar_direccion_publica: false, // por defecto false según especificación
      geocodificado_ok: tieneCoords,
      fecha_actualizacion: new Date().toISOString(),
      datos_originales: {
        region_raw: provinciaRaw,
        dias_raw: diasRaw,
        localidad_raw: localidadRaw,
        telefono_raw: telefonoRaw,
        direccion_raw: direccionRaw,
      },
    };

    nodos.push(nodo);

    if (!tieneCoords) {
      sinCoordenadas.push({
        id,
        nombre,
        direccion,
        localidad,
      });
    }
  }

  const reporte: ReporteGeocodificacion = {
    total_procesados: nodos.length,
    geocodificados_ok: nodos.filter((n) => n.geocodificado_ok).length,
    sin_coordenadas: sinCoordenadas.length,
    nodos_sin_coordenadas: sinCoordenadas,
    fecha: new Date().toISOString(),
  };

  // Guardar datos en data/nodos.json
  const rutaNodosJson = path.join(dataDir, 'nodos.json');
  fs.writeFileSync(rutaNodosJson, JSON.stringify(nodos, null, 2), 'utf-8');

  // Guardar reporte en data/geocoding_report.json
  const rutaReporteJson = path.join(dataDir, 'geocoding_report.json');
  fs.writeFileSync(rutaReporteJson, JSON.stringify(reporte, null, 2), 'utf-8');

  console.log(`\n==============================================`);
  console.log(`Importación finalizada con éxito`);
  console.log(`Total procesados: ${reporte.total_procesados}`);
  console.log(`Geocodificados correctamente: ${reporte.geocodificados_ok}`);
  console.log(`Sin coordenadas (para revisar a mano): ${reporte.sin_coordenadas}`);
  console.log(`Archivos generados:`);
  console.log(` - ${rutaNodosJson}`);
  console.log(` - ${rutaReporteJson}`);
  console.log(`==============================================\n`);

  return { nodos, reporte };
}

// Ejecución directa si se llama con `npx tsx scripts/importar_excel.ts`
if (process.argv[1]?.endsWith('importar_excel.ts') || process.argv[1]?.endsWith('importar_excel.js')) {
  importarPlanillaExcel()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error durante la importación:', err);
      process.exit(1);
    });
}
