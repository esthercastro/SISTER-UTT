/**
 * Utilidades para sanitización, limpieza y extracción de direcciones en Argentina.
 * Soporta direcciones complejas, largas o copiadas directamente desde Google Maps
 * (ej. "Arco 3 y 4, Av. del Libertador 3883, C1425 ABL, Cdad. Autónoma de Buenos Aires").
 */

/**
 * Sanitiza y limpia el string de consulta antes de enviarlo a Nominatim u otros servicios de geocodificación.
 */
export function cleanAddressQuery(raw?: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // 1. Normalizar abreviaturas usuales de CABA y provincias
  text = text.replace(/\bCdad\.?\s+Aut[oó]noma\s+de\s+Buenos\s+Aires\b/gi, 'Ciudad Autónoma de Buenos Aires');
  text = text.replace(/\bCdad\.?\s+de\s+Buenos\s+Aires\b/gi, 'Ciudad Autónoma de Buenos Aires');
  text = text.replace(/\bC\.A\.B\.A\.?\b/gi, 'Ciudad Autónoma de Buenos Aires');
  text = text.replace(/\bProv\.?\s+de\s+Buenos\s+Aires\b/gi, 'Buenos Aires');
  text = text.replace(/\bPcia\.?\s+de\s+Buenos\s+Aires\b/gi, 'Buenos Aires');
  text = text.replace(/\bCap\.?\s+Fed\.?\b/gi, 'Ciudad Autónoma de Buenos Aires');

  // 2. Eliminar códigos postales argentinos CPA (ej. C1425 ABL, B1638XYZ, C1425) y tradicionales
  // CPA completo (una letra + 4 dígitos + espacio opcional + 3 letras)
  text = text.replace(/\b[A-Za-z]\d{4}\s?[A-Za-z]{3}\b/g, '');
  // CPA abreviado (una letra + 4 dígitos, ej. C1425, B1638)
  text = text.replace(/\b[A-Za-z]\d{4}\b/g, '');
  // CP explícito con 4 o 5 dígitos (ej. CP 1425, Código Postal 1425)
  text = text.replace(/\b(?:CP|C\.P\.|C[oó]digo\s+Postal)\s*:?\s*\d{4,5}\b/gi, '');

  // 3. Eliminar referencias de arcos, pisos, departamentos, locales, oficinas, etc.
  text = text.replace(/\bArcos?\s+\d+(\s*(y|e|-)\s*\d+)?\b/gi, '');
  text = text.replace(/\b(?:Piso\s+\d+º?|\d+º?\s*piso)\b/gi, '');
  text = text.replace(/\b(?:Depto|Departamento|Dto|Dpto)\.?\s*[A-Za-z0-9-]+\b/gi, '');
  text = text.replace(/\bLocal\s+[A-Za-z0-9-]+\b/gi, '');
  text = text.replace(/\b(?:Oficina|Of\.?)\s*[A-Za-z0-9-]+\b/gi, '');
  text = text.replace(/\b(?:PB|Planta\s+Baja)\b/gi, '');
  text = text.replace(/\b(?:Torre|Edificio|Entrada|Puerta|Lote|Mza|Manzana)\s*[A-Za-z0-9-]+\b/gi, '');

  // 4. Limpieza de puntuación, comas repetidas y espacios
  text = text.replace(/[;]/g, ',');
  text = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');

  return text.trim();
}

/**
 * Extrae de forma inteligente únicamente el patrón [Nombre de Calle/Avenida + Altura numérica]
 * (por ejemplo "Av. del Libertador 3883" de "Arco 3 y 4, Av. del Libertador 3883, C1425 ABL...").
 */
export function extraerCalleYAltura(raw?: string): string | null {
  if (!raw) return null;
  // Limpiar primero posibles códigos postales, pisos o arcos para no confundir números
  const sinRuido = raw
    .replace(/\bArcos?\s+\d+(\s*(y|e|-)\s*\d+)?\b/gi, '')
    .replace(/\b(?:Piso\s+\d+º?|\d+º?\s*piso)\b/gi, '')
    .replace(/\b(?:Depto|Departamento|Dto|Dpto)\.?\s*[A-Za-z0-9-]+\b/gi, '')
    .replace(/\bLocal\s+[A-Za-z0-9-]+\b/gi, '')
    .replace(/\b[A-Za-z]\d{4}\s?[A-Za-z]{3}\b/g, '')
    .replace(/\b[A-Za-z]\d{4}\b/g, '');

  // 1. Probar en los segmentos separados por comas
  const partes = sinRuido.split(',').map((p) => p.trim());
  for (const parte of partes) {
    const match = parte.match(
      /((?:(?:Av\.|Avda\.|Avenida|Bv\.|Boulevard|Calle|Pje\.|Pasaje)\s+)?[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.]{3,40}?)\s+(\d{1,5})\b/
    );
    if (match) {
      const candidato = match[0].trim();
      if (/[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(candidato)) {
        return candidato;
      }
    }
  }

  // 2. Probar en la cadena completa
  const matchGlobal = sinRuido.match(
    /((?:(?:Av\.|Avda\.|Avenida|Bv\.|Boulevard|Calle|Pje\.|Pasaje)\s+)?[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s.]{3,40}?)\s+(\d{1,5})\b/
  );
  if (matchGlobal && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/.test(matchGlobal[0])) {
    return matchGlobal[0].trim();
  }

  return null;
}
