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
  Trash2
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const UsuariosView: React.FC = () => {
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SIAAUser | null>(null);
  const [confirmDeactivateUser, setConfirmDeactivateUser] = useState<SIAAUser | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<SIAAUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<SIAAUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);
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
  const [grupoId, setGrupoId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  void refreshTick;
  const users = SIAADataService.getUsers();
  const carreras = SIAADataService.getCarreras();
  const grupos = SIAADataService.getGrupos();

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
    setCarreraId(carreras[0]?.id || '');
    setGrupoId(grupos[0]?.id || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (u: SIAAUser) => {
    setEditingUser(u);
    setNombre(u.nombre);
    setApellidoPaterno(u.apellidoPaterno);
    setApellidoMaterno(u.apellidoMaterno);
    setCorreo(u.correo);
    setRol(u.rol);
    setMatricula(u.matricula || '');
    setNumeroEmpleado(u.numeroEmpleado || '');
    setCarreraId(u.carreraId || '');
    setGrupoId(u.grupoId || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!nombre.trim() || !apellidoPaterno.trim() || !correo.trim()) {
      setFormError('Nombre, apellido paterno y correo electrónico son obligatorios.');
      return;
    }

    if (!currentUser) return;

    if (editingUser) {
      SIAADataService.updateUser(editingUser.uid, {
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim(),
        rol,
        matricula: rol === 'alumno' ? matricula.trim() : undefined,
        numeroEmpleado: (rol === 'docente' || rol === 'director' || rol === 'admin') ? numeroEmpleado.trim() : undefined,
        carreraId: rol === 'alumno' ? carreraId : undefined,
        grupoId: rol === 'alumno' ? grupoId : undefined
      }, currentUser);
    } else {
      SIAADataService.createUser({
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim(),
        rol,
        matricula: rol === 'alumno' ? matricula.trim() : undefined,
        numeroEmpleado: (rol === 'docente' || rol === 'director' || rol === 'admin') ? numeroEmpleado.trim() : undefined,
        carreraId: rol === 'alumno' ? carreraId : undefined,
        grupoId: rol === 'alumno' ? grupoId : undefined,
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
            Administración de cuentas para Alumnos, Docentes, Directivos y Administradores.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          Registrar Nuevo Usuario
        </button>
      </div>

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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Todos los Roles</option>
            <option value="admin">Administrador</option>
            <option value="director">Directivo</option>
            <option value="docente">Docente</option>
            <option value="alumno">Alumno</option>
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
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {u.nombre.charAt(0)}{u.apellidoPaterno.charAt(0)}
                      </div>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                      u.rol === 'admin' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                      u.rol === 'director' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                      u.rol === 'docente' ? 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-800' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {u.rol === 'admin' && <Shield className="w-3 h-3" />}
                      {u.rol === 'director' && <GraduationCap className="w-3 h-3" />}
                      {u.rol === 'docente' && <BookOpen className="w-3 h-3" />}
                      {u.rol === 'alumno' && <UserIcon className="w-3 h-3" />}
                      <span className="capitalize">{u.rol}</span>
                    </span>
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
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Rol Institucional *</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value="alumno">Alumno</option>
                <option value="docente">Docente Asesor</option>
                <option value="director">Directivo Académico</option>
                <option value="admin">Administrador General</option>
              </select>
            </div>
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
                  onChange={(e) => setCarreraId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {carreras.map(c => (
                    <option key={c.id} value={c.id}>{c.codigo}</option>
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
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Número de Empleado / Clave de Catedrático</label>
              <input
                type="text"
                value={numeroEmpleado}
                onChange={(e) => setNumeroEmpleado(e.target.value)}
                placeholder="Ej: EMP-0042"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
              />
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
