import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { ShieldCheck, Search, Filter, Clock, User, Layers } from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const logs = SIAADataService.getAuditLogs();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  let filtered = logs;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      l =>
        l.usuarioNombre.toLowerCase().includes(q) ||
        l.accion.toLowerCase().includes(q) ||
        l.modulo.toLowerCase().includes(q) ||
        (l.detalles ? l.detalles.toLowerCase().includes(q) : false)
    );
  }
  if (actionFilter !== 'all') {
    filtered = filtered.filter(l => l.accion === actionFilter);
  }

  const actions = Array.from(new Set(logs.map(l => l.accion)));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
          Seguridad y Trazabilidad
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 font-serif">
          Bitácora de Auditoría del Sistema
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Registro inmutable de todas las transacciones, accesos, autorizaciones y modificaciones realizadas en SIAA.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción o descripción de la operación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-emerald-700 w-full sm:w-auto"
        >
          <option value="all">Todas las Acciones</option>
          {actions.map(act => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Fecha y Hora</th>
                <th className="px-4 py-3">Usuario Responsable</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Acción Realizada</th>
                <th className="px-4 py-3">Detalles de la Operación</th>
                <th className="px-4 py-3">IP / Origen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {log.fechaHora}
                  </td>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-900">
                    {log.usuarioNombre}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {log.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-emerald-900">
                    {log.modulo}
                  </td>
                  <td className="px-4 py-3 font-sans font-bold text-slate-800">
                    {log.accion}
                  </td>
                  <td className="px-4 py-3 font-sans text-slate-600 max-w-xs truncate" title={log.detalles}>
                    {log.detalles}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {log.ip || '192.168.1.10'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
