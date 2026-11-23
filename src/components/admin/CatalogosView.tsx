import React, { useState, useEffect } from 'react';
import { SIAADataService, OFFICIAL_PERIODS, normalizePeriodoAndAnio } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { PeriodoOficial, TipoEspacio, UserStatus } from '../../types/siaa';
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
  Edit2,
  FileSpreadsheet,
  SlidersHorizontal,
  Plus,
  AlertCircle,
  X
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export type CatalogoTipo = 'carreras' | 'grupos' | 'cuatrimestres' | 'materias' | 'aulas';

interface CatalogosViewProps {
  initialType?: CatalogoTipo;
  onOpenBulkImport?: (catalog: CatalogoTipo) => void;
}

export const CatalogosView: React.FC<CatalogosViewProps> = ({
  initialType = 'carreras',
  onOpenBulkImport
}) => {
  const { currentUser } = useAuth();
  const [activeCatalog, setActiveCatalog] = useState<CatalogoTipo>(initialType);
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    setActiveCatalog(initialType);
    setSearch('');
  }, [initialType]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: string; label: string } | null>(null);

  // Generic form fields
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [cuatrimestreId, setCuatrimestreId] = useState('');
  const [horasSemanales, setHorasSemanales] = useState(4);
  const [turno, setTurno] = useState<'matutino' | 'vespertino' | 'mixto'>('matutino');
  const [numeroCuatrimestre, setNumeroCuatrimestre] = useState(1);
  const [periodo, setPeriodo] = useState<PeriodoOficial>('Sep-Dic');
  const [anioRegistro, setAnioRegistro] = useState<number>(new Date().getFullYear());
  const [edificio, setEdificio] = useState('');
  const [capacidad, setCapacidad] = useState(30);
  const [tipoEspacio, setTipoEspacio] = useState('Aula Teórica');
  const [aulaTipoFilter, setAulaTipoFilter] = useState<string>('todos');

  // Inline quick space-type creation inside Aula modal
  const [showInlineNewTipo, setShowInlineNewTipo] = useState(false);
  const [inlineNewTipoNombre, setInlineNewTipoNombre] = useState('');

  // Space Types manager modal state
  const [isTiposModalOpen, setIsTiposModalOpen] = useState(false);
  const [returnToAulaModal, setReturnToAulaModal] = useState(false);
  const [editingTipoId, setEditingTipoId] = useState<string | null>(null);
  const [tipoFormNombre, setTipoFormNombre] = useState('');
  const [tipoFormDescripcion, setTipoFormDescripcion] = useState('');
  const [tipoFormEstado, setTipoFormEstado] = useState<UserStatus>('activo');
  const [tipoFormError, setTipoFormError] = useState<string | null>(null);
  const [deleteTipoTarget, setDeleteTipoTarget] = useState<{
    tipo: TipoEspacio;
    affectedCount: number;
    replacementNombre: string;
  } | null>(null);

  void refreshTick;
  const carreras = SIAADataService.getCarreras();
  const grupos = SIAADataService.getGrupos();
  const cuatrimestres = SIAADataService.getCuatrimestres();
  const materias = SIAADataService.getMaterias();
  const aulas = SIAADataService.getAulas();
  const tiposEspacio = SIAADataService.getTiposEspacio();
  const activeTiposEspacio = tiposEspacio.filter(t => t.estado === 'activo');

  const q = search.trim().toLowerCase();
  const filteredCarreras = q
    ? carreras.filter(c => c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q))
    : carreras;
  const filteredMaterias = q
    ? materias.filter(
        m =>
          m.nombre.toLowerCase().includes(q) ||
          m.codigo.toLowerCase().includes(q) ||
          (m.carreraNombre || '').toLowerCase().includes(q)
      )
    : materias;
  const filteredAulas = aulas.filter(a => {
    const matchesSearch =
      !q ||
      a.nombre.toLowerCase().includes(q) ||
      a.edificio.toLowerCase().includes(q) ||
      a.tipo.toLowerCase().includes(q);
    const matchesType =
      aulaTipoFilter === 'todos' ||
      a.tipo.trim().toLowerCase() === aulaTipoFilter.trim().toLowerCase();
    return matchesSearch && matchesType;
  });
  const filteredGrupos = q
    ? grupos.filter(
        g =>
          g.nombre.toLowerCase().includes(q) ||
          (g.carreraNombre || '').toLowerCase().includes(q)
      )
    : grupos;
  const filteredCuatrimestres = q
    ? cuatrimestres.filter(
        cu =>
          (cu.nombre || '').toLowerCase().includes(q) ||
          (cu.periodo || '').toLowerCase().includes(q) ||
          String(cu.anio || '').includes(q) ||
          String(cu.numero).includes(q)
      )
    : cuatrimestres;

  const getAulasCountByTipo = (tipoNombre: string) =>
    aulas.filter(a => a.tipo.trim().toLowerCase() === tipoNombre.trim().toLowerCase()).length;

  const resetTipoForm = () => {
    setEditingTipoId(null);
    setTipoFormNombre('');
    setTipoFormDescripcion('');
    setTipoFormEstado('activo');
    setTipoFormError(null);
  };

  const handleOpenTiposModal = (fromAulaModal = false) => {
    resetTipoForm();
    setDeleteTipoTarget(null);
    if (fromAulaModal) {
      setIsModalOpen(false);
      setReturnToAulaModal(true);
    } else {
      setReturnToAulaModal(false);
    }
    setIsTiposModalOpen(true);
  };

  const handleCloseTiposModal = () => {
    setIsTiposModalOpen(false);
    setDeleteTipoTarget(null);
    resetTipoForm();
    if (returnToAulaModal) {
      setReturnToAulaModal(false);
      const refreshedActive = SIAADataService.getTiposEspacio().filter(t => t.estado === 'activo');
      if (
        !refreshedActive.some(t => t.nombre.toLowerCase() === tipoEspacio.trim().toLowerCase()) &&
        refreshedActive.length > 0
      ) {
        setTipoEspacio(refreshedActive[0].nombre);
      }
      setIsModalOpen(true);
    }
  };

  const handleSaveTipoEspacio = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tipoFormNombre.trim();
    if (!cleanName) {
      setTipoFormError('Ingresa el nombre del tipo de espacio.');
      return;
    }

    const duplicate = tiposEspacio.find(
      t => t.nombre.trim().toLowerCase() === cleanName.toLowerCase() && t.id !== editingTipoId
    );
    if (duplicate) {
      setTipoFormError(`Ya existe un tipo de espacio llamado "${duplicate.nombre}".`);
      return;
    }

    if (editingTipoId) {
      const previous = tiposEspacio.find(t => t.id === editingTipoId);
      SIAADataService.updateTipoEspacio(
        editingTipoId,
        {
          nombre: cleanName,
          descripcion: tipoFormDescripcion.trim(),
          estado: tipoFormEstado
        },
        currentUser || undefined
      );
      if (previous && tipoEspacio.trim().toLowerCase() === previous.nombre.trim().toLowerCase()) {
        setTipoEspacio(cleanName);
      }
    } else {
      SIAADataService.addTipoEspacio(
        {
          nombre: cleanName,
          descripcion: tipoFormDescripcion.trim(),
          estado: tipoFormEstado
        },
        currentUser || undefined
      );
    }

    resetTipoForm();
    setRefreshTick(t => t + 1);
  };

  const handleToggleTipoStatus = (tipo: TipoEspacio) => {
    const nextEstado: UserStatus = tipo.estado === 'activo' ? 'inactivo' : 'activo';
    SIAADataService.updateTipoEspacio(tipo.id, { estado: nextEstado }, currentUser || undefined);
    setRefreshTick(t => t + 1);
  };

  const handleRequestDeleteTipo = (tipo: TipoEspacio) => {
    setTipoFormError(null);
    if (tiposEspacio.length <= 1) {
      setTipoFormError('Debe existir al menos un tipo de espacio configurado en el catálogo.');
      return;
    }
    const affectedCount = getAulasCountByTipo(tipo.nombre);
    const fallback = tiposEspacio.find(t => t.id !== tipo.id && t.estado === 'activo') || tiposEspacio.find(t => t.id !== tipo.id);
    setDeleteTipoTarget({
      tipo,
      affectedCount,
      replacementNombre: fallback?.nombre || ''
    });
  };

  const handleConfirmDeleteTipo = () => {
    if (!deleteTipoTarget) return;
    SIAADataService.deleteTipoEspacio(
      deleteTipoTarget.tipo.id,
      currentUser || undefined,
      deleteTipoTarget.affectedCount > 0 ? deleteTipoTarget.replacementNombre : undefined
    );
    if (aulaTipoFilter.toLowerCase() === deleteTipoTarget.tipo.nombre.toLowerCase()) {
      setAulaTipoFilter('todos');
    }
    if (editingTipoId === deleteTipoTarget.tipo.id) {
      resetTipoForm();
    }
    setDeleteTipoTarget(null);
    setRefreshTick(t => t + 1);
  };

  const handleCreateInlineTipo = () => {
    const clean = inlineNewTipoNombre.trim();
    if (!clean) return;
    const created = SIAADataService.addTipoEspacio(
      { nombre: clean, estado: 'activo' },
      currentUser || undefined
    );
    setTipoEspacio(created.nombre);
    setInlineNewTipoNombre('');
    setShowInlineNewTipo(false);
    setRefreshTick(t => t + 1);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNombre('');
    setCodigo('');
    setCarreraId(carreras[0]?.id || '');
    setCuatrimestreId(cuatrimestres[0]?.id || '');
    setHorasSemanales(4);
    setTurno('matutino');
    setNumeroCuatrimestre(cuatrimestres.length + 1);
    setPeriodo('Sep-Dic');
    setAnioRegistro(new Date().getFullYear());
    setEdificio('Edificio A');
    setCapacidad(30);
    setTipoEspacio(activeTiposEspacio[0]?.nombre || tiposEspacio[0]?.nombre || 'Aula Teórica');
    setShowInlineNewTipo(false);
    setInlineNewTipoNombre('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (activeCatalog === 'carreras') {
      if (editingId) {
        SIAADataService.updateCarrera(editingId, { nombre: nombre.trim(), codigo: codigo.trim().toUpperCase() });
      } else {
        SIAADataService.addCarrera({ codigo: codigo.trim().toUpperCase() || 'CARR', nombre: nombre.trim(), estado: 'activo' });
      }
    } else if (activeCatalog === 'materias') {
      const cObj = carreras.find(c => c.id === carreraId) || carreras[0];
      const cuatObj = cuatrimestres.find(cu => cu.id === cuatrimestreId) || cuatrimestres[0];
      if (editingId) {
        SIAADataService.updateMateria(editingId, {
          nombre: nombre.trim(),
          codigo: codigo.trim().toUpperCase(),
          carreraId: cObj?.id || '',
          carreraNombre: cObj?.nombre || '',
          cuatrimestreId: cuatObj?.id || '',
          cuatrimestreNumero: cuatObj?.numero || 1,
          horasSemanales
        });
      } else {
        SIAADataService.addMateria({
          codigo: codigo.trim().toUpperCase() || 'MAT-00',
          nombre: nombre.trim(),
          carreraId: cObj?.id || '',
          carreraNombre: cObj?.nombre || '',
          cuatrimestreId: cuatObj?.id || '',
          cuatrimestreNumero: cuatObj?.numero || 1,
          horasSemanales,
          estado: 'activo'
        });
      }
    } else if (activeCatalog === 'aulas') {
      if (editingId) {
        SIAADataService.updateAula(editingId, {
          nombre: nombre.trim(),
          edificio: edificio.trim(),
          capacidad,
          tipo: tipoEspacio.trim()
        });
      } else {
        SIAADataService.addAula({
          nombre: nombre.trim(),
          edificio: edificio.trim(),
          capacidad,
          tipo: tipoEspacio.trim() || 'Aula Teórica',
          estado: 'activo'
        });
      }
    } else if (activeCatalog === 'grupos') {
      const cObj = carreras.find(c => c.id === carreraId) || carreras[0];
      const cuatObj = cuatrimestres.find(cu => cu.id === cuatrimestreId) || cuatrimestres[0];
      if (editingId) {
        SIAADataService.updateGrupo(editingId, {
          nombre: nombre.trim(),
          carreraId: cObj?.id || '',
          carreraNombre: cObj?.nombre || '',
          cuatrimestreId: cuatObj?.id || '',
          cuatrimestreNumero: cuatObj?.numero || 1,
          turno
        });
      } else {
        SIAADataService.addGrupo({
          nombre: nombre.trim(),
          carreraId: cObj?.id || '',
          carreraNombre: cObj?.nombre || '',
          cuatrimestreId: cuatObj?.id || '',
          cuatrimestreNumero: cuatObj?.numero || 1,
          turno,
          estado: 'activo'
        });
      }
    } else if (activeCatalog === 'cuatrimestres') {
      const parsedYear = Number(anioRegistro) || new Date().getFullYear();
      if (editingId) {
        SIAADataService.updateCuatrimestre(editingId, {
          numero: numeroCuatrimestre,
          nombre: nombre.trim(),
          periodo,
          anio: parsedYear
        });
      } else {
        SIAADataService.addCuatrimestre({
          numero: numeroCuatrimestre,
          nombre: nombre.trim(),
          periodo,
          anio: parsedYear,
          estado: 'activo'
        });
      }
    }

    setIsModalOpen(false);
    setRefreshTick(t => t + 1);
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteItem) return;
    if (activeCatalog === 'carreras') {
      SIAADataService.deleteCarrera(confirmDeleteItem.id, currentUser || undefined);
    } else if (activeCatalog === 'materias') {
      SIAADataService.deleteMateria(confirmDeleteItem.id, currentUser || undefined);
    } else if (activeCatalog === 'aulas') {
      SIAADataService.deleteAula(confirmDeleteItem.id, currentUser || undefined);
    } else if (activeCatalog === 'grupos') {
      SIAADataService.deleteGrupo(confirmDeleteItem.id, currentUser || undefined);
    } else if (activeCatalog === 'cuatrimestres') {
      SIAADataService.deleteCuatrimestre(confirmDeleteItem.id, currentUser || undefined);
    }
    setConfirmDeleteItem(null);
    setRefreshTick(t => t + 1);
  };

  const catalogTabs: { id: CatalogoTipo; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'carreras', label: 'Carreras', icon: GraduationCap },
    { id: 'materias', label: 'Materias', icon: BookOpen },
    { id: 'grupos', label: 'Grupos', icon: Layers },
    { id: 'cuatrimestres', label: 'Cuatrimestres', icon: CalendarDays },
    { id: 'aulas', label: 'Aulas y Espacios', icon: DoorOpen }
  ];

  const singularLabels: Record<CatalogoTipo, string> = {
    carreras: 'CARRERA',
    materias: 'MATERIA',
    grupos: 'GRUPO',
    cuatrimestres: 'CUATRIMESTRE',
    aulas: 'AULA / ESPACIO'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            Catálogos Académicos del Sistema
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registro, modificación y eliminación de programas educativos, asignaturas curriculares, grupos, cuatrimestres y aulas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeCatalog === 'aulas' && (
            <button
              type="button"
              onClick={() => handleOpenTiposModal(false)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Tipos de Espacios</span>
              <span className="tabular-nums text-[11px] font-mono text-slate-500 dark:text-slate-400">
                ({tiposEspacio.length})
              </span>
            </button>
          )}

          {onOpenBulkImport && (
            <button
              type="button"
              onClick={() => onOpenBulkImport(activeCatalog)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Plantilla / Carga Masiva
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Nuevo Elemento
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
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
                    ? 'bg-emerald-900 dark:bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeCatalog === 'aulas' && (
            <select
              value={aulaTipoFilter}
              onChange={(e) => setAulaTipoFilter(e.target.value)}
              aria-label="Filtrar por tipo de espacio"
              className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
            >
              <option value="todos">Todos los tipos ({aulas.length})</option>
              {tiposEspacio.map(t => (
                <option key={t.id} value={t.nombre}>
                  {t.nombre} ({getAulasCountByTipo(t.nombre)})
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar catálogo..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>
      </div>

      {/* Content Table by Catalog */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {/* CARRERAS */}
          {activeCatalog === 'carreras' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre del Programa Académico</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCarreras.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-900 dark:text-emerald-400">{c.codigo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{c.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70">
                        {c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id);
                            setNombre(c.nombre);
                            setCodigo(c.codigo);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Modificar carrera"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItem({ id: c.id, label: `${c.codigo} - ${c.nombre}` })}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                          title="Eliminar carrera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* MATERIAS */}
          {activeCatalog === 'materias' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre de la Materia</th>
                  <th className="px-4 py-3">Programa / Cuatrimestre</th>
                  <th className="px-4 py-3">Horas/Sem</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaterias.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-900 dark:text-emerald-400">{m.codigo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{m.nombre}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.carreraNombre} • {m.cuatrimestreNumero}°</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.horasSemanales || 4} hrs</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70">
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(m.id);
                            setNombre(m.nombre);
                            setCodigo(m.codigo);
                            setCarreraId(m.carreraId);
                            setCuatrimestreId(m.cuatrimestreId);
                            setHorasSemanales(m.horasSemanales || 4);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Modificar materia"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItem({ id: m.id, label: `${m.codigo} - ${m.nombre}` })}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                          title="Eliminar materia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* AULAS */}
          {activeCatalog === 'aulas' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Espacio / Aula</th>
                  <th className="px-4 py-3">Edificio</th>
                  <th className="px-4 py-3">Tipo de Espacio</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAulas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No hay aulas o espacios registrados que coincidan con el filtro actual.
                    </td>
                  </tr>
                ) : (
                  filteredAulas.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{a.nombre}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.edificio}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{a.tipo}</td>
                      <td className="px-4 py-3 font-medium tabular-nums text-slate-800 dark:text-slate-200">{a.capacidad} estudiantes</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70">
                          {a.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(a.id);
                              setNombre(a.nombre);
                              setEdificio(a.edificio);
                              setCapacidad(a.capacidad);
                              setTipoEspacio(a.tipo);
                              setShowInlineNewTipo(false);
                              setInlineNewTipoNombre('');
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Modificar aula"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItem({ id: a.id, label: `${a.nombre} (${a.edificio})` })}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                            title="Eliminar aula"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* GRUPOS */}
          {activeCatalog === 'grupos' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Carrera</th>
                  <th className="px-4 py-3">Cuatrimestre</th>
                  <th className="px-4 py-3">Turno</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGrupos.map(g => (
                  <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{g.nombre}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{g.carreraNombre}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{g.cuatrimestreNumero}°</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 capitalize">{g.turno}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70">
                        {g.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(g.id);
                            setNombre(g.nombre);
                            setCarreraId(g.carreraId);
                            setCuatrimestreId(g.cuatrimestreId);
                            setTurno(g.turno);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Modificar grupo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItem({ id: g.id, label: g.nombre })}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                          title="Eliminar grupo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* CUATRIMESTRES */}
          {activeCatalog === 'cuatrimestres' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Periodo Oficial</th>
                  <th className="px-4 py-3">Año</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCuatrimestres.map(cu => (
                  <tr key={cu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-emerald-900 dark:text-emerald-400 font-mono">{cu.numero}°</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{cu.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-300 font-semibold">
                        {cu.periodo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{cu.anio}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70">
                        {cu.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const normalized = normalizePeriodoAndAnio(cu.periodo, cu.anio);
                            setEditingId(cu.id);
                            setNumeroCuatrimestre(cu.numero);
                            setNombre(cu.nombre || `${cu.numero}° Cuatrimestre`);
                            setPeriodo(normalized.periodo);
                            setAnioRegistro(normalized.anio);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                          title="Modificar cuatrimestre"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteItem({ id: cu.id, label: `${cu.numero}° - ${cu.nombre}` })}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                          title="Eliminar cuatrimestre"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal for creating/editing catalog element */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${editingId ? 'Modificar' : 'Registrar'} ${singularLabels[activeCatalog]}`}
        subtitle="Registro y actualización en el catálogo central SIAA"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre / Identificador Oficial *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cálculo Diferencial, Aula 204 o 1er Cuatrimestre"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
            />
          </div>

          {(activeCatalog === 'carreras' || activeCatalog === 'materias') && (
            <div className={activeCatalog === 'materias' ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Clave o Código Institucional *</label>
                <input
                  type="text"
                  required
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej: MAT-201 o ITIDS"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                />
              </div>

              {activeCatalog === 'materias' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Horas Semanales</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={horasSemanales}
                    onChange={(e) => setHorasSemanales(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
              )}
            </div>
          )}

          {(activeCatalog === 'materias' || activeCatalog === 'grupos') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Carrera Adscrita</label>
                <select
                  value={carreraId}
                  onChange={(e) => setCarreraId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {carreras.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Cuatrimestre</label>
                <select
                  value={cuatrimestreId}
                  onChange={(e) => setCuatrimestreId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {cuatrimestres.map(c => (
                    <option key={c.id} value={c.id}>{c.numero}° Cuatrimestre</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeCatalog === 'grupos' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Turno</label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as 'matutino' | 'vespertino' | 'mixto')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 capitalize"
              >
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>
          )}

          {activeCatalog === 'cuatrimestres' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Número / Nivel *</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  required
                  value={numeroCuatrimestre}
                  onChange={(e) => setNumeroCuatrimestre(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Periodo Oficial *</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value as PeriodoOficial)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {OFFICIAL_PERIODS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Año del Registro *</label>
                <input
                  type="number"
                  min={1990}
                  max={2100}
                  required
                  value={anioRegistro}
                  onChange={(e) => setAnioRegistro(Number(e.target.value))}
                  placeholder="2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-semibold"
                />
              </div>
            </div>
          )}

          {activeCatalog === 'aulas' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Edificio</label>
                  <input
                    type="text"
                    value={edificio}
                    onChange={(e) => setEdificio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Capacidad</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={capacidad}
                    onChange={(e) => setCapacidad(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Tipo de Espacio *</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineNewTipo(prev => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {showInlineNewTipo ? 'Cerrar' : 'Nuevo tipo'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={() => handleOpenTiposModal(true)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:underline whitespace-nowrap shrink-0"
                    >
                      Administrar tipos
                    </button>
                  </div>
                </div>

                {(() => {
                  const selectableTipos = [...activeTiposEspacio];
                  if (
                    tipoEspacio &&
                    !selectableTipos.some(t => t.nombre.toLowerCase() === tipoEspacio.trim().toLowerCase())
                  ) {
                    selectableTipos.push({
                      id: 'legacy-current',
                      nombre: tipoEspacio,
                      estado: 'activo'
                    });
                  }
                  return (
                    <select
                      value={tipoEspacio}
                      onChange={(e) => setTipoEspacio(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
                    >
                      {selectableTipos.map(t => (
                        <option key={t.id} value={t.nombre}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  );
                })()}

                {showInlineNewTipo && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <input
                      type="text"
                      value={inlineNewTipoNombre}
                      onChange={(e) => setInlineNewTipoNombre(e.target.value)}
                      placeholder="Ej: Sala de Simulación, Auditorio..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleCreateInlineTipo}
                      disabled={!inlineNewTipoNombre.trim()}
                      className="px-3 py-1.5 rounded-md bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs whitespace-nowrap shrink-0 transition-colors"
                    >
                      Agregar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              {editingId ? 'Guardar Cambios' : 'Guardar en Catálogo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal for managing configurable Space Types */}
      <Modal
        isOpen={isTiposModalOpen}
        onClose={handleCloseTiposModal}
        title="Gestión de Tipos de Espacios"
        subtitle="Crea, modifica, activa o elimina las categorías de espacios según las necesidades de la institución"
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs">
          {/* Create / Edit Form */}
          <form
            onSubmit={handleSaveTipoEspacio}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {editingTipoId ? 'Modificar Tipo de Espacio' : 'Agregar Nuevo Tipo de Espacio'}
              </h3>
              {editingTipoId && (
                <button
                  type="button"
                  onClick={resetTipoForm}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar edición
                </button>
              )}
            </div>

            {tipoFormError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tipoFormError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={tipoFormNombre}
                  onChange={(e) => {
                    setTipoFormNombre(e.target.value);
                    if (tipoFormError) setTipoFormError(null);
                  }}
                  placeholder="Ej: Sala de Tutorías, Auditorio"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción breve
                </label>
                <input
                  type="text"
                  value={tipoFormDescripcion}
                  onChange={(e) => setTipoFormDescripcion(e.target.value)}
                  placeholder="Uso o equipamiento del espacio"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado
                </label>
                <select
                  value={tipoFormEstado}
                  onChange={(e) => setTipoFormEstado(e.target.value as UserStatus)}
                  className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {editingTipoId
                  ? 'Si cambias el nombre, las aulas asociadas se actualizarán automáticamente.'
                  : 'Los tipos activos estarán disponibles al registrar o editar aulas y espacios.'}
              </p>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold transition-colors whitespace-nowrap shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                {editingTipoId ? 'Actualizar Tipo' : 'Agregar Tipo'}
              </button>
            </div>
          </form>

          {/* Safe Delete Reassignment Box when deleting a space type */}
          {deleteTipoTarget && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Eliminar tipo "{deleteTipoTarget.tipo.nombre}"
                  </p>
                  <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                    {deleteTipoTarget.affectedCount > 0
                      ? `Hay ${deleteTipoTarget.affectedCount} espacio(s) asignado(s) a este tipo. Selecciona el tipo al que deseas reasignarlos antes de eliminar:`
                      : 'Este tipo no tiene aulas asignadas actualmente. ¿Deseas eliminarlo del catálogo?'}
                  </p>
                </div>
              </div>

              {deleteTipoTarget.affectedCount > 0 && (
                <div>
                  <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Reasignar espacios afectados a:
                  </label>
                  <select
                    value={deleteTipoTarget.replacementNombre}
                    onChange={(e) =>
                      setDeleteTipoTarget(prev =>
                        prev ? { ...prev, replacementNombre: e.target.value } : null
                      )
                    }
                    className="w-full sm:w-80 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
                  >
                    {tiposEspacio
                      .filter(t => t.id !== deleteTipoTarget.tipo.id)
                      .map(t => (
                        <option key={t.id} value={t.nombre}>
                          {t.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTipoTarget(null)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTipo}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  Confirmar eliminación
                </button>
              </div>
            </div>
          )}

          {/* Configured Space Types Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Tipo de Espacio</th>
                    <th className="px-4 py-2.5 text-right">Aulas</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tiposEspacio.map(tipo => {
                    const count = getAulasCountByTipo(tipo.nombre);
                    const isEditingThis = editingTipoId === tipo.id;
                    return (
                      <tr
                        key={tipo.id}
                        className={`transition-colors ${
                          isEditingThis
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{tipo.nombre}</div>
                          {tipo.descripcion && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {tipo.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                          {count}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleTipoStatus(tipo)}
                            title="Cambiar estado activo/inactivo"
                            className={`text-[11px] font-bold uppercase tracking-wide transition-colors ${
                              tipo.estado === 'activo'
                                ? 'text-emerald-700 dark:text-emerald-400 hover:underline'
                                : 'text-slate-400 dark:text-slate-500 hover:underline'
                            }`}
                          >
                            {tipo.estado}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTipoId(tipo.id);
                                setTipoFormNombre(tipo.nombre);
                                setTipoFormDescripcion(tipo.descripcion || '');
                                setTipoFormEstado(tipo.estado);
                                setTipoFormError(null);
                                setDeleteTipoTarget(null);
                              }}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Modificar tipo de espacio"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRequestDeleteTipo(tipo)}
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded transition-colors"
                              title="Eliminar tipo de espacio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCloseTiposModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
            >
              {returnToAulaModal ? 'Volver al formulario' : 'Cerrar'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteItem}
        onClose={() => setConfirmDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar elemento del catálogo?"
        message={`Se eliminará permanentemente "${confirmDeleteItem?.label}" del catálogo institucional.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
