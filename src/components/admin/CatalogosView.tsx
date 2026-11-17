import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { Carrera, Grupo, Cuatrimestre, Materia, Aula } from '../../types/siaa';
import {
  GraduationCap,
  Layers,
  CalendarDays,
  BookOpen,
  DoorOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { Modal } from '../common/Modal';

export type CatalogoTipo = 'carreras' | 'grupos' | 'cuatrimestres' | 'materias' | 'aulas';

interface CatalogosViewProps {
  initialType?: CatalogoTipo;
}

export const CatalogosView: React.FC<CatalogosViewProps> = ({ initialType = 'carreras' }) => {
  const { currentUser } = useAuth();
  const [activeCatalog, setActiveCatalog] = useState<CatalogoTipo>(initialType);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Generic form fields
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [cuatrimestreId, setCuatrimestreId] = useState('');
  const [edificio, setEdificio] = useState('');
  const [capacidad, setCapacidad] = useState(30);
  const [tipoEspacio, setTipoEspacio] = useState('Aula Teórica');

  const carreras = SIAADataService.getCarreras();
  const grupos = SIAADataService.getGrupos();
  const cuatrimestres = SIAADataService.getCuatrimestres();
  const materias = SIAADataService.getMaterias();
  const aulas = SIAADataService.getAulas();

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setCodigo('');
    setCarreraId(carreras[0]?.id || '');
    setCuatrimestreId(cuatrimestres[0]?.id || '');
    setEdificio('Edificio A');
    setCapacidad(30);
    setTipoEspacio('Aula');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (activeCatalog === 'carreras') {
      if (editingId) {
        SIAADataService.updateCarrera(editingId, { nombre, codigo: codigo.toUpperCase() });
      } else {
        SIAADataService.addCarrera({ codigo: codigo.toUpperCase() || 'CARR', nombre, estado: 'activo' });
      }
    } else if (activeCatalog === 'materias') {
      const cObj = carreras.find(c => c.id === carreraId) || carreras[0];
      const cuatObj = cuatrimestres.find(cu => cu.id === cuatrimestreId) || cuatrimestres[0];
      if (editingId) {
        SIAADataService.updateMateria(editingId, { nombre, codigo: codigo.toUpperCase(), carreraId: cObj.id, cuatrimestreId: cuatObj.id });
      } else {
        SIAADataService.addMateria({
          codigo: codigo.toUpperCase() || 'MAT-00',
          nombre,
          carreraId: cObj.id,
          carreraNombre: cObj.nombre,
          cuatrimestreId: cuatObj.id,
          cuatrimestreNumero: cuatObj.numero,
          horasSemanales: 4,
          estado: 'activo'
        });
      }
    } else if (activeCatalog === 'aulas') {
      if (editingId) {
        SIAADataService.updateAula(editingId, { nombre, edificio, capacidad, tipo: tipoEspacio });
      } else {
        SIAADataService.addAula({
          nombre,
          edificio,
          capacidad,
          tipo: tipoEspacio,
          estado: 'activo'
        });
      }
    } else if (activeCatalog === 'grupos') {
      const cObj = carreras.find(c => c.id === carreraId) || carreras[0];
      const cuatObj = cuatrimestres.find(cu => cu.id === cuatrimestreId) || cuatrimestres[0];
      SIAADataService.addGrupo({
        nombre,
        carreraId: cObj.id,
        carreraNombre: cObj.nombre,
        cuatrimestreId: cuatObj.id,
        cuatrimestreNumero: cuatObj.numero,
        turno: 'matutino',
        estado: 'activo'
      });
    }

    setIsModalOpen(false);
  };

  const catalogTabs: { id: CatalogoTipo; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'carreras', label: 'Carreras', icon: GraduationCap },
    { id: 'materias', label: 'Materias', icon: BookOpen },
    { id: 'grupos', label: 'Grupos', icon: Layers },
    { id: 'cuatrimestres', label: 'Cuatrimestres', icon: CalendarDays },
    { id: 'aulas', label: 'Aulas y Espacios', icon: DoorOpen }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            Catálogos Académicos del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de programas educativos, asignaturas curriculares, aulas y agrupaciones institucionales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          Nuevo Elemento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {catalogTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeCatalog === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCatalog(tab.id);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Table by Catalog */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* CARRERAS */}
        {activeCatalog === 'carreras' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre del Programa Académico</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carreras.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-900">{c.codigo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.nombre}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setNombre(c.nombre);
                        setCodigo(c.codigo);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-emerald-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* MATERIAS */}
        {activeCatalog === 'materias' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre de la Materia</th>
                <th className="px-4 py-3">Programa / Cuatrimestre</th>
                <th className="px-4 py-3">Horas/Sem</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materias.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-emerald-900">{m.codigo}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{m.carreraNombre} • {m.cuatrimestreNumero}°</td>
                  <td className="px-4 py-3 text-slate-600">{m.horasSemanales || 4} hrs</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setNombre(m.nombre);
                        setCodigo(m.codigo);
                        setCarreraId(m.carreraId);
                        setCuatrimestreId(m.cuatrimestreId);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-emerald-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* AULAS */}
        {activeCatalog === 'aulas' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Espacio / Aula</th>
                <th className="px-4 py-3">Edificio</th>
                <th className="px-4 py-3">Tipo de Espacio</th>
                <th className="px-4 py-3">Capacidad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aulas.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{a.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{a.edificio}</td>
                  <td className="px-4 py-3 text-slate-600">{a.tipo}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.capacidad} estudiantes</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {a.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(a.id);
                        setNombre(a.nombre);
                        setEdificio(a.edificio);
                        setCapacidad(a.capacidad);
                        setTipoEspacio(a.tipo);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-emerald-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* GRUPOS */}
        {activeCatalog === 'grupos' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Cuatrimestre</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {grupos.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{g.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{g.carreraNombre}</td>
                  <td className="px-4 py-3 text-slate-600">{g.cuatrimestreNumero}°</td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{g.turno}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {g.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* CUATRIMESTRES */}
        {activeCatalog === 'cuatrimestres' && (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nivel</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Periodo Oficial</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cuatrimestres.map(cu => (
                <tr key={cu.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-emerald-900 font-mono">{cu.numero}°</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{cu.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{cu.periodo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {cu.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for creating/editing catalog element */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Gestionar ${activeCatalog.slice(0, -1).toUpperCase()}`}
        subtitle="Registro y actualización en el catálogo central SIAA"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nombre / Identificador Oficial *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cálculo Diferencial o Aula 204"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
            />
          </div>

          {(activeCatalog === 'carreras' || activeCatalog === 'materias') && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clave o Código Institucional *</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej: MAT-201 o ITIDS"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-mono"
              />
            </div>
          )}

          {(activeCatalog === 'materias' || activeCatalog === 'grupos') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Carrera Adscrita</label>
                <select
                  value={carreraId}
                  onChange={(e) => setCarreraId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {carreras.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cuatrimestre</label>
                <select
                  value={cuatrimestreId}
                  onChange={(e) => setCuatrimestreId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                >
                  {cuatrimestres.map(c => (
                    <option key={c.id} value={c.id}>{c.numero}° Cuatrimestre</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeCatalog === 'aulas' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Edificio</label>
                <input
                  type="text"
                  value={edificio}
                  onChange={(e) => setEdificio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capacidad (Estudiantes)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={capacidad}
                  onChange={(e) => setCapacidad(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Guardar en Catálogo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
