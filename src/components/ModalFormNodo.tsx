import React, { useState, useEffect } from 'react';
import { NodoUTT, Region, DiaEntrega } from '../types';
import { X, MapPin, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ModalFormNodoProps {
  nodoEditar: NodoUTT | null;
  estaAbierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: Partial<NodoUTT>) => Promise<{ ok: boolean; mensaje: string }>;
}

export const ModalFormNodo: React.FC<ModalFormNodoProps> = ({
  nodoEditar,
  estaAbierto,
  onCerrar,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [region, setRegion] = useState<Region>('CABA');
  const [telefono, setTelefono] = useState('');
  const [diasEntrega, setDiasEntrega] = useState<DiaEntrega>('Sábados');
  const [mostrarDireccionPublica, setMostrarDireccionPublica] = useState(false);
  const [estado, setEstado] = useState<'activo' | 'inactivo'>('activo');

  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  useEffect(() => {
    if (nodoEditar) {
      setNombre(nodoEditar.nombre);
      setDireccion(nodoEditar.direccion);
      setLocalidad(nodoEditar.localidad);
      setRegion(nodoEditar.region);
      setTelefono(nodoEditar.telefono || '');
      setDiasEntrega(nodoEditar.dias_entrega);
      setMostrarDireccionPublica(Boolean(nodoEditar.mostrar_direccion_publica));
      setEstado(nodoEditar.estado);
    } else {
      setNombre('');
      setDireccion('');
      setLocalidad('');
      setRegion('CABA');
      setTelefono('');
      setDiasEntrega('Sábados');
      setMostrarDireccionPublica(false);
      setEstado('activo');
    }
    setErrorMsg('');
    setExitoMsg('');
  }, [nodoEditar, estaAbierto]);

  if (!estaAbierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim()) {
      setErrorMsg('Por favor completá al menos el nombre del nodo y la dirección.');
      return;
    }

    setGuardando(true);
    setErrorMsg('');
    setExitoMsg('');

    try {
      const res = await onGuardar({
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        localidad: localidad.trim() || (region === 'CABA' ? 'CABA' : region),
        region,
        telefono: telefono.trim(),
        dias_entrega: diasEntrega,
        mostrar_direccion_publica: mostrarDireccionPublica,
        estado,
      });

      if (res.ok) {
        setExitoMsg(res.mensaje);
        setTimeout(() => {
          onCerrar();
        }, 1200);
      } else {
        setErrorMsg(res.mensaje);
      }
    } catch (err) {
      setErrorMsg('Ocurrió un error inesperado al guardar. Probá de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del modal */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              {nodoEditar ? 'Editar Nodo Territorial' : 'Alta de Nuevo Nodo UTT'}
            </h3>
            <p className="text-xs text-stone-500">
              {nodoEditar
                ? 'Actualizá los datos o cambiá la dirección para re-geocodificar.'
                : 'Cargá la dirección en texto libre; las coordenadas se obtienen solas.'}
            </p>
          </div>
          <button
            onClick={onCerrar}
            disabled={guardando}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de feedback */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {exitoMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{exitoMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Nombre del Nodo *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Almacén UTT Almagro o Nodo Caballito"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
            />
          </div>

          {/* Dirección en texto libre con aviso de geocodificación automática */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Dirección (Texto libre) *
              </label>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Geocodificación automática
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Díaz Vélez 3761 o Av. Maipú 1540"
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
              />
              <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              No necesitás latitud ni longitud. El sistema consulta OpenStreetMap y ubica el punto en el mapa al guardar.
            </p>
          </div>

          {/* Localidad / Barrio y Región */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Localidad / Barrio *
              </label>
              <input
                type="text"
                required
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Ej: Almagro, Morón, Banfield"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Región Territorial *
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all cursor-pointer"
              >
                <option value="CABA">CABA</option>
                <option value="Norte">Zona Norte</option>
                <option value="Sur">Zona Sur</option>
                <option value="Oeste">Zona Oeste</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
          </div>

          {/* Días de Entrega y Teléfono / WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Días de entrega *
              </label>
              <select
                value={diasEntrega}
                onChange={(e) => setDiasEntrega(e.target.value as DiaEntrega)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all cursor-pointer"
              >
                <option value="Sábados">Sábados</option>
                <option value="Jueves">Jueves</option>
                <option value="Ambos días">Ambos días (Jueves y Sábados)</option>
                <option value="A coordinar">A coordinar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Teléfono / Celular WhatsApp
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 11 4455-6677"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Casilla de Privacidad: mostrar dirección exacta en vista pública */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="mostrar_direccion_publica"
              checked={mostrarDireccionPublica}
              onChange={(e) => setMostrarDireccionPublica(e.target.checked)}
              className="mt-1 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer"
            />
            <label htmlFor="mostrar_direccion_publica" className="text-xs text-stone-700 cursor-pointer">
              <strong className="block text-stone-900 font-semibold mb-0.5">
                Mostrar dirección exacta en la vista pública
              </strong>
              Si lo dejás desmarcado (recomendado por privacidad), el público ve solo el barrio o localidad, y la dirección puntual se coordina luego del pedido.
            </label>
          </div>

          {/* Estado del nodo (activo / inactivo para borrado lógico) */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Estado de publicación
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEstado('activo')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  estado === 'activo'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Activo
              </button>
              <button
                type="button"
                onClick={() => setEstado('inactivo')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  estado === 'inactivo'
                    ? 'bg-stone-700 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Inactivo
              </button>
            </div>
          </div>

          {/* Botones de acción al pie */}
          <div className="pt-4 border-t border-stone-200/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Geocodificando y guardando...</span>
                </>
              ) : (
                <span>{nodoEditar ? 'Guardar Cambios' : 'Guardar y Geocodificar'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
