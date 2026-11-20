import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  BookOpen,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types/siaa';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import { UserAvatar } from '../common/UserAvatar';
import { getRoleMeta } from '../../utils/roles';
import { useInstitutionalConfig } from '../../hooks/useInstitutionalConfig';
import { SIAADataService } from '../../services/siaaService';

export const LoginView: React.FC = () => {
  const { login, switchUser } = useAuth();
  const config = useInstitutionalConfig();
  const allUsers = SIAADataService.getUsers();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Credenciales no válidas. Ingrese un correo registrado o utilice los accesos de prueba rápida.');
    }
  };

  const demoQuickLogins: { role: UserRole; name: string; email: string; uid: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'admin', name: 'Mtro. Carlos Mendoza', email: 'admin@siaa.edu.mx', uid: 'user-admin-1', icon: Shield },
    { role: 'director', name: 'Dra. Patricia Valenzuela', email: 'directora.academica@siaa.edu.mx', uid: 'user-dir-1', icon: GraduationCap },
    { role: 'jefe_carrera', name: 'Mtra. Claudia Navarro', email: 'jefa.itids@siaa.edu.mx', uid: 'user-jefe-1', icon: GraduationCap },
    { role: 'ptc_tutor', name: 'Dr. Fernando Aguirre', email: 'fernando.aguirre@siaa.edu.mx', uid: 'user-doc-1', icon: BookOpen },
    { role: 'pa', name: 'Ing. Javier Rocha', email: 'javier.rocha@siaa.edu.mx', uid: 'user-doc-3', icon: BookOpen },
    { role: 'administrativo_docente', name: 'Lic. Daniel Quiroz', email: 'daniel.quiroz@siaa.edu.mx', uid: 'user-doc-5', icon: BookOpen },
    { role: 'alumno', name: 'Mateo Ramírez', email: 'mateo.ramirez@alumno.siaa.edu.mx', uid: 'user-alu-3', icon: UserIcon }
  ];

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] transition-colors duration-200">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggleButton variant="surface" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Institutional Crest / Emblem */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-900 border-2 border-amber-500 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform overflow-hidden p-1">
          {config.logoURL ? (
            <img
              src={config.logoURL}
              alt={config.nombreCorto}
              className="w-full h-full object-contain rounded-xl bg-white/95 p-1"
            />
          ) : (
            <GraduationCap className="w-11 h-11 text-amber-400" />
          )}
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-white font-serif">
          {config.nombreCorto}
        </h1>
        <p className="mt-1 text-sm font-semibold text-emerald-800 dark:text-emerald-400">
          {config.nombreCompleto}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {config.subtitulo}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          
          <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 text-center">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Inicio de Sesión Institucional
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              Ingrese con sus credenciales universitarias
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="usuario@siaa.edu.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold mb-2 justify-center">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Acceso Rápido por Perfil (Modo Demostración)</span>
            </div>
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Haz clic en cualquiera de las siguientes cuentas preconfiguradas:
            </p>

            <div className="space-y-1.5">
              {demoQuickLogins.map(demo => {
                const Icon = demo.icon;
                const matchedUser = allUsers.find(u => u.uid === demo.uid);
                return (
                  <button
                    key={demo.uid}
                    type="button"
                    onClick={() => switchUser(demo.uid)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {matchedUser?.fotoURL ? (
                        <UserAvatar
                          user={matchedUser}
                          size="xs"
                          className="border border-amber-500/70"
                        />
                      ) : (
                        <div className="p-1.5 rounded-md bg-emerald-900 text-amber-400 shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-950 dark:group-hover:text-emerald-300 truncate">
                          {demo.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{demo.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 shrink-0">
                      {getRoleMeta(demo.role).shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Institutional footer disclaimer */}
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-6">
          © 2026 SIAA • Todos los derechos reservados. Universidad Tecnológica e Politécnica.
        </p>
      </div>

    </div>
  );
};
