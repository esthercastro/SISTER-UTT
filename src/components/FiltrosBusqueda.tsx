import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { Region, DiaEntrega } from '../types';

interface FiltrosBusquedaProps {
  busqueda: string;
  onCambiarBusqueda: (texto: string) => void;
  regionSeleccionada: Region | 'TODAS';
  onCambiarRegion: (region: Region | 'TODAS') => void;
  diaSeleccionado: DiaEntrega | 'TODOS';
  onCambiarDia: (dia: DiaEntrega | 'TODOS') => void;
  totalNodos: number;
  totalFiltrados: number;
}

const REGIONES: Array<{ id: Region | 'TODAS'; label: string }> = [
  { id: 'TODAS', label: 'Todas las regiones' },
  { id: 'CABA', label: 'CABA' },
  { id: 'Norte', label: 'Zona Norte' },
  { id: 'Sur', label: 'Zona Sur' },
  { id: 'Oeste', label: 'Zona Oeste' },
];

const DIAS: Array<{ id: DiaEntrega | 'TODOS'; label: string }> = [
  { id: 'TODOS', label: 'Cualquier día' },
  { id: 'Jueves', label: 'Jueves' },
  { id: 'Sábados', label: 'Sábados' },
  { id: 'Ambos días', label: 'Ambos días' },
];

export const FiltrosBusqueda: React.FC<FiltrosBusquedaProps> = ({
  busqueda,
  onCambiarBusqueda,
  regionSeleccionada,
  onCambiarRegion,
  diaSeleccionado,
  onCambiarDia,
  totalNodos,
  totalFiltrados,
}) => {
  const hayFiltrosActivos =
    busqueda.trim().length > 0 || regionSeleccionada !== 'TODAS' || diaSeleccionado !== 'TODOS';

  const limpiarFiltros = () => {
    onCambiarBusqueda('');
    onCambiarRegion('TODAS');
    onCambiarDia('TODOS');
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3.5">
      {/* Input de Búsqueda principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
          placeholder="Buscá por nombre del nodo, barrio o calle..."
          className="w-full pl-10 pr-9 py-2.5 bg-stone-50 hover:bg-stone-100/70 focus:bg-white text-sm text-stone-800 placeholder-stone-400 rounded-xl border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        />
        {busqueda && (
          <button
            onClick={() => onCambiarBusqueda('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
            title="Borrar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtro de Región en Chips horizontales scrolleables */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5 block">
          Región territorial
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {REGIONES.map((reg) => {
            const activa = regionSeleccionada === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => onCambiarRegion(reg.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activa
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80 border border-stone-200/60'
                }`}
              >
                {reg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtro de Días de Entrega */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5 block">
          Día de entrega
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {DIAS.map((dia) => {
            const activa = diaSeleccionado === dia.id;
            return (
              <button
                key={dia.id}
                onClick={() => onCambiarDia(dia.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activa
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 border border-stone-200/50'
                }`}
              >
                {dia.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de estado y contador de resultados */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs text-stone-500">
        <span>
          Mostrando <strong className="text-stone-800">{totalFiltrados}</strong> de {totalNodos} nodos
        </span>
        {hayFiltrosActivos && (
          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer filtros
          </button>
        )}
      </div>
    </div>
  );
};
