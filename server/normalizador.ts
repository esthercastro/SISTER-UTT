import { Region, DiaEntrega } from '../src/types.js';

export function limpiarTexto(texto?: string): string {
  if (!texto) return '';
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ');
}

export function aTitleCase(texto?: string): string {
  if (!texto) return '';
  const preposiciones = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a']);
  return limpiarTexto(texto)
    .toLowerCase()
    .split(' ')
    .map((palabra, index) => {
      if (index > 0 && preposiciones.has(palabra)) {
        return palabra;
      }
      return palabra.charAt(0).toUpperCase() + palabra.slice(1);
    })
    .join(' ');
}

export function normalizarRegion(regionRaw?: string, localidad?: string): Region {
  const reg = (regionRaw || '').toLowerCase().trim();
  const loc = (localidad || '').toLowerCase().trim();

  if (reg.includes('caba') || reg.includes('capital') || loc.includes('caba') || loc.includes('palermo') || loc.includes('almagro') || loc.includes('caballito') || loc.includes('flores')) {
    return 'CABA';
  }
  if (reg.includes('norte') || loc.includes('isidro') || loc.includes('vicente') || loc.includes('tigre') || loc.includes('fernando') || loc.includes('olivos') || loc.includes('san martin')) {
    return 'Norte';
  }
  if (reg.includes('sur') || loc.includes('quilmes') || loc.includes('lanus') || loc.includes('avellaneda') || loc.includes('lomas') || loc.includes('banfield') || loc.includes('la plata') || loc.includes('bernal') || loc.includes('adrogue')) {
    return 'Sur';
  }
  if (reg.includes('oeste') || loc.includes('moron') || loc.includes('castelar') || loc.includes('haedo') || loc.includes('ramos') || loc.includes('merlo') || loc.includes('moreno') || loc.includes('hurlingham') || loc.includes('ituzaingo')) {
    return 'Oeste';
  }

  return 'CABA';
}

export function normalizarDiasEntrega(diasRaw?: string): DiaEntrega {
  if (!diasRaw) return 'Ambos días';
  const str = diasRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (str.includes('ambos') || (str.includes('jueves') && str.includes('sabado'))) {
    return 'Ambos días';
  }
  if (str.includes('jueves')) {
    return 'Jueves';
  }
  if (str.includes('sabado')) {
    return 'Sábados';
  }
  return 'Ambos días';
}

export function normalizarTelefono(telRaw?: string): { display: string; whatsapp_url?: string } {
  if (!telRaw) return { display: 'Sin teléfono' };
  const raw = limpiarTexto(telRaw);
  
  // Extraer solo dígitos
  let digits = raw.replace(/\D/g, '');

  if (!digits || digits.length < 8) {
    return { display: raw };
  }

  // Quitar prefijo internacional si ya lo tiene
  if (digits.startsWith('549')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  // Quitar 0 inicial de código de área si lo tiene (ej: 011 -> 11, 0221 -> 221)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Quitar '15' de celular argentino si está después de código de área 11 o similar
  if (digits.startsWith('1115') && digits.length === 12) {
    digits = '11' + digits.slice(4);
  } else if (digits.length === 11 && digits.includes('15')) {
    // ej 22115xxxxxx
    digits = digits.replace('15', '');
  }

  // Si tiene entre 10 y 11 dígitos, asumimos celular argentino y armamos link a WhatsApp
  let whatsapp_url: string | undefined = undefined;
  if (digits.length >= 10) {
    const mensaje = encodeURIComponent('¡Hola! Te contacto desde el mapa de Nodos UTT para consultar sobre las entregas de alimentos agroecológicos.');
    whatsapp_url = `https://wa.me/549${digits}?text=${mensaje}`;
  }

  // Formato visual amigable
  let display = raw;
  if (digits.startsWith('11') && digits.length === 10) {
    display = `(011) 15-${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length >= 10) {
    display = `(0${digits.slice(0, digits.length - 7)}) 15-${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }

  return { display, whatsapp_url };
}
