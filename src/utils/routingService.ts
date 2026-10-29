/**
 * Servicio para consulta de rutas vehiculares/viales utilizando OSRM (Open Source Routing Machine).
 * Es un servicio público y gratuito sin necesidad de API keys.
 */

export interface ResultadoRutaOSRM {
  coordenadas: [number, number][]; // Formato Leaflet [lat, lng]
  distanciaMetros?: number;
  duracionSegundos?: number;
}

const cacheRutas: Map<string, ResultadoRutaOSRM> = new Map();

export async function obtenerRutaOSRM(
  latOrigen: number,
  lngOrigen: number,
  latDestino: number,
  lngDestino: number
): Promise<ResultadoRutaOSRM | null> {
  // Clave de cache redondeada a 4 decimales (~11m de precisión)
  const cacheKey = `${latOrigen.toFixed(4)},${lngOrigen.toFixed(4)};${latDestino.toFixed(4)},${lngDestino.toFixed(4)}`;
  if (cacheRutas.has(cacheKey)) {
    return cacheRutas.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    // OSRM espera coordenadas en formato lng,lat;lng,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${lngOrigen},${latOrigen};${lngDestino},${latDestino}?overview=full&geometries=geojson`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const ruta = data.routes[0];
      const coordsGeoJSON: [number, number][] = ruta.geometry.coordinates;

      // Invertir [lng, lat] de GeoJSON a [lat, lng] para Leaflet
      const coordenadasLeaflet: [number, number][] = coordsGeoJSON.map(([lng, lat]) => [lat, lng]);

      const resultado: ResultadoRutaOSRM = {
        coordenadas: coordenadasLeaflet,
        distanciaMetros: ruta.distance,
        duracionSegundos: ruta.duration,
      };

      cacheRutas.set(cacheKey, resultado);
      return resultado;
    }
  } catch (err) {
    console.warn('OSRM routing no disponible o demorado, se usará trayecto directo:', err);
  }

  return null;
}
