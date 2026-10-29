import React from 'react';
import { NodoUTT } from '../types';
import { MapPin, Calendar, Phone, MessageCircle, Navigation, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface TarjetaNodoProps {
  nodo: NodoUTT;
  esSeleccionado: boolean;
  onSeleccionar: (nodo: NodoUTT) => void;
  esModoAdmin?: boolean;
}

const REGION_BADGES: Record<string, string> = {
  CABA: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Norte: 'bg-sky-50 text-sky-800 border-sky-200',
  Sur: 'bg-amber-50 text-amber-800 border-amber-200',
  Oeste: 'bg-purple-50 text-purple-800 border-purple-200',
  Otra: 'bg-stone-100 text-stone-700 border-stone-200',
};

export const TarjetaNodo: React.FC<TarjetaNodoProps> = ({
  nodo,
  esSeleccionado,
  onSeleccionar,
  esModoAdmin = false,
}) => {
  const badgeColor = REGION_BADGES[nodo.region] || REGION_BADGES.Otra;

  return (
    <div
      onClick={() => onSeleccionar(nodo)}
      className={`group p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
        esSeleccionado
          ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md translate-y-[-1px]'
          : 'border-stone-200/90 hover:border-emerald-400 hover:shadow-xs'
      }`}
    >
      {/* Encabezado de la tarjeta: Región, Estado y Nombre */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${badgeColor}`}>
            {nodo.region === 'CABA' ? 'CABA' : `Zona ${nodo.region}`}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            📍 {nodo.localidad}
          </span>
          {nodo.distanciaTexto && (
            <span className="text-xs bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              a {nodo.distanciaTexto}
            </span>
          )}
        </div>

        {esModoAdmin && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              nodo.estado === 'activo'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-stone-200 text-stone-700'
            }`}
          >
            {nodo.estado === 'activo' ? 'Activo' : 'Inactivo'}
          </span>
        )}
      </div>

      {/* Nombre del Nodo */}
      <h4 className="font-bold text-base text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors">
        {nodo.nombre}
      </h4>

      {/* Dirección */}
      <div className="mt-1.5 text-xs text-stone-600 flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
        <span>
          {nodo.mostrar_direccion_publica || esModoAdmin ? (
            <span className="font-medium text-stone-800">{nodo.direccion}</span>
          ) : (
            <span className="text-stone-500 italic">
              {nodo.localidad} <span className="text-[11px] text-stone-400">(dirección exacta al coordinar entrega)</span>
            </span>
          )}
        </span>
      </div>

      {/* Días de Entrega y Teléfono */}
      <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-700">
          <Calendar className="w-3.5 h-3.5 text-emerald-700" />
          <span className="font-medium bg-stone-100 px-2 py-0.5 rounded text-stone-800">
            {nodo.dias_entrega}
          </span>
        </div>

        {nodo.telefono && (
          <div className="flex items-center gap-1 text-stone-500">
            <Phone className="w-3 h-3 text-stone-400" />
            <span>{nodo.telefono}</span>
          </div>
        )}
      </div>

      {/* Botones de acción rápida: WhatsApp y Ver en Mapa */}
      <div className="mt-3 pt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {nodo.whatsapp_url ? (
          <a
            href={nodo.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-xl text-xs transition-colors shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Pedir por WhatsApp</span>
          </a>
        ) : (
          <div className="flex-1 text-center py-2 text-xs text-stone-400 italic bg-stone-50 rounded-xl">
            Sin WhatsApp
          </div>
        )}

        <button
          type="button"
          onClick={() => onSeleccionar(nodo)}
          className="inline-flex items-center justify-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer"
          title="Ver este punto en el mapa"
        >
          <Navigation className="w-3.5 h-3.5 text-stone-600" />
          <span className="hidden sm:inline">Ubicar</span>
        </button>
      </div>
    </div>
  );
};
