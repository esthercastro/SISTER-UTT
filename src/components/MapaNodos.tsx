import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NodoUTT } from '../types';
import { MapPin, Phone, MessageCircle, Calendar, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface MapaNodosProps {
  nodos: NodoUTT[];
  nodoSeleccionado: NodoUTT | null;
  onSeleccionarNodo: (nodo: NodoUTT | null) => void;
  esModoAdmin?: boolean;
}

// Colores según región para una diferenciación visual sutil pero clara
const COLORES_REGION: Record<string, { bg: string; border: string; label: string }> = {
  CABA: { bg: '#15803d', border: '#14532d', label: 'CABA' }, // verde bosque
  Norte: { bg: '#0369a1', border: '#075985', label: 'Zona Norte' }, // azul río
  Sur: { bg: '#b45309', border: '#78350f', label: 'Zona Sur' }, // tierra / ámbar
  Oeste: { bg: '#6b21a8', border: '#581c87', label: 'Zona Oeste' }, // púrpura / morado
  Otra: { bg: '#475569', border: '#1e293b', label: 'Otra' },
};

function crearIconoMarcador(region: string, seleccionado: boolean, inactivo: boolean) {
  const conf = COLORES_REGION[region] || COLORES_REGION.CABA;
  const color = inactivo ? '#94a3b8' : conf.bg;
  const escala = seleccionado ? 'scale(1.2)' : 'scale(1)';
  const zIndex = seleccionado ? 1000 : 100;

  const svgHtml = `
    <div style="transform: ${escala}; transition: transform 0.2s ease; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); z-index: ${zIndex};">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="${color}" stroke="${seleccionado ? '#fef08a' : '#ffffff'}" stroke-width="${seleccionado ? '2.5' : '1.5'}"/>
        <!-- Brote / hoja agroecológica UTT en el centro -->
        <circle cx="17" cy="17" r="11" fill="#ffffff" />
        <path d="M17 11C15 13 13 16 13 19C13 20.5 14 22 15.5 22.5C14.5 20 15.5 17 17 15C18.5 17 19.5 20 18.5 22.5C20 22 21 20.5 21 19C21 16 19 13 17 11Z" fill="${color}"/>
        <path d="M17 15V22" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      ${seleccionado ? '<div style="width: 8px; height: 8px; background: #facc15; border-radius: 50%; margin-top: -3px; box-shadow: 0 0 8px #facc15;"></div>' : ''}
    </div>
  `;

  return L.divIcon({
    className: 'utt-marker-custom',
    html: svgHtml,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -42],
  });
}

