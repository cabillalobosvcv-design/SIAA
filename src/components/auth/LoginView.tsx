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

export const LoginView: React.FC = () => {
  const { login, switchUser } = useAuth();
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
    { role: 'docente', name: 'Dr. Fernando Aguirre', email: 'fernando.aguirre@siaa.edu.mx', uid: 'user-doc-1', icon: BookOpen },
    { role: 'alumno', name: 'Mateo Ramírez (Alumno)', email: 'mateo.ramirez@alumno.siaa.edu.mx', uid: 'user-alu-3', icon: UserIcon }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Institutional Crest / Emblem */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-900 border-2 border-amber-500 shadow-xl flex items-center justify-center transform hover:scale-105 transition-transform">
          <GraduationCap className="w-10 h-10 text-amber-400" />
        </div>

        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-950 font-serif">
          SIAA
        </h1>
        <p className="mt-1 text-sm font-semibold text-emerald-800">
          Sistema Integral de Asesorías Académicas
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Plataforma Institucional de Tutoría, Acompañamiento y Rezago Pedagógico
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200 text-xs">
          
          <div className="mb-6 pb-4 border-b border-slate-100 text-center">
            <h2 className="text-base font-bold text-slate-800">
              Inicio de Sesión Institucional
            </h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Ingrese con sus credenciales universitarias
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Correo Electrónico Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="usuario@siaa.edu.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-2 justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Acceso Rápido por Perfil (Modo Demostración)</span>
            </div>
            <p className="text-center text-[11px] text-slate-500 mb-3">
              Haz clic en cualquiera de las siguientes cuentas preconfiguradas:
            </p>

            <div className="space-y-1.5">
              {demoQuickLogins.map(demo => {
                const Icon = demo.icon;
                return (
                  <button
                    key={demo.uid}
                    type="button"
                    onClick={() => switchUser(demo.uid)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/70 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1.5 rounded-md bg-emerald-900 text-amber-400 shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 group-hover:text-emerald-950 truncate">
                          {demo.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{demo.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-emerald-900 border border-slate-200 group-hover:border-emerald-300 uppercase shrink-0">
                      {demo.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Institutional footer disclaimer */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          © 2026 SIAA • Todos los derechos reservados. Universidad Tecnológica e Politécnica.
        </p>
      </div>

    </div>
  );
};
