import * as fs from 'fs';
import * as path from 'path';
import { limpiarTexto } from './normalizador.js';
import { cleanAddressQuery, extraerCalleYAltura } from '../src/utils/addressCleaner.js';

export { cleanAddressQuery, extraerCalleYAltura };

const cacheFile = path.join(process.cwd(), 'data', 'geocache.json');
let cacheMemoria: Record<
  string,
  {
    lat: number;
    lng: number;
    metodo: 'nominatim' | 'referencia';
    direccionNormalizada?: string;
    calleYAltura?: string;
  }
> = {};

try {
  if (fs.existsSync(cacheFile)) {
    cacheMemoria = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  }
} catch (e) {
  cacheMemoria = {};
}

function guardarEnCache(
  query: string,
  data: {
    lat: number;
    lng: number;
    metodo: 'nominatim' | 'referencia';
    direccionNormalizada?: string;
    calleYAltura?: string;
  }
) {
  cacheMemoria[query] = data;
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(cacheMemoria, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

// Coordenadas aproximadas de referencia por localidad / barrio en caso de falla o timeout de Nominatim
const COORDENADAS_REFERENCIA: Record<string, { lat: number; lng: number }> = {
  // CABA
  almagro: { lat: -34.6111, lng: -58.4215 },
  caballito: { lat: -34.6192, lng: -58.4447 },
  palermo: { lat: -34.5889, lng: -58.4306 },
  'villa crespo': { lat: -34.5975, lng: -58.4428 },
  flores: { lat: -34.6289, lng: -58.4633 },
  floresta: { lat: -34.6318, lng: -58.4816 },
  boedo: { lat: -34.6298, lng: -58.4162 },
  colegiales: { lat: -34.5772, lng: -58.4497 },
  belgrano: { lat: -34.5627, lng: -58.4564 },
  saavedra: { lat: -34.5516, lng: -58.4891 },
  nunez: { lat: -34.5457, lng: -58.4638 },
  parque_patricios: { lat: -34.6375, lng: -58.4064 },
  san_telmo: { lat: -34.6212, lng: -58.3731 },
  constitucion: { lat: -34.6277, lng: -58.3816 },
  mataderos: { lat: -34.6593, lng: -58.5029 },
  liniers: { lat: -34.6477, lng: -58.5244 },
  villa_urquiza: { lat: -34.5746, lng: -58.4878 },
  villa_devoto: { lat: -34.6006, lng: -58.5133 },
  villa_pueyrredon: { lat: -34.5828, lng: -58.5042 },
  chacarita: { lat: -34.5878, lng: -58.4552 },
  caba: { lat: -34.6037, lng: -58.3816 },

  // Zona Norte
  vicente_lopez: { lat: -34.5273, lng: -58.4735 },
  olivos: { lat: -34.5097, lng: -58.4907 },
  florida: { lat: -34.5367, lng: -58.4872 },
  san_isidro: { lat: -34.4722, lng: -58.5281 },
  martinez: { lat: -34.4925, lng: -58.5034 },
  acassuso: { lat: -34.4795, lng: -58.5041 },
  beccar: { lat: -34.4578, lng: -58.5397 },
  san_fernando: { lat: -34.4428, lng: -58.5636 },
  victoria: { lat: -34.4485, lng: -58.5492 },
  tigre: { lat: -34.4261, lng: -58.5796 },
  san_martin: { lat: -34.5768, lng: -58.5375 },
  villa_ballester: { lat: -34.5511, lng: -58.5558 },

  // Zona Sur
  avellaneda: { lat: -34.6617, lng: -58.3664 },
  lanus: { lat: -34.7046, lng: -58.3906 },
  lanus_oeste: { lat: -34.7061, lng: -58.4019 },
  banfield: { lat: -34.7439, lng: -58.3947 },
  lomas_de_zamora: { lat: -34.7607, lng: -58.4019 },
  temperley: { lat: -34.7738, lng: -58.3967 },
  adrogue: { lat: -34.7989, lng: -58.3908 },
  burzaco: { lat: -34.8291, lng: -58.3962 },
  quilmes: { lat: -34.7242, lng: -58.2528 },
  bernal: { lat: -34.7064, lng: -58.2814 },
  ezpeleta: { lat: -34.7523, lng: -58.2435 },
  berazategui: { lat: -34.7634, lng: -58.2131 },
  la_plata: { lat: -34.9215, lng: -57.9545 },
  city_bell: { lat: -34.8697, lng: -58.0494 },
  villa_elisa: { lat: -34.8519, lng: -58.0772 },

  // Zona Oeste
  moron: { lat: -34.6534, lng: -58.6198 },
  castelar: { lat: -34.6565, lng: -58.6416 },
  haedo: { lat: -34.6465, lng: -58.5956 },
  ramos_mejia: { lat: -34.6493, lng: -58.5638 },
  san_justo: { lat: -34.6828, lng: -58.5619 },
  ituzaingo: { lat: -34.6583, lng: -58.6722 },
  merlo: { lat: -34.6653, lng: -58.7289 },
  paso_del_rey: { lat: -34.6517, lng: -58.7497 },
  moreno: { lat: -34.6508, lng: -58.7906 },
  hurlingham: { lat: -34.5965, lng: -58.6369 },
  tres_de_febrero: { lat: -34.6067, lng: -58.5644 },
  caseros: { lat: -34.6074, lng: -58.5658 },
  el_palomar: { lat: -34.6083, lng: -58.5917 },
};

let lastNominatimCallTime = 0;

async function esperarRateLimit() {
  const ahora = Date.now();
  const diferencia = ahora - lastNominatimCallTime;
  if (diferencia < 1050) {
    const espera = 1050 - diferencia;
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
  lastNominatimCallTime = Date.now();
}

/**
 * Realiza una consulta directa a Nominatim con timeout y headers apropiados
 */
async function consultarNominatimDirecto(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    await esperarRateLimit();

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1&countrycodes=ar`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UTTMapeoTerritorialPiloto/1.0 (contacto@trabajadoresdelatierra.org.ar)',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    console.warn(`[Nominatim] Consulta fallida para "${query}":`, (err as Error).message);
  }
  return null;
}

export async function geocodificarDireccion(
  direccion: string,
  localidad?: string,
  provincia?: string
): Promise<{
  lat: number;
  lng: number;
  metodo: 'nominatim' | 'referencia' | 'no_encontrado';
  direccionLimpia?: string;
  calleYAltura?: string;
}> {
  // 1. Sanitización profunda de la dirección ingresada
  const dirSanitizada = cleanAddressQuery(direccion);
  const calleYAltura = extraerCalleYAltura(direccion);
  const dirLimpia = dirSanitizada || limpiarTexto(direccion);
  const locLimpia = limpiarTexto(localidad);
  const provLimpia = limpiarTexto(provincia) || 'Buenos Aires';

  if (!dirLimpia && !locLimpia) {
    return { lat: 0, lng: 0, metodo: 'no_encontrado' };
  }

  // 2. Armar query principal contextualizada para Argentina
  const queryPrincipal = dirLimpia.toLowerCase().includes('buenos aires')
    ? `${dirLimpia}, Argentina`
    : `${dirLimpia}, ${locLimpia}, ${provLimpia}, Argentina`
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');

  // Revisar cache para la query principal
  if (cacheMemoria[queryPrincipal]) {
    return {
      ...cacheMemoria[queryPrincipal],
      direccionLimpia: dirLimpia,
      calleYAltura: calleYAltura || undefined,
    };
  }

  // 3. Intento inicial con el texto sanitizado en Nominatim
  const resInicial = await consultarNominatimDirecto(queryPrincipal);
  if (resInicial) {
    const resultado = {
      lat: resInicial.lat,
      lng: resInicial.lng,
      metodo: 'nominatim' as const,
      direccionLimpia: dirLimpia,
      calleYAltura: calleYAltura || undefined,
    };
    guardarEnCache(queryPrincipal, resultado);
    return resultado;
  }

  // 4. Extracción inteligente y Fallback (Reintento automático):
  // Si la búsqueda inicial con el texto limpio devuelve un array vacío ([]),
  // se hace un reintento automático extrayendo únicamente el patrón de [Nombre de Calle/Avenida + Altura numérica]
  // concatenado con ", Buenos Aires, Argentina"
  if (calleYAltura) {
    const queryFallback = `${calleYAltura}, Buenos Aires, Argentina`;

    if (cacheMemoria[queryFallback]) {
      const enCache = cacheMemoria[queryFallback];
      const resultado = {
        lat: enCache.lat,
        lng: enCache.lng,
        metodo: enCache.metodo,
        direccionLimpia: dirLimpia,
        calleYAltura,
      };
      guardarEnCache(queryPrincipal, resultado);
      return resultado;
    }

    const resFallback = await consultarNominatimDirecto(queryFallback);
    if (resFallback) {
      const resultado = {
        lat: resFallback.lat,
        lng: resFallback.lng,
        metodo: 'nominatim' as const,
        direccionLimpia: dirLimpia,
        calleYAltura,
      };
      guardarEnCache(queryPrincipal, resultado);
      guardarEnCache(queryFallback, resultado);
      return resultado;
    }
  }

  // 5. Fallback con tabla de referencia por localidad
  const locKey = locLimpia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

  for (const [key, coords] of Object.entries(COORDENADAS_REFERENCIA)) {
    if (locKey.includes(key) || key.includes(locKey)) {
      // Agregar pequeño jitter para que no queden exactamente superpuestos
      const jitterLat = (Math.random() - 0.5) * 0.005;
      const jitterLng = (Math.random() - 0.5) * 0.005;
      const resultado = {
        lat: Number((coords.lat + jitterLat).toFixed(6)),
        lng: Number((coords.lng + jitterLng).toFixed(6)),
        metodo: 'referencia' as const,
        direccionLimpia: dirLimpia,
        calleYAltura: calleYAltura || undefined,
      };
      guardarEnCache(queryPrincipal, resultado);
      return resultado;
    }
  }

  return { lat: 0, lng: 0, metodo: 'no_encontrado' };
}

