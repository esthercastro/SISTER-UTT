import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { NodoUTT } from '../types';
import { MapPin, Phone, MessageCircle, Calendar, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { obtenerRutaOSRM } from '../utils/routingService';

interface MapaNodosProps {
  nodos: NodoUTT[];
  nodoSeleccionado: NodoUTT | null;
  onSeleccionarNodo: (nodo: NodoUTT | null) => void;
  esModoAdmin?: boolean;
  ubicacionBuscada?: { lat: number; lng: number; nombre: string } | null;
  nodosResaltadosIds?: string[];
  nodoDestinoRuta?: NodoUTT | null;
  searchTerm?: string;
  nodosFiltrados?: NodoUTT[];
}

// Colores según región para una diferenciación visual sutil pero clara
const COLORES_REGION: Record<string, { bg: string; border: string; label: string }> = {
  CABA: { bg: '#15803d', border: '#14532d', label: 'CABA' }, // verde bosque
  Norte: { bg: '#0369a1', border: '#075985', label: 'Zona Norte' }, // azul río
  Sur: { bg: '#b45309', border: '#78350f', label: 'Zona Sur' }, // tierra / ámbar
  Oeste: { bg: '#6b21a8', border: '#581c87', label: 'Zona Oeste' }, // púrpura / morado
  Otra: { bg: '#475569', border: '#1e293b', label: 'Otra' },
};

function crearIconoMarcador(
  region: string,
  seleccionado: boolean,
  inactivo: boolean,
  esResaltado: boolean = false
) {
  const conf = COLORES_REGION[region] || COLORES_REGION.CABA;
  const color = inactivo ? '#94a3b8' : conf.bg;
  const escala = seleccionado ? 'scale(1.25)' : esResaltado ? 'scale(1.15)' : 'scale(1)';
  const zIndex = seleccionado ? 1200 : esResaltado ? 800 : 100;

  const svgHtml = `
    <div style="transform: ${escala}; transition: transform 0.25s ease; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); z-index: ${zIndex};">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="${color}" stroke="${
          seleccionado ? '#fef08a' : esResaltado ? '#86efac' : '#ffffff'
        }" stroke-width="${seleccionado ? '3' : esResaltado ? '2.5' : '1.5'}"/>
        <!-- Brote / hoja agroecológica UTT en el centro -->
        <circle cx="17" cy="17" r="11" fill="#ffffff" />
        <path d="M17 11C15 13 13 16 13 19C13 20.5 14 22 15.5 22.5C14.5 20 15.5 17 17 15C18.5 17 19.5 20 18.5 22.5C20 22 21 20.5 21 19C21 16 19 13 17 11Z" fill="${color}"/>
        <path d="M17 15V22" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      ${
        seleccionado
          ? '<div style="width: 8px; height: 8px; background: #facc15; border-radius: 50%; margin-top: -3px; box-shadow: 0 0 8px #facc15;"></div>'
          : esResaltado
          ? '<div style="width: 7px; height: 7px; background: #22c55e; border-radius: 50%; margin-top: -3px; box-shadow: 0 0 6px #22c55e;"></div>'
          : ''
      }
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

function crearIconoBusqueda(nombre: string) {
  const svgHtml = `
    <div style="display: flex; flex-direction: column; align-items: center; z-index: 1500; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); cursor: pointer;">
      <div style="background: #1d4ed8; color: #ffffff; font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 9999px; white-space: nowrap; margin-bottom: 2px; border: 1.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
        📍 Búsqueda: ${nombre}
      </div>
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 29.5 17 42 17 42C17 42 34 29.5 34 17C34 7.611 26.389 0 17 0Z" fill="#1d4ed8" stroke="#ffffff" stroke-width="2"/>
        <circle cx="17" cy="17" r="9" fill="#ffffff" />
        <circle cx="17" cy="17" r="4.5" fill="#1d4ed8" />
      </svg>
      <div style="width: 10px; height: 10px; background: #60a5fa; border-radius: 50%; margin-top: -4px; box-shadow: 0 0 8px #3b82f6;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'utt-search-marker',
    html: svgHtml,
    iconSize: [160, 68],
    iconAnchor: [80, 64],
    popupAnchor: [0, -64],
  });
}

