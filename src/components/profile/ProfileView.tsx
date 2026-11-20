import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SIAADataService } from '../../services/siaaService';
import {
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { getRoleMeta, getUserCarreraIds } from '../../utils/roles';
import { UserAvatar } from '../common/UserAvatar';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';

export const ProfileView: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [photoStatus, setPhotoStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  if (!currentUser) return null;

  const carreras = SIAADataService.getCarreras();
  const assignedCarreras = getUserCarreraIds(currentUser)
    .map(id => carreras.find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPhotoStatus(null);
    setUploadingPhoto(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxSize: 256,
        preserveTransparency: false,
        quality: 0.86
      });
      SIAADataService.updateUserPhoto(currentUser.uid, dataUrl, currentUser);
      refreshUser();
      setPhotoStatus({
        type: 'success',
        text: 'Fotografía de perfil actualizada y guardada en la base de datos.'
      });
    } catch (err) {
      setPhotoStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo procesar la imagen seleccionada.'
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoStatus(null);
    SIAADataService.updateUserPhoto(currentUser.uid, undefined, currentUser);
    refreshUser();
    setPhotoStatus({
      type: 'success',
      text: 'Fotografía de perfil eliminada. Se mostrarán tus iniciales.'
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe contener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    SIAADataService.resetPassword(currentUser.uid, newPassword, currentUser);
    setMessage({ type: 'success', text: 'Contraseña actualizada correctamente en la plataforma institucional.' });
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
          Perfil del Usuario Institucional
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Información personal, fotografía de perfil, datos académicos y seguridad de acceso a la cuenta.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        {photoStatus && (
          <div
            className={`mb-5 p-3 rounded-lg text-xs flex items-center gap-2 ${
              photoStatus.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-semibold'
            }`}
          >
            {photoStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{photoStatus.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar + Upload Controls */}
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div className="relative group">
              <UserAvatar
                user={currentUser}
                size="xl"
                className="bg-emerald-900 dark:bg-emerald-950 text-amber-400 border-2 border-amber-500 font-serif shadow-md"
              />
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                title="Cambiar fotografía de perfil"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 hover:bg-amber-400 text-emerald-950 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center transition-transform group-hover:scale-105 disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-60"
              >
                <Upload className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                {uploadingPhoto
                  ? 'Procesando...'
                  : currentUser.fotoURL
                  ? 'Cambiar Foto'
                  : 'Subir Foto'}
              </button>

              {currentUser.fotoURL && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {currentUser.nombre} {currentUser.apellidoPaterno} {currentUser.apellidoMaterno}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  {currentUser.correo}
                </p>
              </div>

              <span className={`self-center sm:self-start px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getRoleMeta(currentUser.rol).badgeClass}`}>
                Nivel {getRoleMeta(currentUser.rol).nivel} • {getRoleMeta(currentUser.rol).label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-transparent dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 font-semibold block text-[10px] uppercase">Identificador</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {currentUser.matricula || currentUser.numeroEmpleado || 'S/N'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-transparent dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 font-semibold block text-[10px] uppercase">Estado de la Cuenta</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 capitalize">
                  {currentUser.estado}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-transparent dark:border-slate-700/60">
                <span className="text-slate-400 dark:text-slate-400 font-semibold block text-[10px] uppercase">Adscripción Académica</span>
                <div className="mt-1 flex flex-wrap gap-1 justify-center sm:justify-start">
                  {assignedCarreras.length > 0 ? (
                    assignedCarreras.map(c => (
                      <span
                        key={c.id}
                        title={c.nombre}
                        className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-mono font-bold text-[11px]"
                      >
                        {c.codigo}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-slate-800 dark:text-slate-100">Institucional (Todas)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Role Functions */}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                Funciones y Atribuciones del Nivel Jerárquico:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600 dark:text-slate-300">
                {getRoleMeta(currentUser.rol).funciones.map((fn, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{fn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
          Seguridad y Cambio de Contraseña
        </h3>

        {message && (
          <div className={`mb-4 p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300 font-semibold'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nueva Contraseña</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs transition-colors"
          >
            Actualizar Mi Contraseña
          </button>
        </form>
      </div>
    </div>
  );
};