export const MapaNodos: React.FC<MapaNodosProps> = ({
  nodos,
  nodoSeleccionado,
  onSeleccionarNodo,
  esModoAdmin = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Coordenadas centrales por defecto: Área Metropolitana de Buenos Aires
    const mapa = L.map(mapContainerRef.current, {
      center: [-34.615, -58.44],
      zoom: 11,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
    });

    // Control de zoom en la esquina superior derecha
    L.control.zoom({ position: 'topright' }).addTo(mapa);

    // Capa de teselas de OpenStreetMap libre y sin API keys requeridas
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contribuyentes | Red Territorial UTT',
      maxZoom: 19,
    }).addTo(mapa);

    mapInstanceRef.current = mapa;

    // Redimensionar automáticamente si cambia el tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      mapa.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      mapa.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Actualizar marcadores cuando cambian los nodos o el modo
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let cantidadValidos = 0;

    nodos.forEach((nodo) => {
      if (!nodo.latitud || !nodo.longitud) return;

      // En vista pública mostramos solo activos; en admin mostramos todos
      if (!esModoAdmin && nodo.estado !== 'activo') return;

      const esSeleccionado = nodoSeleccionado?.id === nodo.id;
      const icono = crearIconoMarcador(nodo.region, esSeleccionado, nodo.estado === 'inactivo');

      const marker = L.marker([nodo.latitud, nodo.longitud], {
        icon: icono,
        title: nodo.nombre,
      });

      // Contenido del Popup en español rioplatense
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1 font-sans text-stone-800';

      const tagRegionColor =
        nodo.region === 'CABA'
          ? 'bg-emerald-100 text-emerald-800'
          : nodo.region === 'Norte'
          ? 'bg-sky-100 text-sky-800'
          : nodo.region === 'Sur'
          ? 'bg-amber-100 text-amber-800'
          : 'bg-purple-100 text-purple-800';

      popupHtml.innerHTML = `
        <div class="border-b border-stone-200 pb-2 mb-2">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${tagRegionColor}">
              ${nodo.region}
            </span>
            ${
              nodo.estado === 'inactivo'
                ? '<span class="text-xs bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded">Inactivo</span>'
                : '<span class="text-xs bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">● Activo</span>'
            }
          </div>
          <h3 class="font-bold text-base text-stone-900 leading-snug">${nodo.nombre}</h3>
          <p class="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
            <strong>Barrio/Localidad:</strong> ${nodo.localidad}
          </p>
        </div>

        <div class="space-y-1.5 text-xs text-stone-700 mb-3">
          <div class="flex items-start gap-1.5">
            <span class="font-medium">📍 Dirección:</span>
            <span>
              ${
                nodo.mostrar_direccion_publica || esModoAdmin
                  ? `<strong>${nodo.direccion}</strong>`
                  : `<span class="italic text-stone-500">${nodo.localidad} (se confirma al coordinar)</span>`
              }
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="font-medium">📅 Días de entrega:</span>
            <span class="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded font-semibold">${nodo.dias_entrega}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="font-medium">📞 Teléfono:</span>
            <span>${nodo.telefono || 'Sin teléfono informado'}</span>
          </div>
        </div>

        ${
          nodo.whatsapp_url
            ? `
          <a href="${nodo.whatsapp_url}" target="_blank" rel="noopener noreferrer"
             class="flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 1.83.829 2.796.83h.005c3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.773-5.766zm8.815 5.765c-.002 4.864-3.957 8.818-8.82 8.818-1.543 0-2.99-.402-4.251-1.102l-4.775 1.252 1.275-4.654c-.77-1.32-1.229-2.853-1.229-4.314.002-4.865 3.957-8.819 8.82-8.819 4.862 0 8.819 3.954 8.82 8.819z"/></svg>
            Contactar por WhatsApp
          </a>`
            : ''
        }
      `;

      marker.bindPopup(popupHtml, { maxWidth: 280 });

      marker.on('click', () => {
        onSeleccionarNodo(nodo);
      });

      marker.addTo(mapa);
      markersRef.current.set(nodo.id, marker);

      bounds.extend([nodo.latitud, nodo.longitud]);
      cantidadValidos++;
    });

    // Ajustar vista del mapa si hay marcadores y no hay un nodo específico seleccionado
    if (cantidadValidos > 0 && !nodoSeleccionado) {
      mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [nodos, esModoAdmin]);

  // Centrar y abrir popup si se selecciona un nodo desde el exterior (ej: click en lista)
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa || !nodoSeleccionado || !nodoSeleccionado.latitud || !nodoSeleccionado.longitud) {
      return;
    }

    const marker = markersRef.current.get(nodoSeleccionado.id);
    if (marker) {
      mapa.flyTo([nodoSeleccionado.latitud, nodoSeleccionado.longitud], 15, {
        duration: 0.8,
      });
      setTimeout(() => {
        marker.openPopup();
      }, 400);
    }
  }, [nodoSeleccionado]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-stone-200">
      {/* Contenedor DOM para Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Leyenda territorial UTT flotante en la esquina inferior izquierda */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-stone-200 text-xs text-stone-700 hidden sm:block">
        <p className="font-bold text-stone-900 mb-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          Regiones de Entrega
        </p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> CABA
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-700"></span> Norte
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span> Sur
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-700"></span> Oeste
          </span>
        </div>
      </div>
    </div>
  );
};