export const MapaNodos: React.FC<MapaNodosProps> = ({
  nodos,
  nodoSeleccionado,
  onSeleccionarNodo,
  esModoAdmin = false,
  ubicacionBuscada = null,
  nodosResaltadosIds = [],
  nodoDestinoRuta = null,
  searchTerm = '',
  nodosFiltrados = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const limitesGeneralesRef = useRef<L.LatLngBounds | null>(null);

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
      const esResaltado = nodosResaltadosIds.includes(nodo.id);
      const icono = crearIconoMarcador(
        nodo.region,
        esSeleccionado,
        nodo.estado === 'inactivo',
        esResaltado
      );

      const marker = L.marker([nodo.latitud, nodo.longitud], {
        icon: icono,
        title: nodo.nombre,
        zIndexOffset: esSeleccionado ? 1000 : esResaltado ? 500 : 0,
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
          ${
            nodo.distanciaTexto
              ? `<div class="mt-1 inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-900 font-semibold px-2 py-0.5 rounded-full">
                  <span>📍 a ${nodo.distanciaTexto} de tu búsqueda</span>
                </div>`
              : ''
          }
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
             class="utt-whatsapp-btn flex items-center justify-center gap-1.5 w-full bg-emerald-600 hover:bg-emerald-700 !text-white font-semibold py-2 px-3 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
             style="color: #ffffff !important; text-decoration: none !important; background-color: #059669;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="fill: #ffffff !important; color: #ffffff !important; flex-shrink: 0; display: inline-block;">
              <path fill="#ffffff" d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.54 1.83.829 2.796.83h.005c3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.773-5.766zm8.815 5.765c-.002 4.864-3.957 8.818-8.82 8.818-1.543 0-2.99-.402-4.251-1.102l-4.775 1.252 1.275-4.654c-.77-1.32-1.229-2.853-1.229-4.314.002-4.865 3.957-8.819 8.82-8.819 4.862 0 8.819 3.954 8.82 8.819z"/>
            </svg>
            <span style="color: #ffffff !important; font-weight: 600;">Contactar por WhatsApp</span>
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

    // Ajustar vista general inicial del mapa solo cuando NO hay búsqueda por texto, ni selección, ni búsqueda por proximidad
    if (cantidadValidos > 0 && !nodoSeleccionado && !ubicacionBuscada && !searchTerm?.trim()) {
      limitesGeneralesRef.current = bounds;
      mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [nodos, esModoAdmin, nodoSeleccionado, nodosResaltadosIds, ubicacionBuscada, nodoDestinoRuta, searchTerm]);

  // Zoom automático hacia las coincidencias cuando cambia la lista de nodos filtrados por texto de búsqueda (searchTerm)
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa) return;

    // Cuando el usuario borre la búsqueda (o haga clic en "Restablecer filtros"), el mapa vuelve a la vista general original
    if (!searchTerm || !searchTerm.trim()) {
      if (nodoSeleccionado || ubicacionBuscada) return;

      if (limitesGeneralesRef.current && limitesGeneralesRef.current.isValid()) {
        mapa.fitBounds(limitesGeneralesRef.current, { padding: [40, 40], maxZoom: 14 });
      } else {
        mapa.flyTo([-34.615, -58.44], 11, { duration: 0.8 });
      }
      return;
    }

    // Si estamos en modo proximidad con geocodificación activa (pin azul), el efecto de ruta se encarga del encuadre
    if (ubicacionBuscada) return;

    // Filtrar nodos que tengan coordenadas válidas
    const coincidencias = (nodosFiltrados || []).filter(
      (n) => n.latitud !== null && n.longitud !== null && n.latitud !== 0 && n.longitud !== 0
    );

    if (coincidencias.length === 1) {
      // Si hay un único nodo filtrado, usar map.flyTo([nodo.lat, nodo.lng], 15)
      const nodo = coincidencias[0];
      mapa.flyTo([nodo.latitud!, nodo.longitud!], 15, {
        duration: 0.85,
      });

      // Abrir el popup del marcador automáticamente tras la animación
      const timer = setTimeout(() => {
        const marker = markersRef.current.get(nodo.id);
        if (marker) {
          marker.openPopup();
        }
      }, 450);

      return () => clearTimeout(timer);
    } else if (coincidencias.length > 1) {
      // Si hay múltiples nodos filtrados, calcular el L.latLngBounds de esos nodos y aplicar map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      const bounds = L.latLngBounds(coincidencias.map((n) => [n.latitud!, n.longitud!]));
      mapa.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [searchTerm, nodosFiltrados, ubicacionBuscada, nodoSeleccionado]);

  // Manejar marcador y centrado de la ubicación buscada por proximidad
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    if (!ubicacionBuscada) return;

    const icono = crearIconoBusqueda(ubicacionBuscada.nombre);
    const marker = L.marker([ubicacionBuscada.lat, ubicacionBuscada.lng], {
      icon: icono,
      zIndexOffset: 2000,
      title: `Búsqueda: ${ubicacionBuscada.nombre}`,
    });

    const popupHtml = `
      <div class="p-1.5 font-sans text-stone-800">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="text-[11px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
            📍 Tu búsqueda
          </span>
        </div>
        <h4 class="font-bold text-sm text-stone-900">${ubicacionBuscada.nombre}</h4>
        <p class="text-xs text-stone-600 mt-1 leading-snug">
          No hay un nodo registrado en este punto exacto. En el mapa y en la lista podés ver los nodos agroecológicos más cercanos en zonas adyacentes.
        </p>
      </div>
    `;
    marker.bindPopup(popupHtml, { maxWidth: 260 });
    marker.addTo(mapa);
    searchMarkerRef.current = marker;

    // Solo si no hay nodo de destino asignado para la ruta centramos individualmente.
    // Si hay ruta, el efecto del trayecto se encargará de realizar el fitBounds conjunto.
    if (!nodoDestinoRuta) {
      mapa.flyTo([ubicacionBuscada.lat, ubicacionBuscada.lng], 13.5, {
        duration: 0.8,
      });
    }

    return () => {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
    };
  }, [ubicacionBuscada, nodoDestinoRuta]);

  // Centrar y abrir popup si se selecciona un nodo desde el exterior (ej: click en lista)
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa || !nodoSeleccionado || !nodoSeleccionado.latitud || !nodoSeleccionado.longitud) {
      return;
    }

    const marker = markersRef.current.get(nodoSeleccionado.id);
    if (marker) {
      // Si NO hay búsqueda por proximidad activa, centrar con flyTo en el nodo
      if (!ubicacionBuscada) {
        mapa.flyTo([nodoSeleccionado.latitud, nodoSeleccionado.longitud], 15, {
          duration: 0.8,
        });
      }
      setTimeout(() => {
        marker.openPopup();
      }, 350);
    }
  }, [nodoSeleccionado, ubicacionBuscada]);

  // Trazado visual del trayecto (OSRM para direcciones públicas vs punteada para direcciones aproximadas)
  useEffect(() => {
    const mapa = mapInstanceRef.current;
    if (!mapa) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!ubicacionBuscada || !nodoDestinoRuta || !nodoDestinoRuta.latitud || !nodoDestinoRuta.longitud) {
      return;
    }

    const { lat: lat1, lng: lng1 } = ubicacionBuscada;
    const lat2 = nodoDestinoRuta.latitud;
    const lng2 = nodoDestinoRuta.longitud;
    const esDireccionPublica = Boolean(nodoDestinoRuta.mostrar_direccion_publica);

    let cancelado = false;

    const renderizarTrayecto = async () => {
      let polyline: L.Polyline;

      // Llamar siempre al servicio de ruteo por calles (OSRM) para todos los nodos
      const resOSRM = await obtenerRutaOSRM(lat1, lng1, lat2, lng2);
      if (cancelado) return;

      if (resOSRM && resOSRM.coordenadas.length > 1) {
        polyline = L.polyline(resOSRM.coordenadas, {
          color: '#059669', // Verde esmeralda sólido
          weight: 4.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        });

        const distKm = resOSRM.distanciaMetros
          ? `${(resOSRM.distanciaMetros / 1000).toFixed(1)} km`
          : nodoDestinoRuta.distanciaTexto || '';
        const min = resOSRM.duracionSegundos
          ? `~${Math.round(resOSRM.duracionSegundos / 60)} min`
          : '';
        const info = [distKm, min].filter(Boolean).join(' • ');

        polyline.bindTooltip(
          `<div class="p-1 font-sans text-xs max-w-[260px]">
            <strong class="text-emerald-950 block">🚗 Ruta por calles hacia ${
              esDireccionPublica ? nodoDestinoRuta.nombre : `la zona de ${nodoDestinoRuta.nombre}`
            }</strong>
            <span class="text-[11px] text-stone-600 font-medium block mt-0.5">Distancia vial: ${info}</span>
            ${
              !esDireccionPublica
                ? '<span class="text-[10px] text-stone-500 italic block mt-0.5">La dirección exacta se coordina por WhatsApp</span>'
                : ''
            }
          </div>`,
          { sticky: true, className: 'utt-route-tooltip' }
        );
      } else {
        // Fallback si OSRM no responde temporalmente: línea sólida directa
        polyline = L.polyline([[lat1, lng1], [lat2, lng2]], {
          color: '#059669',
          weight: 4,
          opacity: 0.85,
        });
        polyline.bindTooltip(
          `<div class="p-1 font-sans text-xs">
            <strong class="text-emerald-950 block">🚗 Trayecto directo hacia ${nodoDestinoRuta.nombre}</strong>
            <span class="text-[11px] text-stone-600 font-medium">${
              esDireccionPublica ? nodoDestinoRuta.direccion : 'La dirección exacta se coordina por WhatsApp'
            }</span>
          </div>`,
          { sticky: true, className: 'utt-route-tooltip' }
        );
      }

      if (cancelado) return;

      polyline.addTo(mapa);
      routeLayerRef.current = polyline;

      // Encuadrar el mapa para visualizar simultáneamente la búsqueda (pin azul), el nodo de destino y todo el trayecto
      const bounds = polyline.getBounds();
      bounds.extend([lat1, lng1]);
      bounds.extend([lat2, lng2]);
      mapa.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true,
      });
    };

    renderizarTrayecto();

    return () => {
      cancelado = true;
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
    };
  }, [ubicacionBuscada, nodoDestinoRuta]);

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
