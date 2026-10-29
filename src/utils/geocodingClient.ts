import { NodoUTT } from '../types';

/**
 * Normaliza cadenas de texto para comparaciones geográficas insensibles a mayúsculas,
 * tildes y caracteres especiales.
 */
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ') // Reemplaza signos de puntuación por espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Diccionario de coordenadas de referencia para barrios de la Ciudad de Buenos Aires
 * y principales localidades del Gran Buenos Aires (Norte, Sur, Oeste) y La Plata.
 * Permite resolución instantánea sin latencia de red ni dependencia de cuotas.
 */
export const COORDENADAS_BARRIOS_Y_LOCALIDADES: Record<
  string,
  { lat: number; lng: number; nombreOficial: string; region: string }
> = {
  // ==========================================
  // CABA (48 Barrios oficiales y alias comunes)
  // ==========================================
  'villa del parque': { lat: -34.6074, lng: -58.4904, nombreOficial: 'Villa del Parque', region: 'CABA' },
  'villa del par': { lat: -34.6074, lng: -58.4904, nombreOficial: 'Villa del Parque', region: 'CABA' },
  'v del parque': { lat: -34.6074, lng: -58.4904, nombreOficial: 'Villa del Parque', region: 'CABA' },
  'del parque': { lat: -34.6074, lng: -58.4904, nombreOficial: 'Villa del Parque', region: 'CABA' },

  'villa devoto': { lat: -34.6006, lng: -58.5133, nombreOficial: 'Villa Devoto', region: 'CABA' },
  devoto: { lat: -34.6006, lng: -58.5133, nombreOficial: 'Villa Devoto', region: 'CABA' },

  agronomia: { lat: -34.5947, lng: -58.4839, nombreOficial: 'Agronomía', region: 'CABA' },

  'la paternal': { lat: -34.6000, lng: -58.4680, nombreOficial: 'La Paternal', region: 'CABA' },
  paternal: { lat: -34.6000, lng: -58.4680, nombreOficial: 'La Paternal', region: 'CABA' },

  'villa santa rita': { lat: -34.6180, lng: -58.4820, nombreOficial: 'Villa Santa Rita', region: 'CABA' },
  'santa rita': { lat: -34.6180, lng: -58.4820, nombreOficial: 'Villa Santa Rita', region: 'CABA' },

  'villa general mitre': { lat: -34.6105, lng: -58.4715, nombreOficial: 'Villa General Mitre', region: 'CABA' },
  'general mitre': { lat: -34.6105, lng: -58.4715, nombreOficial: 'Villa General Mitre', region: 'CABA' },

  'monte castro': { lat: -34.6225, lng: -58.5028, nombreOficial: 'Monte Castro', region: 'CABA' },
  'villa real': { lat: -34.6210, lng: -58.5250, nombreOficial: 'Villa Real', region: 'CABA' },
  versalles: { lat: -34.6280, lng: -58.5240, nombreOficial: 'Versalles', region: 'CABA' },
  'villa luro': { lat: -34.6390, lng: -58.5040, nombreOficial: 'Villa Luro', region: 'CABA' },
  liniers: { lat: -34.6477, lng: -58.5244, nombreOficial: 'Liniers', region: 'CABA' },
  mataderos: { lat: -34.6593, lng: -58.5029, nombreOficial: 'Mataderos', region: 'CABA' },
  'parque avellaneda': { lat: -34.6490, lng: -58.4790, nombreOficial: 'Parque Avellaneda', region: 'CABA' },

  floresta: { lat: -34.6318, lng: -58.4816, nombreOficial: 'Floresta', region: 'CABA' },
  flores: { lat: -34.6289, lng: -58.4633, nombreOficial: 'Flores', region: 'CABA' },
  'parque chacabuco': { lat: -34.6340, lng: -58.4410, nombreOficial: 'Parque Chacabuco', region: 'CABA' },
  caballito: { lat: -34.6192, lng: -58.4447, nombreOficial: 'Caballito', region: 'CABA' },
  almagro: { lat: -34.6111, lng: -58.4215, nombreOficial: 'Almagro', region: 'CABA' },
  boedo: { lat: -34.6298, lng: -58.4162, nombreOficial: 'Boedo', region: 'CABA' },

  'villa crespo': { lat: -34.5975, lng: -58.4428, nombreOficial: 'Villa Crespo', region: 'CABA' },
  crespo: { lat: -34.5975, lng: -58.4428, nombreOficial: 'Villa Crespo', region: 'CABA' },

  chacarita: { lat: -34.5878, lng: -58.4552, nombreOficial: 'Chacarita', region: 'CABA' },
  'villa ortuzar': { lat: -34.5800, lng: -58.4700, nombreOficial: 'Villa Ortúzar', region: 'CABA' },
  'parque chas': { lat: -34.5850, lng: -58.4800, nombreOficial: 'Parque Chas', region: 'CABA' },

  'villa urquiza': { lat: -34.5746, lng: -58.4878, nombreOficial: 'Villa Urquiza', region: 'CABA' },
  urquiza: { lat: -34.5746, lng: -58.4878, nombreOficial: 'Villa Urquiza', region: 'CABA' },

  'villa pueyrredon': { lat: -34.5828, lng: -58.5042, nombreOficial: 'Villa Pueyrredón', region: 'CABA' },
  pueyrredon: { lat: -34.5828, lng: -58.5042, nombreOficial: 'Villa Pueyrredón', region: 'CABA' },

  coghlan: { lat: -34.5660, lng: -58.4760, nombreOficial: 'Coghlan', region: 'CABA' },
  saavedra: { lat: -34.5516, lng: -58.4891, nombreOficial: 'Saavedra', region: 'CABA' },
  nunez: { lat: -34.5457, lng: -58.4638, nombreOficial: 'Núñez', region: 'CABA' },
  belgrano: { lat: -34.5627, lng: -58.4564, nombreOficial: 'Belgrano', region: 'CABA' },
  colegiales: { lat: -34.5772, lng: -58.4497, nombreOficial: 'Colegiales', region: 'CABA' },

  palermo: { lat: -34.5889, lng: -58.4306, nombreOficial: 'Palermo', region: 'CABA' },
  'palermo soho': { lat: -34.5884, lng: -58.4260, nombreOficial: 'Palermo Soho', region: 'CABA' },
  'palermo hollywood': { lat: -34.5810, lng: -58.4350, nombreOficial: 'Palermo Hollywood', region: 'CABA' },

  recoleta: { lat: -34.5895, lng: -58.3974, nombreOficial: 'Recoleta', region: 'CABA' },
  retiro: { lat: -34.5930, lng: -58.3770, nombreOficial: 'Retiro', region: 'CABA' },
  balvanera: { lat: -34.6100, lng: -58.4050, nombreOficial: 'Balvanera', region: 'CABA' },
  once: { lat: -34.6080, lng: -58.4070, nombreOficial: 'Once (Balvanera)', region: 'CABA' },
  'san cristobal': { lat: -34.6230, lng: -58.4000, nombreOficial: 'San Cristóbal', region: 'CABA' },
  'san nicolas': { lat: -34.6050, lng: -58.3810, nombreOficial: 'San Nicolás', region: 'CABA' },
  centro: { lat: -34.6037, lng: -58.3816, nombreOficial: 'Centro CABA', region: 'CABA' },
  monserrat: { lat: -34.6130, lng: -58.3840, nombreOficial: 'Monserrat', region: 'CABA' },
  montserrat: { lat: -34.6130, lng: -58.3840, nombreOficial: 'Monserrat', region: 'CABA' },
  'san telmo': { lat: -34.6212, lng: -58.3731, nombreOficial: 'San Telmo', region: 'CABA' },
  constitucion: { lat: -34.6277, lng: -58.3816, nombreOficial: 'Constitución', region: 'CABA' },
  barracas: { lat: -34.6460, lng: -58.3850, nombreOficial: 'Barracas', region: 'CABA' },
  'la boca': { lat: -34.6340, lng: -58.3630, nombreOficial: 'La Boca', region: 'CABA' },
  'parque patricios': { lat: -34.6375, lng: -58.4064, nombreOficial: 'Parque Patricios', region: 'CABA' },
  'nueva pompeya': { lat: -34.6510, lng: -58.4190, nombreOficial: 'Nueva Pompeya', region: 'CABA' },
  pompeya: { lat: -34.6510, lng: -58.4190, nombreOficial: 'Nueva Pompeya', region: 'CABA' },
  'villa lugano': { lat: -34.6750, lng: -58.4720, nombreOficial: 'Villa Lugano', region: 'CABA' },
  lugano: { lat: -34.6750, lng: -58.4720, nombreOficial: 'Villa Lugano', region: 'CABA' },
  'villa soldati': { lat: -34.6640, lng: -58.4480, nombreOficial: 'Villa Soldati', region: 'CABA' },
  'villa riachuelo': { lat: -34.6930, lng: -58.4650, nombreOficial: 'Villa Riachuelo', region: 'CABA' },
  'puerto madero': { lat: -34.6130, lng: -58.3620, nombreOficial: 'Puerto Madero', region: 'CABA' },

  // ==========================================
  // ZONA NORTE
  // ==========================================
  'vicente lopez': { lat: -34.5273, lng: -58.4735, nombreOficial: 'Vicente López', region: 'Norte' },
  olivos: { lat: -34.5097, lng: -58.4907, nombreOficial: 'Olivos', region: 'Norte' },
  florida: { lat: -34.5367, lng: -58.4872, nombreOficial: 'Florida', region: 'Norte' },
  'florida oeste': { lat: -34.5420, lng: -58.5080, nombreOficial: 'Florida Oeste', region: 'Norte' },
  'la lucila': { lat: -34.5005, lng: -58.4915, nombreOficial: 'La Lucila', region: 'Norte' },
  martinez: { lat: -34.4925, lng: -58.5034, nombreOficial: 'Martínez', region: 'Norte' },
  acassuso: { lat: -34.4795, lng: -58.5041, nombreOficial: 'Acassuso', region: 'Norte' },
  'san isidro': { lat: -34.4722, lng: -58.5281, nombreOficial: 'San Isidro', region: 'Norte' },
  beccar: { lat: -34.4578, lng: -58.5397, nombreOficial: 'Beccar', region: 'Norte' },
  victoria: { lat: -34.4485, lng: -58.5492, nombreOficial: 'Victoria', region: 'Norte' },
  'san fernando': { lat: -34.4428, lng: -58.5636, nombreOficial: 'San Fernando', region: 'Norte' },
  tigre: { lat: -34.4261, lng: -58.5796, nombreOficial: 'Tigre', region: 'Norte' },
  'rincon de milberg': { lat: -34.4100, lng: -58.6000, nombreOficial: 'Rincón de Milberg', region: 'Norte' },
  benavidez: { lat: -34.3980, lng: -58.6830, nombreOficial: 'Benavídez', region: 'Norte' },
  'don torcuato': { lat: -34.4980, lng: -58.6320, nombreOficial: 'Don Torcuato', region: 'Norte' },
  'general pacheco': { lat: -34.4600, lng: -58.6500, nombreOficial: 'General Pacheco', region: 'Norte' },
  pacheco: { lat: -34.4600, lng: -58.6500, nombreOficial: 'General Pacheco', region: 'Norte' },

  'san martin': { lat: -34.5768, lng: -58.5375, nombreOficial: 'General San Martín', region: 'Norte' },
  'general san martin': { lat: -34.5768, lng: -58.5375, nombreOficial: 'General San Martín', region: 'Norte' },
  'villa ballester': { lat: -34.5511, lng: -58.5558, nombreOficial: 'Villa Ballester', region: 'Norte' },
  ballester: { lat: -34.5511, lng: -58.5558, nombreOficial: 'Villa Ballester', region: 'Norte' },
  'villa lynch': { lat: -34.5890, lng: -58.5270, nombreOficial: 'Villa Lynch', region: 'Norte' },
  'villa maipu': { lat: -34.5750, lng: -58.5150, nombreOficial: 'Villa Maipú', region: 'Norte' },
  munro: { lat: -34.5290, lng: -58.5220, nombreOficial: 'Munro', region: 'Norte' },
  carapachay: { lat: -34.5280, lng: -58.5380, nombreOficial: 'Carapachay', region: 'Norte' },
  'villa adelina': { lat: -34.5180, lng: -58.5440, nombreOficial: 'Villa Adelina', region: 'Norte' },
  boulogne: { lat: -34.4980, lng: -58.5630, nombreOficial: 'Boulogne', region: 'Norte' },

  // ==========================================
  // ZONA SUR
  // ==========================================
  avellaneda: { lat: -34.6617, lng: -58.3664, nombreOficial: 'Avellaneda', region: 'Sur' },
  'dock sud': { lat: -34.6490, lng: -58.3530, nombreOficial: 'Dock Sud', region: 'Sur' },
  sarandi: { lat: -34.6810, lng: -58.3490, nombreOficial: 'Sarandí', region: 'Sur' },
  'villa dominico': { lat: -34.6920, lng: -58.3370, nombreOficial: 'Villa Domínico', region: 'Sur' },
  wilde: { lat: -34.7000, lng: -58.3180, nombreOficial: 'Wilde', region: 'Sur' },
  gerli: { lat: -34.6870, lng: -58.3840, nombreOficial: 'Gerli', region: 'Sur' },

  lanus: { lat: -34.7046, lng: -58.3906, nombreOficial: 'Lanús', region: 'Sur' },
  'lanus oeste': { lat: -34.7061, lng: -58.4019, nombreOficial: 'Lanús Oeste', region: 'Sur' },
  'lanus este': { lat: -34.7050, lng: -58.3750, nombreOficial: 'Lanús Este', region: 'Sur' },
  'remedios de escalada': { lat: -34.7260, lng: -58.3950, nombreOficial: 'Remedios de Escalada', region: 'Sur' },
  escalada: { lat: -34.7260, lng: -58.3950, nombreOficial: 'Remedios de Escalada', region: 'Sur' },
  'valentin alsina': { lat: -34.6730, lng: -58.4070, nombreOficial: 'Valentín Alsina', region: 'Sur' },

  banfield: { lat: -34.7439, lng: -58.3947, nombreOficial: 'Banfield', region: 'Sur' },
  'lomas de zamora': { lat: -34.7607, lng: -58.4019, nombreOficial: 'Lomas de Zamora', region: 'Sur' },
  lomas: { lat: -34.7607, lng: -58.4019, nombreOficial: 'Lomas de Zamora', region: 'Sur' },
  temperley: { lat: -34.7738, lng: -58.3967, nombreOficial: 'Temperley', region: 'Sur' },
  turdera: { lat: -34.7870, lng: -58.4030, nombreOficial: 'Turdera', region: 'Sur' },
  llavallol: { lat: -34.8050, lng: -58.4310, nombreOficial: 'Llavallol', region: 'Sur' },

  adrogue: { lat: -34.7989, lng: -58.3908, nombreOficial: 'Adrogué', region: 'Sur' },
  burzaco: { lat: -34.8291, lng: -58.3962, nombreOficial: 'Burzaco', region: 'Sur' },
  'rafael calzada': { lat: -34.8080, lng: -58.3680, nombreOficial: 'Rafael Calzada', region: 'Sur' },
  claypole: { lat: -34.8210, lng: -58.3410, nombreOficial: 'Claypole', region: 'Sur' },
  longchamps: { lat: -34.8590, lng: -58.3890, nombreOficial: 'Longchamps', region: 'Sur' },
  glew: { lat: -34.8870, lng: -58.3840, nombreOficial: 'Glew', region: 'Sur' },

  quilmes: { lat: -34.7242, lng: -58.2528, nombreOficial: 'Quilmes', region: 'Sur' },
  bernal: { lat: -34.7064, lng: -58.2814, nombreOficial: 'Bernal', region: 'Sur' },
  'don bosco': { lat: -34.6970, lng: -58.2930, nombreOficial: 'Don Bosco', region: 'Sur' },
  ezpeleta: { lat: -34.7523, lng: -58.2435, nombreOficial: 'Ezpeleta', region: 'Sur' },
  'san francisco solano': { lat: -34.7790, lng: -58.3180, nombreOficial: 'San Francisco Solano', region: 'Sur' },
  solano: { lat: -34.7790, lng: -58.3180, nombreOficial: 'San Francisco Solano', region: 'Sur' },

  berazategui: { lat: -34.7634, lng: -58.2131, nombreOficial: 'Berazategui', region: 'Sur' },
  ranelagh: { lat: -34.7920, lng: -58.2040, nombreOficial: 'Ranelagh', region: 'Sur' },
  hudson: { lat: -34.7930, lng: -58.1560, nombreOficial: 'Hudson', region: 'Sur' },

  'florencio varela': { lat: -34.7970, lng: -58.2780, nombreOficial: 'Florencio Varela', region: 'Sur' },
  varela: { lat: -34.7970, lng: -58.2780, nombreOficial: 'Florencio Varela', region: 'Sur' },

  'la plata': { lat: -34.9215, lng: -57.9545, nombreOficial: 'La Plata', region: 'Sur' },
  'city bell': { lat: -34.8697, lng: -58.0494, nombreOficial: 'City Bell', region: 'Sur' },
  'villa elisa': { lat: -34.8519, lng: -58.0772, nombreOficial: 'Villa Elisa', region: 'Sur' },
  gonnet: { lat: -34.8870, lng: -58.0190, nombreOficial: 'Gonnet', region: 'Sur' },
  ringuelet: { lat: -34.8960, lng: -57.9890, nombreOficial: 'Ringuelet', region: 'Sur' },
  tolosa: { lat: -34.9020, lng: -57.9690, nombreOficial: 'Tolosa', region: 'Sur' },
  'los hornos': { lat: -34.9540, lng: -57.9880, nombreOficial: 'Los Hornos', region: 'Sur' },
  berisso: { lat: -34.8720, lng: -57.8820, nombreOficial: 'Berisso', region: 'Sur' },
  ensenada: { lat: -34.8610, lng: -57.9090, nombreOficial: 'Ensenada', region: 'Sur' },

  // ==========================================
  // ZONA OESTE
  // ==========================================
  moron: { lat: -34.6534, lng: -58.6198, nombreOficial: 'Morón', region: 'Oeste' },
  castelar: { lat: -34.6565, lng: -58.6416, nombreOficial: 'Castelar', region: 'Oeste' },
  haedo: { lat: -34.6465, lng: -58.5956, nombreOficial: 'Haedo', region: 'Oeste' },
  'el palomar': { lat: -34.6083, lng: -58.5917, nombreOficial: 'El Palomar', region: 'Oeste' },
  palomar: { lat: -34.6083, lng: -58.5917, nombreOficial: 'El Palomar', region: 'Oeste' },

  'ramos mejia': { lat: -34.6493, lng: -58.5638, nombreOficial: 'Ramos Mejía', region: 'Oeste' },
  ramos: { lat: -34.6493, lng: -58.5638, nombreOficial: 'Ramos Mejía', region: 'Oeste' },
  'san justo': { lat: -34.6828, lng: -58.5619, nombreOficial: 'San Justo', region: 'Oeste' },
  'villa luzuriaga': { lat: -34.6750, lng: -58.5850, nombreOficial: 'Villa Luzuriaga', region: 'Oeste' },
  'ciudad evita': { lat: -34.7230, lng: -58.5340, nombreOficial: 'Ciudad Evita', region: 'Oeste' },
  'isidro casanova': { lat: -34.7080, lng: -58.5860, nombreOficial: 'Isidro Casanova', region: 'Oeste' },
  'gregorio de laferrere': { lat: -34.7480, lng: -58.5890, nombreOficial: 'Gregorio de Laferrere', region: 'Oeste' },
  laferrere: { lat: -34.7480, lng: -58.5890, nombreOficial: 'Gregorio de Laferrere', region: 'Oeste' },
  ciudadela: { lat: -34.6360, lng: -58.5410, nombreOficial: 'Ciudadela', region: 'Oeste' },

  'tres de febrero': { lat: -34.6067, lng: -58.5644, nombreOficial: 'Tres de Febrero', region: 'Oeste' },
  caseros: { lat: -34.6074, lng: -58.5658, nombreOficial: 'Caseros', region: 'Oeste' },
  'santos lugares': { lat: -34.5980, lng: -58.5480, nombreOficial: 'Santos Lugares', region: 'Oeste' },
  'saenz pena': { lat: -34.5960, lng: -58.5290, nombreOficial: 'Sáenz Peña', region: 'Oeste' },
  'villa bosch': { lat: -34.5920, lng: -58.5770, nombreOficial: 'Villa Bosch', region: 'Oeste' },
  'martin coronado': { lat: -34.5880, lng: -58.5910, nombreOficial: 'Martín Coronado', region: 'Oeste' },

  ituzaingo: { lat: -34.6583, lng: -58.6722, nombreOficial: 'Ituzaingó', region: 'Oeste' },
  'san antonio de padua': { lat: -34.6640, lng: -58.6980, nombreOficial: 'San Antonio de Padua', region: 'Oeste' },
  padua: { lat: -34.6640, lng: -58.6980, nombreOficial: 'San Antonio de Padua', region: 'Oeste' },
  merlo: { lat: -34.6653, lng: -58.7289, nombreOficial: 'Merlo', region: 'Oeste' },
  'paso del rey': { lat: -34.6517, lng: -58.7497, nombreOficial: 'Paso del Rey', region: 'Oeste' },
  moreno: { lat: -34.6508, lng: -58.7906, nombreOficial: 'Moreno', region: 'Oeste' },

  hurlingham: { lat: -34.5965, lng: -58.6369, nombreOficial: 'Hurlingham', region: 'Oeste' },
  'villa tesei': { lat: -34.6180, lng: -58.6360, nombreOficial: 'Villa Tesei', region: 'Oeste' },
  'william morris': { lat: -34.5770, lng: -58.6530, nombreOficial: 'William Morris', region: 'Oeste' },

  'san miguel': { lat: -34.5420, lng: -58.7120, nombreOficial: 'San Miguel', region: 'Oeste' },
  'bella vista': { lat: -34.5680, lng: -58.6900, nombreOficial: 'Bella Vista', region: 'Oeste' },
};

