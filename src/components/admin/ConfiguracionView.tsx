import React, { useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useTheme } from '../../context/ThemeContext';
import { Settings, Save, RefreshCw, CheckCircle2, ShieldAlert, Sun, Moon } from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const ConfiguracionView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [duracion, setDuracion] = useState(60);
  const [horaApertura, setHoraApertura] = useState('07:00');
  const [horaCierre, setHoraCierre] = useState('21:00');
  const [anticipacionHoras, setAnticipacionHoras] = useState(24);
  const [notifCorreo, setNotifCorreo] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    SIAADataService.resetToSeedData();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif">
          Configuración General de la Plataforma SIAA
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Parámetros institucionales, reglas de negocio para agendamiento y mantenimiento del sistema.
        </p>
      </div>

      {/* Appearance / Theme Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-amber-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600" />
              )}
              Apariencia del Sistema (Tema Claro / Oscuro)
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Elige el modo visual de la interfaz. Se guarda automáticamente en este navegador.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors ${
                theme === 'light'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Modo Claro
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-950 text-amber-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-amber-400" />
              Modo Oscuro
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold rounded-lg flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ¡Configuración institucional guardada exitosamente!
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 text-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            1. Reglas de Duración y Horarios Universitarios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duración Estándar de Asesoría
              </label>
              <select
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              >
                <option value={45}>45 minutos</option>
                <option value={60}>60 minutos (Estándar)</option>
                <option value={90}>90 minutos</option>
                <option value={120}>120 minutos</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horario Institucional Inicio
              </label>
              <input
                type="time"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horario Institucional Cierre
              </label>
              <input
                type="time"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            2. Políticas de Solicitud y Notificaciones
          </h2>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anticipación Mínima para Generar Solicitud (Horas)
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={anticipacionHoras}
                onChange={(e) => setAnticipacionHoras(Number(e.target.value))}
                className="w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Tiempo requerido antes de la fecha solicitada para permitir revisión y asignación por dirección.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifCorreo}
                  onChange={(e) => setNotifCorreo(e.target.checked)}
                  className="w-4 h-4 text-emerald-800 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-emerald-700"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Emitir notificaciones al correo institucional de alumnos y docentes
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4 text-amber-400" />
            Guardar Cambios
          </button>
        </div>
      </form>

      {/* Reset Seed Data Utility */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/70 shadow-xs p-6 text-xs">
        <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          Restablecimiento de Datos de Demostración
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Si desea volver a cargar los datos institucionales iniciales (usuarios, carreras, asesorías de prueba y catálogos), puede restablecer la base de datos local en cualquier momento.
        </p>

        <button
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Restablecer Datos de Demostración Iniciales
        </button>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="¿Restablecer datos de prueba?"
        message="Esta acción repondrá todos los registros iniciales de alumnos, docentes, materias y asesorías predeterminadas."
        confirmLabel="Sí, restablecer"
        cancelLabel="Cancelar"
        variant="warning"
      />
    </div>
  );
};
