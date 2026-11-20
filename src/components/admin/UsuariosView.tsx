import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import { SIAAUser, UserRole } from '../../types/siaa';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  KeyRound,
  UserX,
  UserCheck,
  Shield,
  GraduationCap,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  FileSpreadsheet,
  Layers,
  GitBranch,
  Check,
  Camera,
  Upload
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { UserAvatar } from '../common/UserAvatar';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';
import {
  ROLE_HIERARCHY,
  getRoleMeta,
  isTeachingRole,
  getUserCarreraIds,
  userHasCarrera,
  userMatchesCareerScope
} from '../../utils/roles';

interface UsuariosViewProps {
  onOpenBulkImport?: () => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({ onOpenBulkImport }) => {
  const { currentUser, refreshUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [careerFilter, setCareerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SIAAUser | null>(null);
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<SIAAUser | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<SIAAUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<SIAAUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
  const [showHierarchyPanel, setShowHierarchyPanel] = useState(false);
  const [trackingUser, setTrackingUser] = useState<SIAAUser | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState('');
  const [rol, setRol] = useState<UserRole>('alumno');
  const [matricula, setMatricula] = useState('');
  const [numeroEmpleado, setNumeroEmpleado] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [carrerasIds, setCarrerasIds] = useState<string[]>([]);
  const [grupoId, setGrupoId] = useState('');
  const [fotoURL, setFotoURL] = useState<string | undefined>(undefined);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);

  void refreshTick;
  const users = SIAADataService.getUsers();
  const carreras = SIAADataService.getCarreras();
  const grupos = SIAADataService.getGrupos();
  const asesorias = SIAADataService.getAsesorias();

  let filtered = users;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      u =>
        u.nombre.toLowerCase().includes(q) ||
        u.apellidoPaterno.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q) ||
        (u.matricula && u.matricula.toLowerCase().includes(q)) ||
        (u.numeroEmpleado && u.numeroEmpleado.toLowerCase().includes(q))
    );
  }
  if (roleFilter !== 'all') {
    filtered = filtered.filter(u => u.rol === roleFilter);
  }
  if (careerFilter !== 'all') {
    filtered = filtered.filter(u => userHasCarrera(u, careerFilter));
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(u => u.estado === statusFilter);
  }

  const openCreateModal = () => {
    setEditingUser(null);
    setNombre('');
    setApellidoPaterno('');
    setApellidoMaterno('');
    setCorreo('');
    setRol('alumno');
    setMatricula('');
    setNumeroEmpleado('');
    const defaultCarr = carreras[0]?.id || '';
    setCarreraId(defaultCarr);
    setCarrerasIds(defaultCarr ? [defaultCarr] : []);
    setGrupoId(grupos[0]?.id || '');
    setFotoURL(undefined);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (u: SIAAUser) => {
    const userCarreras = getUserCarreraIds(u);
    setEditingUser(u);
    setNombre(u.nombre);
    setApellidoPaterno(u.apellidoPaterno);
    setApellidoMaterno(u.apellidoMaterno);
    setCorreo(u.correo);
    setRol(u.rol);
    setMatricula(u.matricula || '');
    setNumeroEmpleado(u.numeroEmpleado || '');
    setCarreraId(userCarreras[0] || '');
    setCarrerasIds(userCarreras);
    setGrupoId(u.grupoId || '');
    setFotoURL(u.fotoURL);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleUserPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFormError(null);
    setPhotoUploading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxSize: 256,
        preserveTransparency: false,
        quality: 0.85
      });
      setFotoURL(dataUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo procesar la fotografía seleccionada.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleCareerSelection = (cid: string) => {
    setCarrerasIds(prev => {
      const next = prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid];
      setCarreraId(next[0] || '');
      return next;
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim() || !apellidoPaterno.trim() || !correo.trim()) {
      setFormError('Nombre, apellido paterno y correo electrónico son obligatorios.');
      return;
    }

    if (rol === 'jefe_carrera' && carrerasIds.length === 0) {
      setFormError('Un Jefe de Carrera debe tener al menos una carrera adscrita para el seguimiento.');
      return;
    }

    if (!currentUser) return;

    const finalCarrerasIds =
      rol === 'alumno'
        ? carreraId
          ? [carreraId]
          : []
        : carrerasIds;
    const primaryCarreraId = finalCarrerasIds[0] || undefined;

    if (editingUser) {
      SIAADataService.updateUser(editingUser.uid, {
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim(),
        rol,
        matricula: rol === 'alumno' ? matricula.trim() : undefined,
        numeroEmpleado: rol !== 'alumno' ? numeroEmpleado.trim() : undefined,
        carreraId: primaryCarreraId,
        carrerasIds: finalCarrerasIds,
        grupoId: rol === 'alumno' ? grupoId : undefined,
        fotoURL
      }, currentUser);

      if (editingUser.uid === currentUser.uid) {
        refreshUser();
      }
    } else {
      SIAADataService.createUser({
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim(),
        rol,
        matricula: rol === 'alumno' ? matricula.trim() : undefined,
        numeroEmpleado: rol !== 'alumno' ? numeroEmpleado.trim() : undefined,
        carreraId: primaryCarreraId,
        carrerasIds: finalCarrerasIds,
        grupoId: rol === 'alumno' ? grupoId : undefined,
        fotoURL,
        estado: 'activo'
      }, currentUser);
    }

    setIsFormModalOpen(false);
    setRefreshTick(t => t + 1);
  };

  const handleToggleActive = (userToToggle: SIAAUser) => {
    if (!currentUser) return;
    const newStatus = userToToggle.estado === 'activo' ? 'inactivo' : 'activo';
    SIAADataService.updateUser(userToToggle.uid, { estado: newStatus }, currentUser);
    setRefreshTick(t => t + 1);
  };

  const handleDeleteUser = () => {
    if (!confirmDeleteUser || !currentUser) return;
    SIAADataService.deleteUser(confirmDeleteUser.uid, currentUser);
    setConfirmDeleteUser(null);
    setRefreshTick(t => t + 1);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !currentUser) return;
    if (newPassword.length < 6) {
      return;
    }
    SIAADataService.resetPassword(resetPassUser.uid, newPassword, currentUser);
    setPassSuccess(true);
    setTimeout(() => {
      setResetPassUser(null);
      setNewPassword('');
      setPassSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
            Gestión Institucional de Usuarios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administración de cuentas y los 7 niveles jerárquicos institucionales (desde Administrador hasta Alumnos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHierarchyPanel(v => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border font-semibold text-xs transition-colors ${
              showHierarchyPanel
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            {showHierarchyPanel ? 'Ocultar Niveles y Funciones' : 'Ver Niveles y Funciones'}
          </button>

          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Plantilla / Carga Masiva
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            Registrar Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Collapsible Role Hierarchy & Functions Matrix */}
      {showHierarchyPanel && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Estructura Jerárquica Institucional (7 Niveles y Funciones)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cada nivel define permisos específicos de autorización, asignación, tutoría, impartición de asesorías y consulta.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 text-xs">
            {ROLE_HIERARCHY.map(level => (
              <div
                key={level.code}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${level.badgeClass}`}>
                    Nivel {level.nivel}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                    {users.filter(u => u.rol === level.code).length} usuarios
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">{level.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{level.description}</p>
                <ul className="space-y-1 pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                  {level.funciones.map((fn, idx) => (
                    <li key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">•</span>
                      <span>{fn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, matrícula o no. empleado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todos los Niveles</option>
            {ROLE_HIERARCHY.map(level => (
              <option key={level.code} value={level.code}>
                Nivel {level.nivel}: {level.label}
              </option>
            ))}
          </select>

          <select
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todas las Carreras</option>
            {carreras.map(c => (
              <option key={c.id} value={c.id}>
                {c.codigo} — {c.nombre}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Usuario / Nombre</th>
                <th className="px-4 py-3">Correo Institucional</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Identificador</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        user={u}
                        size="sm"
                        className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{u.nombre} {u.apellidoPaterno} {u.apellidoMaterno}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">UID: {u.uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                    {u.correo}
                  </td>
                  <td className="px-4 py-3.5">
                    {(() => {
                      const meta = getRoleMeta(u.rol);
                      const assignedCarrs = getUserCarreraIds(u)
                        .map(id => carreras.find(c => c.id === id))
                        .filter((c): c is NonNullable<typeof c> => Boolean(c));
                      return (
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${meta.badgeClass}`}>
                            {u.rol === 'admin' && <Shield className="w-3 h-3 shrink-0" />}
                            {(u.rol === 'director' || u.rol === 'jefe_carrera') && <GraduationCap className="w-3 h-3 shrink-0" />}
                            {isTeachingRole(u.rol) && <BookOpen className="w-3 h-3 shrink-0" />}
                            {u.rol === 'alumno' && <UserIcon className="w-3 h-3 shrink-0" />}
                            <span>N{meta.nivel} • {meta.label}</span>
                          </span>
                          {assignedCarrs.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {assignedCarrs.map(carr => (
                                <span
                                  key={carr.id}
                                  title={carr.nombre}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {carr.codigo}
                                </span>
                              ))}
                            </div>
                          ) : (
                            u.rol !== 'alumno' && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                Ámbito institucional (Todas)
                              </span>
                            )
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {u.matricula || u.numeroEmpleado || '--'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.estado === 'activo'
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                    }`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {u.rol !== 'alumno' && (
                        <button
                          type="button"
                          onClick={() => setTrackingUser(u)}
                          className="p-1.5 text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50 rounded transition-colors"
                          title="Ver seguimiento de niveles hacia abajo"
                        >
                          <GitBranch className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-900 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Editar datos del usuario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetPassUser(u);
                          setNewPassword('');
                          setPassSuccess(false);
                        }}
                        className="p-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors"
                        title="Restablecer contraseña"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (u.estado === 'activo') {
                            setConfirmDeactivateUser(u);
                          } else {
                            handleToggleActive(u);
                          }
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          u.estado === 'activo'
                            ? 'text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                            : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        }`}
                        title={u.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {u.estado === 'activo' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      {u.uid !== currentUser?.uid && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUser(u)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="Eliminar usuario permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingUser ? `Modificar Usuario — ${editingUser.nombre}` : 'Registrar Nuevo Usuario Institucional'}
        subtitle="Asigne roles, credenciales y adscripción académica"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <p className="font-semibold">{formError}</p>
            </div>
          )}

          {/* Profile Photo Upload Block */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="relative shrink-0">
              <UserAvatar
                fotoURL={fotoURL}
                nombre={nombre || 'U'}
                apellidoPaterno={apellidoPaterno || 'S'}
                size="lg"
                className="bg-emerald-900 text-amber-400 border-2 border-amber-500 shadow-sm"
              />
              <button
                type="button"
                disabled={photoUploading}
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-400 text-emerald-950 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs"
                title="Seleccionar fotografía"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                Fotografía de Perfil del Usuario
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Opcional. Formatos PNG, JPG o WEBP. Se almacena directamente en el registro del usuario.
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleUserPhotoSelect}
                className="hidden"
              />
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  disabled={photoUploading}
                  onClick={() => photoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-semibold transition-colors disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  {photoUploading ? 'Procesando...' : fotoURL ? 'Cambiar Fotografía' : 'Subir Fotografía'}
                </button>
                {fotoURL && (
                  <button
                    type="button"
                    onClick={() => setFotoURL(undefined)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre(s) *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Apellido Paterno *</label>
              <input
                type="text"
                value={apellidoPaterno}
                onChange={(e) => setApellidoPaterno(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Apellido Materno</label>
              <input
                type="text"
                value={apellidoMaterno}
                onChange={(e) => setApellidoMaterno(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico *</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nivel Jerárquico / Rol *</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              >
                {ROLE_HIERARCHY.map(level => (
                  <option key={level.code} value={level.code}>
                    Nivel {level.nivel} — {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Role Functions Preview */}
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-[11px]">
            <p className="font-bold text-emerald-900 dark:text-emerald-300">
              Funciones de {getRoleMeta(rol).label}:
            </p>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {getRoleMeta(rol).funciones.join(' • ')}
            </p>
          </div>

          {/* Role specific fields */}
          {rol === 'alumno' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ej: 2026-ITIDS-042"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Carrera</label>
                <select
                  value={carreraId}
                  onChange={(e) => {
                    setCarreraId(e.target.value);
                    setCarrerasIds(e.target.value ? [e.target.value] : []);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {carreras.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Grupo</label>
                <select
                  value={grupoId}
                  onChange={(e) => setGrupoId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {grupos.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Número de Empleado / Clave</label>
                <input
                  type="text"
                  value={numeroEmpleado}
                  onChange={(e) => setNumeroEmpleado(e.target.value)}
                  placeholder="Ej: PTC-201, PA-301, JEF-101"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-200">
                    Adscripción a Carreras (Impartición / Seguimiento Jerárquico) {rol === 'jefe_carrera' ? '*' : ''}
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = carreras.map(c => c.id);
                        setCarrerasIds(allIds);
                        setCarreraId(allIds[0] || '');
                      }}
                      className="text-emerald-800 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      Seleccionar todas
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCarrerasIds([]);
                        setCarreraId('');
                      }}
                      className="text-slate-500 dark:text-slate-400 font-medium hover:underline"
                    >
                      Sin restricción (Institucional)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {carreras.map(c => {
                    const isSelected = carrerasIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCareerSelection(c.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-emerald-700 border-emerald-700 text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono font-bold text-[11px]">{c.codigo}</p>
                          <p className="text-[11px] leading-snug line-clamp-2 opacity-90">{c.nombre}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {carrerasIds.length === 0
                    ? 'Ámbito institucional global: podrá visualizar o impartir seguimiento en todas las carreras.'
                    : `Adscrito a ${carrerasIds.length} ${carrerasIds.length === 1 ? 'carrera' : 'carreras'}: ${carrerasIds
                        .map(id => carreras.find(c => c.id === id)?.codigo)
                        .filter(Boolean)
                        .join(', ')}.`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {resetPassUser && (
        <Modal
          isOpen={!!resetPassUser}
          onClose={() => setResetPassUser(null)}
          title={`Restablecer Contraseña — ${resetPassUser.nombre}`}
          maxWidth="sm"
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
            {passSuccess ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-center font-bold">
                ¡Contraseña restablecida exitosamente!
              </div>
            ) : (
              <>
                <p className="text-slate-600 dark:text-slate-300">
                  Ingrese la nueva clave provisional de acceso para <strong className="text-slate-900 dark:text-slate-100">{resetPassUser.correo}</strong>.
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña (mínimo 6 caracteres)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPassUser(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={newPassword.length < 6}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Actualizar Clave
                  </button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* Downward Hierarchical Tracking Modal */}
      {trackingUser && (
        <Modal
          isOpen={!!trackingUser}
          onClose={() => setTrackingUser(null)}
          title={`Seguimiento Jerárquico — ${trackingUser.nombre} ${trackingUser.apellidoPaterno}`}
          subtitle="Alcance de supervisión hacia los niveles inferiores según las carreras adscritas"
          maxWidth="3xl"
        >
          {(() => {
            const actorMeta = getRoleMeta(trackingUser.rol);
            const scopeCarreras = getUserCarreraIds(trackingUser);
            const scopeLabels = scopeCarreras
              .map(id => carreras.find(c => c.id === id)?.codigo)
              .filter(Boolean);

            const downwardLevels = ROLE_HIERARCHY.filter(l => l.nivel > actorMeta.nivel);
            const subordinates = users.filter(
              u =>
                u.uid !== trackingUser.uid &&
                getRoleMeta(u.rol).nivel > actorMeta.nivel &&
                userMatchesCareerScope(u, scopeCarreras)
            );

            return (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${actorMeta.badgeClass}`}>
                      Nivel {actorMeta.nivel} • {actorMeta.label}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      Carreras adscritas:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {scopeLabels.length > 0 ? scopeLabels.join(', ') : 'Ámbito Institucional (Todas las carreras)'}
                      </strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Usuarios en niveles inferiores</p>
                    <p className="text-xl font-bold text-emerald-800 dark:text-emerald-400">{subordinates.length}</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                  {downwardLevels.map(lvl => {
                    const levelUsers = subordinates.filter(u => u.rol === lvl.code);
                    if (levelUsers.length === 0) return null;

                    return (
                      <div key={lvl.code} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            Nivel {lvl.nivel} — {lvl.label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {levelUsers.length} {levelUsers.length === 1 ? 'registro' : 'registros'}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {levelUsers.map(sub => {
                            const subCarrs = getUserCarreraIds(sub)
                              .map(id => carreras.find(c => c.id === id)?.codigo)
                              .filter(Boolean);
                            const relAsesorias =
                              sub.rol === 'alumno'
                                ? asesorias.filter(a => a.alumnoId === sub.uid).length
                                : asesorias.filter(a => a.docenteAsignadoId === sub.uid).length;
                            return (
                              <div key={sub.uid} className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-2.5">
                                  <UserAvatar
                                    user={sub}
                                    size="xs"
                                    className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700"
                                  />
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                                      {sub.nombre} {sub.apellidoPaterno} {sub.apellidoMaterno}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                      {sub.matricula || sub.numeroEmpleado || sub.correo}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {subCarrs.length > 0 ? (
                                      subCarrs.map(code => (
                                        <span
                                          key={code}
                                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300"
                                        >
                                          {code}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] text-slate-400">Todas</span>
                                    )}
                                  </div>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                    {relAsesorias} asesorías
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {subordinates.length === 0 && (
                    <p className="text-center py-6 text-slate-400 dark:text-slate-500">
                      No hay usuarios en niveles inferiores adscritos a estas carreras.
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTrackingUser(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Confirm Deactivate Dialog (Requirement 30) */}
      <ConfirmDialog
        isOpen={!!confirmDeactivateUser}
        onClose={() => setConfirmDeactivateUser(null)}
        onConfirm={() => confirmDeactivateUser && handleToggleActive(confirmDeactivateUser)}
        title="¿Está seguro de que desea desactivar este usuario?"
        message={`El usuario "${confirmDeactivateUser?.nombre} ${confirmDeactivateUser?.apellidoPaterno}" (${confirmDeactivateUser?.correo}) perderá el acceso temporal al sistema SIAA.`}
        confirmLabel="Sí, desactivar"
        cancelLabel="Conservar activo"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteUser}
        onClose={() => setConfirmDeleteUser(null)}
        onConfirm={handleDeleteUser}
        title="¿Eliminar usuario permanentemente?"
        message={`Se eliminará la cuenta institucional de "${confirmDeleteUser?.nombre} ${confirmDeleteUser?.apellidoPaterno}" (${confirmDeleteUser?.correo}). Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar usuario"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
};
