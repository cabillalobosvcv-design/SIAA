import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SIAADataService } from '../../services/siaaService';
import {
  UserCircle,
  Mail,
  Shield,
  GraduationCap,
  BookOpen,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

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
    setCurrentPassword('');
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
          Información personal, datos académicos y seguridad de acceso a la cuenta.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-900 dark:bg-emerald-950 text-amber-400 border-2 border-amber-500 font-serif text-2xl font-bold flex items-center justify-center shadow-md shrink-0">
            {currentUser.nombre.charAt(0)}{currentUser.apellidoPaterno.charAt(0)}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
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

              <span className="self-center sm:self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Rol: {currentUser.rol}
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
                <span className="text-slate-400 dark:text-slate-400 font-semibold block text-[10px] uppercase">Periodo Activo</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  Ciclo 2026-3
                </p>
              </div>
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
