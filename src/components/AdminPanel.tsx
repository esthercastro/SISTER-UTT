import React, { useState } from 'react';
import { NodoUTT, ReporteGeocodificacion } from '../types';
import {
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit2,
  Power,
  MapPin,
  Lock,
  Unlock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface AdminPanelProps {
  nodos: NodoUTT[];
  onRecargarNodos: () => Promise<void>;
  onAbrirModalNuevo: () => void;
  onAbrirModalEditar: (nodo: NodoUTT) => void;
  onToggleEstado: (nodo: NodoUTT) => Promise<void>;
  onVolverAVistaPublica: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  nodos,
  onRecargarNodos,
  onAbrirModalNuevo,
  onAbrirModalEditar,
  onToggleEstado,
  onVolverAVistaPublica,
}) => {
  // Autenticación simbólica para el piloto
  const [autenticado, setAutenticado] = useState(false);
  const [claveInput, setClaveInput] = useState('');
  const [errorClave, setErrorClave] = useState(false);

  // Estados locales de filtrado
  const [busquedaAdmin, setBusquedaAdmin] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [regeocodificando, setRegeocodificando] = useState(false);
  const [reimportando, setReimportando] = useState(false);
  const [mensajeAccion, setMensajeAccion] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(
    null
  );

  const verificarClave = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave simbólica para la demo
    if (claveInput.toLowerCase().trim() === 'utt' || claveInput.toLowerCase().trim() === 'utt2026') {
      setAutenticado(true);
      setErrorClave(false);
    } else {
      setErrorClave(true);
    }
  };

  const regeocodificarPendientes = async () => {
    setRegeocodificando(true);
    setMensajeAccion(null);
    try {
      const res = await fetch('/api/regeocode-all', { method: 'POST' });
      const data = await res.json();
      await onRecargarNodos();
      setMensajeAccion({ tipo: 'ok', texto: data.mensaje || 'Proceso de geocodificación finalizado.' });
    } catch (err) {
      setMensajeAccion({ tipo: 'err', texto: 'No se pudo completar la re-geocodificación.' });
    } finally {
      setRegeocodificando(false);
    }
  };

  const reimportarPlanilla = async () => {
    if (
      !confirm(
        '¿Querés volver a procesar la planilla NODOS_UTT.xlsx? Se actualizarán los nodos existentes.'
      )
    ) {
      return;
    }
    setReimportando(true);
    setMensajeAccion(null);
    try {
      const res = await fetch('/api/import-excel', { method: 'POST' });
      const data = await res.json();
      await onRecargarNodos();
      setMensajeAccion({
        tipo: 'ok',
        texto: `¡Planilla re-importada! Total procesados: ${data.reporte.total_procesados} (${data.reporte.geocodificados_ok} geocodificados)`,
      });
    } catch (err) {
      setMensajeAccion({ tipo: 'err', texto: 'Error al procesar la planilla Excel.' });
    } finally {
      setReimportando(false);
    }
  };

  // Métricas del sistema
  const total = nodos.length;
  const activos = nodos.filter((n) => n.estado === 'activo').length;
  const inactivos = total - activos;
  const sinCoords = nodos.filter((n) => !n.geocodificado_ok || !n.latitud || !n.longitud).length;
  const geocodificados = total - sinCoords;

  // Filtrado de la tabla
  const nodosFiltrados = nodos.filter((n) => {
    const cumpleTexto =
      n.nombre.toLowerCase().includes(busquedaAdmin.toLowerCase()) ||
      n.localidad.toLowerCase().includes(busquedaAdmin.toLowerCase()) ||
      n.direccion.toLowerCase().includes(busquedaAdmin.toLowerCase()) ||
      n.region.toLowerCase().includes(busquedaAdmin.toLowerCase());

    if (!cumpleTexto) return false;

    if (filtroEstado === 'activos') return n.estado === 'activo';
    if (filtroEstado === 'inactivos') return n.estado === 'inactivo';
    return true;
  });

  // Pantalla de acceso simbólico
  if (!autenticado) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-stone-200 shadow-lg text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-1">Acceso Administrativo UTT</h2>
        <p className="text-xs text-stone-500 mb-6">
          Ingresá la clave simbólica del piloto para gestionar los nodos territoriales.
        </p>

        <form onSubmit={verificarClave} className="space-y-4">
          <div>
            <input
              type="password"
              value={claveInput}
              onChange={(e) => setClaveInput(e.target.value)}
              placeholder="Clave del piloto (probá: utt o utt2026)"
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none text-center font-mono"
            />
            {errorClave && (
              <p className="text-xs text-red-600 mt-1.5">
                Clave incorrecta. Podés usar <strong>utt</strong> o <strong>utt2026</strong>.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Entrar al Panel
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-100">
          <button
            onClick={onVolverAVistaPublica}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
          >
            ← Volver a la vista del mapa público
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de administración */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <h2 className="text-xl font-bold text-stone-900">Panel de Control Territorial</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
              Piloto UTT
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gestión de la red territorial de distribución agroecológica, geocodificación y auditoría de datos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAbrirModalNuevo}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Nodo</span>
          </button>

          <button
            onClick={regeocodificarPendientes}
            disabled={regeocodificando}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Revisa nodos sin coordenadas e intenta resolverlos con OpenStreetMap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regeocodificando ? 'animate-spin' : ''}`} />
            <span>{regeocodificando ? 'Geocodificando...' : 'Re-geocodificar pendientes'}</span>
          </button>

          <button
            onClick={reimportarPlanilla}
            disabled={reimportando}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Vuelve a leer data/NODOS_UTT.xlsx y sincroniza"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{reimportando ? 'Importando...' : 'Re-importar Excel'}</span>
          </button>

          <button
            onClick={onVolverAVistaPublica}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <span>Ver mapa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cartel de mensaje de acción */}
      {mensajeAccion && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            mensajeAccion.tipo === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{mensajeAccion.texto}</span>
          <button
            onClick={() => setMensajeAccion(null)}
            className="text-stone-400 hover:text-stone-600 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Nodos</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{total}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Semilla de 51 puntos UTT</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Activos en Mapa</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{activos}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Visibles al público</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Inactivos</p>
          <p className="text-2xl font-bold text-stone-700 mt-1">{inactivos}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Borrado lógico (sin eliminar)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
          <p className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Georreferenciados</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-sky-700">{geocodificados}</span>
            <span className="text-xs text-stone-400 font-normal">/ {total}</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {sinCoords === 0 ? '✓ 100% con coordenadas' : `${sinCoords} pendientes`}
          </p>
        </div>
      </div>

      {/* Barra de Filtro y Búsqueda para la tabla */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={busquedaAdmin}
            onChange={(e) => setBusquedaAdmin(e.target.value)}
            placeholder="Buscar nodo, localidad o calle..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos ({total})
          </button>
          <button
            onClick={() => setFiltroEstado('activos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              filtroEstado === 'activos'
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Activos ({activos})
          </button>
          <button
            onClick={() => setFiltroEstado('inactivos')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              filtroEstado === 'inactivos'
                ? 'bg-stone-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Inactivos ({inactivos})
          </button>
        </div>
      </div>

      {/* Tabla de Nodos */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[11px] border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Nodo / Nombre</th>
                <th className="px-4 py-3">Región / Localidad</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Geolocalización</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {nodosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400 italic">
                    No se encontraron nodos con los criterios ingresados.
                  </td>
                </tr>
              ) : (
                nodosFiltrados.map((n) => (
                  <tr key={n.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      <div>{n.nombre}</div>
                      {n.telefono && (
                        <div className="text-[11px] text-stone-400 font-normal mt-0.5">
                          📞 {n.telefono}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800">{n.localidad}</div>
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {n.region}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-stone-800">{n.direccion}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {n.mostrar_direccion_publica ? '👁️ Pública' : '🔒 Solo barrio público'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-stone-100 font-medium px-2 py-0.5 rounded text-stone-700">
                        {n.dias_entrega}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {n.latitud && n.longitud ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>
                            {n.latitud.toFixed(3)}, {n.longitud.toFixed(3)}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Sin coordenadas</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleEstado(n)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                          n.estado === 'activo'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                        }`}
                        title="Hacé click para cambiar de estado (borrado lógico)"
                      >
                        {n.estado === 'activo' ? '● Activo' : '○ Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onAbrirModalEditar(n)}
                          className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar nodo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleEstado(n)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          title={n.estado === 'activo' ? 'Desactivar nodo' : 'Activar nodo'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
