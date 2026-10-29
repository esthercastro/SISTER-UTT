import React, { useState, useEffect, useMemo } from 'react';
import { NodoUTT, Region, DiaEntrega } from './types';
import { MapaNodos } from './components/MapaNodos';
import { FiltrosBusqueda } from './components/FiltrosBusqueda';
import { TarjetaNodo } from './components/TarjetaNodo';
import { AdminPanel } from './components/AdminPanel';
import { ModalFormNodo } from './components/ModalFormNodo';
import {
  MapPin,
  List,
  Map as MapIcon,
  Shield,
  Plus,
  Sprout,
  Store,
  Compass,
  ArrowRight,
  Info,
  Loader2,
} from 'lucide-react';
import {
  normalizarTexto,
  geocodificarTextoBuscado,
  obtenerNodosMasCercanos,
} from './utils/geocodingClient';

export default function App() {
  const [nodos, setNodos] = useState<NodoUTT[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  // Modo actual: 'publico' | 'admin'
  const [vistaActual, setVistaActual] = useState<'publico' | 'admin'>('publico');

  // En móvil: alternar entre vista 'mapa' y vista 'lista'
  const [vistaMovil, setVistaMovil] = useState<'mapa' | 'lista'>('mapa');

  // Filtros de búsqueda pública
  const [busqueda, setBusqueda] = useState('');
  const [regionSeleccionada, setRegionSeleccionada] = useState<Region | 'TODAS'>('TODAS');
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaEntrega | 'TODOS'>('TODOS');

  // Estado para búsqueda por proximidad geográfica y geocodificación
  const [ubicacionBuscada, setUbicacionBuscada] = useState<{
    lat: number;
    lng: number;
    nombre: string;
    region?: string;
  } | null>(null);
  const [nodosProximidad, setNodosProximidad] = useState<NodoUTT[]>([]);
  const [cargandoGeocodificacion, setCargandoGeocodificacion] = useState(false);

  // Nodo seleccionado actualmente (en mapa o lista)
  const [nodoSeleccionado, setNodoSeleccionado] = useState<NodoUTT | null>(null);

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nodoParaEditar, setNodoParaEditar] = useState<NodoUTT | null>(null);

  // Escuchar hash de URL para soportar #admin directamente
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setVistaActual('admin');
      } else {
        setVistaActual('publico');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const cambiarVista = (vista: 'publico' | 'admin') => {
    setVistaActual(vista);
    window.location.hash = vista === 'admin' ? '#admin' : '';
  };

  // Cargar nodos desde la API local
  const cargarNodos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/nodos');
      if (!res.ok) throw new Error('No se pudo obtener el listado de nodos');
      const data: NodoUTT[] = await res.json();
      setNodos(data);
      setErrorCarga('');
    } catch (err) {
      console.error(err);
      setErrorCarga('No se pudieron cargar los nodos en este momento.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNodos();
  }, []);

  // 1. Nodos activos que respetan los filtros generales (Región y Día de Entrega).
  // Estos nodos NUNCA se ocultan del mapa al buscar, permitiendo siempre ver las zonas aledañas.
  const nodosActivosGenerales = useMemo(() => {
    return nodos.filter((nodo) => {
      if (nodo.estado !== 'activo') return false;
      if (regionSeleccionada !== 'TODAS' && nodo.region !== regionSeleccionada) return false;
      if (diaSeleccionado !== 'TODOS' && nodo.dias_entrega !== diaSeleccionado) return false;
      return true;
    });
  }, [nodos, regionSeleccionada, diaSeleccionado]);

  // 2. Coincidencia estricta de texto en los nodos activos
  const nodosCoincidenciaTexto = useMemo(() => {
    if (!busqueda.trim()) return nodosActivosGenerales;
    const query = normalizarTexto(busqueda);
    return nodosActivosGenerales.filter((nodo) => {
      const nom = normalizarTexto(nodo.nombre);
      const loc = normalizarTexto(nodo.localidad);
      const dir = normalizarTexto(nodo.direccion);
      const reg = normalizarTexto(nodo.region);
      return nom.includes(query) || loc.includes(query) || dir.includes(query) || reg.includes(query);
    });
  }, [nodosActivosGenerales, busqueda]);

  // 3. Efecto de geocodificación y búsqueda por proximidad cuando no hay coincidencias exactas
  useEffect(() => {
    const query = busqueda.trim();
    if (!query) {
      setUbicacionBuscada(null);
      setNodosProximidad([]);
      setCargandoGeocodificacion(false);
      return;
    }

    // Si hay coincidencias de texto exactas, usamos el listado filtrado normal
    if (nodosCoincidenciaTexto.length > 0) {
      setUbicacionBuscada(null);
      setNodosProximidad([]);
      setCargandoGeocodificacion(false);
      return;
    }

    // Si no hay coincidencias exactas, disparamos geocodificación del barrio/calle ingresada
    let cancelado = false;
    setCargandoGeocodificacion(true);

    const timer = setTimeout(async () => {
      try {
        const ubicacion = await geocodificarTextoBuscado(query);
        if (cancelado) return;

        if (ubicacion) {
          setUbicacionBuscada(ubicacion);
          // Limpiar cualquier nodo seleccionado previamente para que el destino sea automáticamente
          // el primer nodo más cercano de la lista
          setNodoSeleccionado(null);

          // Buscamos los nodos más cercanos dentro de los nodos activos generales
          // (o dentro de toda la red si la región filtrada estuviera vacía)
          const universo =
            nodosActivosGenerales.length > 0
              ? nodosActivosGenerales
              : nodos.filter((n) => n.estado === 'activo');

          const masCercanos = obtenerNodosMasCercanos(universo, ubicacion.lat, ubicacion.lng, 4);
          setNodosProximidad(masCercanos);
        } else {
          setUbicacionBuscada(null);
          setNodosProximidad([]);
        }
      } catch (err) {
        if (!cancelado) {
          setUbicacionBuscada(null);
          setNodosProximidad([]);
        }
      } finally {
        if (!cancelado) {
          setCargandoGeocodificacion(false);
        }
      }
    }, 180);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [busqueda, nodosCoincidenciaTexto.length, nodosActivosGenerales, nodos]);

  // ¿Estamos mostrando resultados por proximidad?
  const esModoProximidad = Boolean(
    busqueda.trim().length >= 3 &&
      nodosCoincidenciaTexto.length === 0 &&
      (ubicacionBuscada !== null || nodosProximidad.length > 0)
  );

  // Distancia del nodo más cercano para evaluar el umbral de 5 km
  const distanciaMinimaKm =
    nodosProximidad.length > 0 && nodosProximidad[0].distanciaKm !== undefined
      ? nodosProximidad[0].distanciaKm
      : Infinity;

  // Si el nodo más cercano está a <= 5 km, hay cobertura cercana (no mostrar cartel amarillo de alerta)
  const tieneCoberturaCercana = distanciaMinimaKm <= 5.0;

  // Lista de nodos que se visualizan en el panel lateral izquierdo
  // Ordenamiento estricto de menor a mayor distancia ascendente (a.distancia - b.distancia)
  const nodosParaLista = useMemo(() => {
    if (esModoProximidad) {
      return [...nodosProximidad].sort(
        (a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity)
      );
    }
    return nodosCoincidenciaTexto;
  }, [esModoProximidad, nodosProximidad, nodosCoincidenciaTexto]);

  // Nodo hacia el cual se traza la ruta en el mapa:
  // Si el usuario seleccionó un nodo explícitamente (clickeando "Ubicar"), se traza hacia ese nodo.
  // Caso contrario, se asigna automáticamente el primer nodo de la lista ordenada (el más cercano).
  const nodoDestinoRuta = useMemo(() => {
    if (!ubicacionBuscada) return null;
    if (nodoSeleccionado) return nodoSeleccionado;
    if (nodosParaLista.length > 0) return nodosParaLista[0];
    return null;
  }, [ubicacionBuscada, nodoSeleccionado, nodosParaLista]);

  // IDs de nodos a resaltar sutilmente en el mapa
  const nodosResaltadosIds = useMemo(() => {
    if (esModoProximidad) {
      return nodosProximidad.map((n) => n.id);
    }
    if (busqueda.trim().length > 0) {
      return nodosCoincidenciaTexto.map((n) => n.id);
    }
    return [];
  }, [esModoProximidad, nodosProximidad, busqueda, nodosCoincidenciaTexto]);

  // Guardar (crear o editar) un nodo en el backend
  const handleGuardarNodo = async (datos: Partial<NodoUTT>) => {
    try {
      if (nodoParaEditar) {
        // Edición
        const res = await fetch(`/api/nodos/${nodoParaEditar.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al actualizar');
        await cargarNodos();
        return { ok: true, mensaje: json.mensaje || '¡Nodo actualizado con éxito!' };
      } else {
        // Creación
        const res = await fetch('/api/nodos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datos),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Error al crear');
        await cargarNodos();
        return { ok: true, mensaje: json.mensaje || '¡Nodo creado y geocodificado con éxito!' };
      }
    } catch (err: any) {
      return { ok: false, mensaje: err.message || 'Error al procesar la solicitud' };
    }
  };

  // Toggle lógico de estado (activo/inactivo)
  const handleToggleEstado = async (nodo: NodoUTT) => {
    try {
      const res = await fetch(`/api/nodos/${nodo.id}/toggle-estado`, { method: 'PATCH' });
      if (res.ok) {
        await cargarNodos();
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 text-stone-900 font-sans">
      {/* Barra de navegación superior con identidad UTT */}
      <header className="sticky top-0 z-30 bg-stone-900 text-stone-100 shadow-sm border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo y Organización */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => cambiarVista('publico')}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">UTT</span>
                <span className="text-[11px] font-semibold bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                  Red de Nodos
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                Unión de Trabajadores de la Tierra • Alimentos agroecológicos
              </p>
            </div>
          </div>

          {/* Selector de vistas: Público / Admin */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => cambiarVista('publico')}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                vistaActual === 'publico'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vista Pública</span>
            </button>

            <button
              onClick={() => cambiarVista('admin')}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                vistaActual === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal según la vista activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {vistaActual === 'admin' ? (
          /* ================================================= */
          /* VISTA ADMINISTRATIVA (/admin) */
          /* ================================================= */
          <AdminPanel
            nodos={nodos}
            onRecargarNodos={cargarNodos}
            onAbrirModalNuevo={() => {
              setNodoParaEditar(null);
              setModalAbierto(true);
            }}
            onAbrirModalEditar={(nodo) => {
              setNodoParaEditar(nodo);
              setModalAbierto(true);
            }}
            onToggleEstado={handleToggleEstado}
            onVolverAVistaPublica={() => cambiarVista('publico')}
          />
        ) : (
          /* ================================================= */
          /* VISTA PÚBLICA (Mapa territorial interactivo) */
          /* ================================================= */
          <div className="flex-1 flex flex-col space-y-4">
            {/* Encabezado editorial */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  Encontrá un Nodo UTT cerca tuyo
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
                  Puntos territoriales donde podés retirar bolsones de verduras y frutas agroecológicas directo de las familias productoras, sin intermediarios.
                </p>
              </div>

              {/* Botón rápido en cabecera */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    cambiarVista('admin');
                    setNodoParaEditar(null);
                    setModalAbierto(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sumar un nodo</span>
                </button>
              </div>
            </div>

            {/* Selector de modo móvil (Mapa vs Lista) */}
            <div className="flex md:hidden bg-stone-200 p-1 rounded-xl">
              <button
                onClick={() => setVistaMovil('mapa')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  vistaMovil === 'mapa'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Ver Mapa ({nodosActivosGenerales.length})</span>
              </button>
              <button
                onClick={() => setVistaMovil('lista')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  vistaMovil === 'lista'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Ver Listado ({nodosParaLista.length})</span>
              </button>
            </div>

            {/* Layout principal: Filtros + Lista a la izquierda / Mapa interactivo a la derecha */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[540px]">
              {/* Columna Izquierda: Filtros y Lista de Nodos */}
              <div
                className={`md:col-span-5 lg:col-span-4 flex flex-col space-y-3.5 ${
                  vistaMovil === 'mapa' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <FiltrosBusqueda
                  busqueda={busqueda}
                  onCambiarBusqueda={(texto) => {
                    setBusqueda(texto);
                    setNodoSeleccionado(null);
                  }}
                  regionSeleccionada={regionSeleccionada}
                  onCambiarRegion={(reg) => {
                    setRegionSeleccionada(reg);
                    setNodoSeleccionado(null);
                  }}
                  diaSeleccionado={diaSeleccionado}
                  onCambiarDia={(dia) => {
                    setDiaSeleccionado(dia);
                    setNodoSeleccionado(null);
                  }}
                  totalNodos={nodos.filter((n) => n.estado === 'activo').length}
                  totalFiltrados={nodosParaLista.length}
                  esModoProximidad={esModoProximidad}
                  cargandoGeocodificacion={cargandoGeocodificacion}
                />

                {/* Condición 1: Si el nodo más cercano está a > 5 km, mostrar el aviso amarillo de alerta */}
                {esModoProximidad && !tieneCoberturaCercana && (
                  <div className="p-3.5 bg-amber-50/95 border border-amber-200 rounded-2xl text-xs space-y-1.5 shadow-xs animate-in fade-in duration-200">
                    <div className="flex items-start gap-2">
                      <Compass className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950 leading-snug">
                          No hay nodos en la región pesquisada. Te mostramos las opciones más cercanas en zonas adyacentes:
                        </p>
                        {ubicacionBuscada && (
                          <p className="text-amber-800 text-[11px] font-medium">
                            📍 Búsqueda: <strong>{ubicacionBuscada.nombre}</strong> (el nodo más próximo se ubica a {nodosProximidad[0]?.distanciaTexto})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Condición 2: Si existen nodos a <= 5 km, mostrar directamente los nodos sin el cartel amarillo */}
                {esModoProximidad && tieneCoberturaCercana && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl text-xs flex items-center justify-between gap-2 text-emerald-950 shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0"></span>
                      <span className="font-medium">
                        {ubicacionBuscada ? (
                          <>
                            Nodos con cobertura cercana a <strong>{ubicacionBuscada.nombre}</strong> (en radio de 5 km):
                          </>
                        ) : (
                          'Nodos con cobertura cercana a tu ubicación (en radio de 5 km):'
                        )}
                      </span>
                    </div>
                    {nodosProximidad[0]?.distanciaTexto && (
                      <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                        a {nodosProximidad[0].distanciaTexto}
                      </span>
                    )}
                  </div>
                )}

                {/* Lista scrolleable de tarjetas de nodos */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[600px]">
                  {cargando ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
                      Cargando la red de nodos...
                    </div>
                  ) : cargandoGeocodificacion ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                      <p className="font-medium text-stone-700">Georreferenciando barrio y buscando nodos cercanos...</p>
                    </div>
                  ) : nodosParaLista.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
                      <p className="font-semibold text-stone-700">No encontramos ningún nodo con esos filtros.</p>
                      <p className="text-stone-400 mt-1">Probá cambiando la región o buscando otro barrio (ej: Villa del Parque, Devoto, San Isidro, Morón).</p>
                    </div>
                  ) : (
                    nodosParaLista.map((nodo) => (
                      <TarjetaNodo
                        key={nodo.id}
                        nodo={nodo}
                        esSeleccionado={nodoSeleccionado?.id === nodo.id}
                        onSeleccionar={(n) => {
                          setNodoSeleccionado(n);
                          if (vistaMovil === 'lista') {
                            setVistaMovil('mapa');
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Columna Derecha: Mapa Interactivo Leaflet + OpenStreetMap */}
              <div
                className={`md:col-span-7 lg:col-span-8 flex flex-col min-h-[480px] md:min-h-[620px] ${
                  vistaMovil === 'lista' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <MapaNodos
                  nodos={nodosActivosGenerales}
                  nodoSeleccionado={nodoSeleccionado}
                  onSeleccionarNodo={(n) => setNodoSeleccionado(n)}
                  esModoAdmin={false}
                  ubicacionBuscada={ubicacionBuscada}
                  nodosResaltadosIds={nodosResaltadosIds}
                  nodoDestinoRuta={nodoDestinoRuta}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pie de página territorial */}
      <footer className="bg-white border-t border-stone-200/80 py-4 px-4 sm:px-6 text-xs text-stone-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Piloto Territorial de Nodos • <strong>Unión de Trabajadores de la Tierra (UTT)</strong>
          </span>
          <span className="text-stone-400">
            Datos georreferenciados con OpenStreetMap & Leaflet • Sin costo de infraestructura
          </span>
        </div>
      </footer>

      {/* Modal para Crear o Editar Nodo */}
      <ModalFormNodo
        estaAbierto={modalAbierto}
        nodoEditar={nodoParaEditar}
        onCerrar={() => {
          setModalAbierto(false);
          setNodoParaEditar(null);
        }}
        onGuardar={handleGuardarNodo}
      />
    </div>
  );
}
