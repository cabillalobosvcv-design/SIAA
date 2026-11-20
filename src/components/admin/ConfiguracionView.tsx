import React, { useRef, useState } from 'react';
import { SIAADataService } from '../../services/siaaService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useInstitutionalConfig } from '../../hooks/useInstitutionalConfig';
import {
  Settings,
  Save,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Sun,
  Moon,
  Image as ImageIcon,
  Upload,
  Trash2,
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { fileToCompressedDataUrl } from '../../utils/imageUtils';

export const ConfiguracionView: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();
  const config = useInstitutionalConfig();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [nombreCorto, setNombreCorto] = useState(config.nombreCorto);
  const [nombreCompleto, setNombreCompleto] = useState(config.nombreCompleto);
  const [subtitulo, setSubtitulo] = useState(config.subtitulo);
  const [duracion, setDuracion] = useState(config.duracionAsesoria);
  const [horaApertura, setHoraApertura] = useState(config.horaApertura);
  const [horaCierre, setHoraCierre] = useState(config.horaCierre);
  const [anticipacionHoras, setAnticipacionHoras] = useState(config.anticipacionHoras);
  const [notifCorreo, setNotifCorreo] = useState(config.notifCorreo);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    setUploadingLogo(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxSize: 360,
        preserveTransparency: true,
        quality: 0.92
      });
      SIAADataService.updateInstitutionalConfig(
        { logoURL: dataUrl },
        currentUser || undefined
      );
      setFeedback({
        type: 'success',
        text: 'Logotipo institucional actualizado y guardado en la base de datos.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'No se pudo procesar la imagen del logotipo.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleResetLogo = () => {
    setFeedback(null);
    SIAADataService.updateInstitutionalConfig(
      { logoURL: undefined },
      currentUser || undefined
    );
    setFeedback({
      type: 'success',
      text: 'Logotipo institucional restablecido al emblema predeterminado.'
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    SIAADataService.updateInstitutionalConfig(
      {
        nombreCorto: nombreCorto.trim() || 'SIAA',
        nombreCompleto: nombreCompleto.trim() || 'Sistema Integral de Asesorías Académicas',
        subtitulo: subtitulo.trim() || 'Plataforma Institucional de Tutoría, Acompañamiento y Rezago Pedagógico',
        duracionAsesoria: duracion,
        horaApertura,
        horaCierre,
        anticipacionHoras,
        notifCorreo
      },
      currentUser || undefined
    );
    setFeedback({
      type: 'success',
      text: '¡Configuración institucional e identidad visual guardadas en la base de datos!'
    });
    setTimeout(() => setFeedback(null), 3500);
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
          Logotipo institucional, parámetros académicos, reglas de agendamiento y mantenimiento del sistema.
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

      {feedback && (
        <div
          className={`p-3.5 rounded-lg flex items-center gap-2 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 text-xs">
        {/* Section 1: Institutional Logo & Identity */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            1. Logotipo e Identidad Institucional
          </h2>

          <div className="mt-4 flex flex-col sm:flex-row items-start gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-24 h-24 rounded-xl bg-emerald-900 border-2 border-amber-500 flex items-center justify-center overflow-hidden shadow-md p-1.5">
                {config.logoURL ? (
                  <img
                    src={config.logoURL}
                    alt="Logotipo Institucional"
                    className="w-full h-full object-contain rounded-lg bg-white/95 p-1"
                  />
                ) : (
                  <GraduationCap className="w-12 h-12 text-amber-400" />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {config.logoURL ? 'Logotipo personalizado' : 'Emblema predeterminado'}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Imagen del Logotipo Institucional
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Se mostrará automáticamente en la barra superior, pantalla de inicio de sesión y encabezados de reportes y fichas PDF. Formatos admitidos: PNG (con fondo transparente), JPG, WEBP o SVG.
                </p>
              </div>

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold shadow-xs transition-colors disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  {uploadingLogo
                    ? 'Cargando logotipo...'
                    : config.logoURL
                    ? 'Cambiar Logotipo'
                    : 'Subir Logotipo'}
                </button>

                {config.logoURL && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Restablecer Predeterminado
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Siglas / Nombre Corto
              </label>
              <input
                type="text"
                value={nombreCorto}
                onChange={(e) => setNombreCorto(e.target.value)}
                placeholder="SIAA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo de la Plataforma / Institución
              </label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Sistema Integral de Asesorías Académicas"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subtítulo de Portada / Acceso
              </label>
              <input
                type="text"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Plataforma Institucional de Tutoría, Acompañamiento y Rezago Pedagógico"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Scheduling Rules */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            2. Reglas de Duración y Horarios Universitarios
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

        {/* Section 3: Request Policies */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            3. Políticas de Solicitud y Notificaciones
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
            Guardar Cambios en Base de Datos
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
          Si desea volver a cargar los datos institucionales iniciales (usuarios, carreras, logotipo, asesorías de prueba y catálogos), puede restablecer la base de datos local en cualquier momento.
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
        message="Esta acción repondrá todos los registros iniciales de alumnos, docentes, materias, logotipo y asesorías predeterminadas."
        confirmLabel="Sí, restablecer"
        cancelLabel="Cancelar"
        variant="warning"
      />
    </div>
  );
};
