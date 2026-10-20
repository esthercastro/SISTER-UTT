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
} from 'lucide-react';

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

  // Filtrado de nodos para la vista pública (solo nodos activos)
  const nodosFiltrados = useMemo(() => {
    return nodos.filter((nodo) => {
      // En vista pública mostramos solo nodos con estado 'activo'
      if (nodo.estado !== 'activo') return false;

      // Filtro por región
      if (regionSeleccionada !== 'TODAS' && nodo.region !== regionSeleccionada) {
        return false;
      }

      // Filtro por día de entrega
      if (diaSeleccionado !== 'TODOS' && nodo.dias_entrega !== diaSeleccionado) {
        return false;
      }

      // Filtro de texto libre (nombre, barrio, calle)
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim();
        const coincideNombre = nodo.nombre.toLowerCase().includes(query);
        const coincideLocalidad = nodo.localidad.toLowerCase().includes(query);
        const coincideDireccion = nodo.direccion.toLowerCase().includes(query);
        const coincideRegion = nodo.region.toLowerCase().includes(query);
        if (!coincideNombre && !coincideLocalidad && !coincideDireccion && !coincideRegion) {
          return false;
        }
      }

      return true;
    });
  }, [nodos, busqueda, regionSeleccionada, diaSeleccionado]);

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
                <span>Ver Mapa ({nodosFiltrados.length})</span>
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
                <span>Ver Listado ({nodosFiltrados.length})</span>
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
                  onCambiarBusqueda={setBusqueda}
                  regionSeleccionada={regionSeleccionada}
                  onCambiarRegion={setRegionSeleccionada}
                  diaSeleccionado={diaSeleccionado}
                  onCambiarDia={setDiaSeleccionado}
                  totalNodos={nodos.filter((n) => n.estado === 'activo').length}
                  totalFiltrados={nodosFiltrados.length}
                />

                {/* Lista scrolleable de tarjetas de nodos */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[600px]">
                  {cargando ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
                      Cargando la red de nodos...
                    </div>
                  ) : nodosFiltrados.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-xs text-stone-500">
                      <p className="font-semibold text-stone-700">No encontramos ningún nodo con esos filtros.</p>
                      <p className="text-stone-400 mt-1">Probá cambiando la región o buscando otro barrio.</p>
                    </div>
                  ) : (
                    nodosFiltrados.map((nodo) => (
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
                  nodos={nodosFiltrados}
                  nodoSeleccionado={nodoSeleccionado}
                  onSeleccionarNodo={(n) => setNodoSeleccionado(n)}
                  esModoAdmin={false}
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