/**
 * Fórmula de Haversine para calcular la distancia en kilómetros entre dos coordenadas geográficas.
 */
export function calcularDistanciaHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formatea una distancia en kilómetros de manera legible para vecinas y vecinos.
 * Si es menor a 1 km, muestra metros (ej. "850 m"). Si es mayor, muestra con un decimal (ej. "1.4 km").
 */
export function formatearDistancia(km: number): string {
  if (km < 1) {
    const metros = Math.round(km * 1000);
    return `${metros} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Intenta resolver una ubicación geográfica a partir del texto ingresado por el usuario.
 * 1. Primero busca en el diccionario local de barrios / localidades (0ms, sin red).
 * 2. Si no coincide de forma exacta, busca coincidencias parciales (ej. "villa del par" -> "villa del parque").
 * 3. Si no encuentra en el diccionario, llama al backend /api/geocode como fallback.
 */
export async function geocodificarTextoBuscado(
  texto: string
): Promise<{ lat: number; lng: number; nombre: string; region?: string } | null> {
  const limpio = normalizarTexto(texto);
  if (!limpio || limpio.length < 3) return null;

  const tieneNumeracion = /\d+/.test(texto);

  // 1. Si contiene números (ej. "Río Cuarto 4880", "Díaz Vélez 3761"), consultar primero la geocodificación exacta
  if (tieneNumeracion) {
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion: texto,
          localidad: 'Buenos Aires',
          provincia: 'Buenos Aires',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lng && data.lat !== 0 && data.lng !== 0) {
          return {
            lat: data.lat,
            lng: data.lng,
            nombre: texto.trim(),
          };
        }
      }
    } catch (err) {
      console.warn('Geocodificación remota con numeración falló, probando diccionario:', err);
    }
  }

  // 2. Coincidencia exacta en diccionario
  if (COORDENADAS_BARRIOS_Y_LOCALIDADES[limpio]) {
    const item = COORDENADAS_BARRIOS_Y_LOCALIDADES[limpio];
    return {
      lat: item.lat,
      lng: item.lng,
      nombre: item.nombreOficial,
      region: item.region,
    };
  }

  // 3. Coincidencia de prefijo o subcadena en diccionario (ej. "villa del par" -> "Villa del Parque")
  for (const [clave, item] of Object.entries(COORDENADAS_BARRIOS_Y_LOCALIDADES)) {
    if (clave.startsWith(limpio) || limpio.startsWith(clave) || clave.includes(limpio) || limpio.includes(clave)) {
      return {
        lat: item.lat,
        lng: item.lng,
        nombre: item.nombreOficial,
        region: item.region,
      };
    }
  }

  // 4. Fallback a la API de geocodificación si no tenía numeración y no estaba en el diccionario
  if (!tieneNumeracion) {
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direccion: texto,
          localidad: 'Buenos Aires',
          provincia: 'Buenos Aires',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat && data.lng && data.lat !== 0 && data.lng !== 0) {
          return {
            lat: data.lat,
            lng: data.lng,
            nombre: texto.trim(),
          };
        }
      }
    } catch (err) {
      console.warn('Geocodificación remota fallback falló:', err);
    }
  }

  return null;
}

/**
 * Toma una lista de nodos y devuelve los N más cercanos a una coordenada de referencia,
 * ordenados por distancia ascendente e inyectando `distanciaKm` y `distanciaTexto`.
 */
export function obtenerNodosMasCercanos(
  nodos: NodoUTT[],
  latRef: number,
  lngRef: number,
  limite: number = 4
): NodoUTT[] {
  const nodosConDistancia = nodos
    .filter((n) => n.latitud !== null && n.longitud !== null && n.latitud !== 0 && n.longitud !== 0)
    .map((nodo) => {
      const dist = calcularDistanciaHaversine(latRef, lngRef, nodo.latitud!, nodo.longitud!);
      return {
        ...nodo,
        distanciaKm: dist,
        distanciaTexto: formatearDistancia(dist),
      };
    });

  nodosConDistancia.sort((a, b) => a.distanciaKm! - b.distanciaKm!);

  return nodosConDistancia.slice(0, limite);
}
