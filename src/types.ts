export type Region = 'CABA' | 'Norte' | 'Sur' | 'Oeste' | 'Otra';

export type DiaEntrega = 'Jueves' | 'Sábados' | 'Ambos días' | 'A coordinar';

export interface NodoUTT {
  id: string;
  nombre: string;
  direccion: string; // Dirección en texto libre
  localidad: string; // Localidad o barrio
  provincia?: string;
  region: Region;
  telefono: string;
  whatsapp_url?: string;
  dias_entrega: DiaEntrega;
  latitud: number | null;
  longitud: number | null;
  estado: 'activo' | 'inactivo';
  mostrar_direccion_publica: boolean;
  geocodificado_ok: boolean;
  fecha_actualizacion: string;
  distanciaKm?: number;
  distanciaTexto?: string;
  datos_originales?: {
    region_raw?: string;
    dias_raw?: string;
    localidad_raw?: string;
    telefono_raw?: string;
    direccion_raw?: string;
  };
}

export interface ReporteGeocodificacion {
  total_procesados: number;
  geocodificados_ok: number;
  sin_coordenadas: number;
  nodos_sin_coordenadas: Array<{
    id: string;
    nombre: string;
    direccion: string;
    localidad: string;
  }>;
  fecha: string;
}
