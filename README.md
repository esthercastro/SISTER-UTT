# Mapeo Territorial UTT — Piloto Funcional

Sistema interactivo de georreferenciación, búsqueda y administración territorial de la **Red de Nodos de la UTT (Unión de Trabajadores de la Tierra)** en Argentina.

Este proyecto reemplaza la planilla estática de Excel por una plataforma viva, geocodificada y accesible desde cualquier celular o computadora, permitiendo a vecinas y vecinos encontrar su punto de entrega agroecológica más cercano y contactarse directo por WhatsApp.

---

## 🚀 Cómo Arrancar el Proyecto con un Solo Comando

### Opción 1: Modo Desarrollo Rápido (Recomendado con Node.js / Vite)

1. Instalar dependencias (solo la primera vez):
   ```bash
   npm install
   ```
2. Iniciar el servidor local:
   ```bash
   npm run dev
   ```
3. Abrí tu navegador en: [http://localhost:3000](http://localhost:3000)

### Opción 2: Modo Servidor Python (Sin dependencias externas)

Si tenés que presentarlo en una máquina con Python 3 instalado:
```bash
python app.py
```
Abre en [http://localhost:3000](http://localhost:3000) leyendo directamente `data/nodos.json` y la compilación en `dist/`.

---

## 📊 Datos Semilla y Re-importación de la Planilla

El proyecto ya cuenta con los **51 nodos cargados y georreferenciados** en `data/nodos.json`.

Si querés reemplazar o actualizar la planilla original (`data/NODOS_UTT.xlsx`), ejecutá:
```bash
npm run import-excel
```
O también podés hacerlo desde el **Panel Administrativo** de la aplicación con un solo click en el botón **"Re-importar Excel"**.

### Reporte de Normalización y Geocodificación Inicial:
- **Total de nodos procesados en la planilla:** 51
- **Geocodificados con éxito:** 51 (100% con latitud y longitud)
- **Nodos pendientes / sin coordenadas:** 0
- **Normalizaciones aplicadas:**
  - **Regiones territoriales:** Mapeo de variantes ("CABA", "Caba", "caba", "NORTE", "Norte", "SUR", "Oeste") al set cerrado: `CABA`, `Norte`, `Sur`, `Oeste`.
  - **Días de entrega:** Normalización de "Ambos días", "Ambos dias", "Sabados", "Sábados", "Jueves".
  - **Teléfonos y WhatsApp:** Limpieza de prefijos de área (`011`, `15`, `549`), formateo visual y generación automática del enlace directo `https://wa.me/549...` con mensaje predeterminado.
  - **Auditoría:** Los datos originales sin procesar se preservan en el campo `datos_originales` de cada nodo.

---

## 🛠️ Funcionalidades Implementadas en el MVP

### 1. Vista Pública (Mobile-First)
- **Encabezado territorial:** *"Encontrá un Nodo UTT cerca tuyo"*.
- **Mapa interactivo:** Desarrollado con **Leaflet** y teselas de **OpenStreetMap** (100% gratuito, sin API keys pagas ni dependencias de tarjetas).
- **Buscador predictivo:** Filtra en vivo por nombre del nodo, localidad/barrio o calle.
- **Filtros combinables:** Por región (CABA, Zona Norte, Zona Sur, Zona Oeste) y por días de entrega (Jueves, Sábados, Ambos días).
- **Ficha y Marcador del Nodo:** Muestra nombre, barrio, días de entrega y botón directo a **WhatsApp**.
- **Privacidad (`mostrar_direccion_publica`):** Por defecto en `false`, muestra el barrio/localidad para proteger domicilios particulares y reserva la dirección exacta para coordinar con el referente al hacer el pedido.

### 2. Panel Administrativo (`/admin` o botón "Panel Admin")
- **Acceso simbólico para el piloto:** Clave `utt` o `utt2026`.
- **Alta de Nuevo Nodo:** Formulario con dirección en texto libre. **Geocodifica automáticamente con OpenStreetMap** al guardar sin pedir coordenadas manuales.
- **Edición de Nodos:** Modificación de datos y re-geocodificación automática si cambia la dirección.
- **Borrado Lógico:** Activar / desactivar nodos con un click sin perder el historial.
- **Herramienta en lote:** Botón para re-geocodificar en lote cualquier nodo que haya quedado sin coordenadas.

---

## 🧭 Próximos Pasos (Fuera de alcance del Piloto)

1. **Autogestión por Nodo:** Sistema de autenticación individual para que cada referente de nodo actualice sus días, horarios y disponibilidad.
2. **Flujo de Aprobación:** Mecanismo donde el nodo propone cambios y un equipo administrador valida antes de publicar al mapa.
3. **Embebido en utt.com.ar:** Widget o iframe responsive para integrar el mapa directamente en la web institucional de la UTT.
4. **Catálogo y Productos:** Información sobre bolsones de verdura, bolsones de fruta, almacén de cooperativas y precios semanales.
5. **Métricas Territoriales:** Tableros con estadísticas de cobertura por partido/comuna, densidad de nodos y volumen estimado de distribución.
