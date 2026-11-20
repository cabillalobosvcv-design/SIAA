import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Asesoria, ResultadoAsesoria, Evidencia } from '../../types/siaa';
import { SIAADataService } from '../../services/siaaService';
import { useAuth } from '../../context/AuthContext';
import {
  CheckCircle2,
  Paperclip,
  Trash2,
  UploadCloud,
  FileText,
  AlertCircle
} from 'lucide-react';

interface SeguimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  asesoria: Asesoria | null;
  onSuccess: () => void;
}

export const SeguimientoModal: React.FC<SeguimientoModalProps> = ({
  isOpen,
  onClose,
  asesoria,
  onSuccess
}) => {
  const { currentUser } = useAuth();

  const [temasTrabajados, setTemasTrabajados] = useState('');
  const [dificultadesDetectadas, setDificultadesDetectadas] = useState('');
  const [actividadesRealizadas, setActividadesRealizadas] = useState('');
  const [resultado, setResultado] = useState<ResultadoAsesoria>('satisfactorio');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [requiereNuevaAsesoria, setRequiereNuevaAsesoria] = useState(false);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (asesoria) {
      if (asesoria.seguimiento) {
        setTemasTrabajados(asesoria.seguimiento.temasTrabajados || '');
        setDificultadesDetectadas(asesoria.seguimiento.dificultadesDetectadas || '');
        setActividadesRealizadas(asesoria.seguimiento.actividadesRealizadas || '');
        setResultado(asesoria.seguimiento.resultado || 'satisfactorio');
        setRecomendaciones(asesoria.seguimiento.recomendaciones || '');
        setObservaciones(asesoria.seguimiento.observaciones || '');
        setRequiereNuevaAsesoria(asesoria.seguimiento.requiereNuevaAsesoria || false);
        setEvidencias(asesoria.seguimiento.evidencias || []);
      } else {
        // Pre-fill with request themes
        setTemasTrabajados(asesoria.temasDificultad || '');
        setDificultadesDetectadas('');
        setActividadesRealizadas('Resolución guiada de ejercicios prácticos y explicación conceptual.');
        setResultado('satisfactorio');
        setRecomendaciones('Continuar con el repaso de ejercicios del compendio.');
        setObservaciones('');
        setRequiereNuevaAsesoria(false);
        setEvidencias([]);
      }
      setErrorMsg(null);
    }
  }, [asesoria, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newEvidencias: Evidencia[] = Array.from(files).map((file, idx) => ({
      id: `evi-${Date.now()}-${idx}`,
      nombre: file.name,
      url: URL.createObjectURL(file),
      tipo: file.type || 'documento',
      fecha: new Date().toISOString().split('T')[0],
      tamanio: `${(file.size / 1024).toFixed(1)} KB`
    }));

    setEvidencias(prev => [...prev, ...newEvidencias]);
  };

  const handleRemoveEvidencia = (id: string) => {
    setEvidencias(prev => prev.filter(e => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!asesoria || !currentUser) return;

    if (!temasTrabajados.trim()) {
      setErrorMsg('Debe registrar los temas trabajados durante la sesión.');
      return;
    }

    if (!actividadesRealizadas.trim()) {
      setErrorMsg('Debe describir las actividades y ejercicios realizados.');
      return;
    }

    if (!recomendaciones.trim()) {
      setErrorMsg('Debe incluir recomendaciones pedagógicas para el alumno.');
      return;
    }

    SIAADataService.registrarSeguimiento({
      asesoriaId: asesoria.id,
      temasTrabajados: temasTrabajados.trim(),
      dificultadesDetectadas: dificultadesDetectadas.trim(),
      actividadesRealizadas: actividadesRealizadas.trim(),
      resultado,
      recomendaciones: recomendaciones.trim(),
      observaciones: observaciones.trim(),
      requiereNuevaAsesoria,
      evidencias,
      actor: currentUser
    });

    onSuccess();
    onClose();
  };

  if (!asesoria) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registro de Seguimiento y Resultados — ${asesoria.folio}`}
      subtitle={`Alumno: ${asesoria.alumnoNombre} (${asesoria.matricula}) | Materia: ${asesoria.materiaNombre}`}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Temas trabajados */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Temas Trabajados durante la Sesión <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={temasTrabajados}
            onChange={(e) => setTemasTrabajados(e.target.value)}
            placeholder="Describa los contenidos curriculares y problemas puntuales abordados..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Dificultades detectadas */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Dificultades Específicas Detectadas en el Estudiante
          </label>
          <textarea
            rows={2}
            value={dificultadesDetectadas}
            onChange={(e) => setDificultadesDetectadas(e.target.value)}
            placeholder="Ejemplo: Confusión en la aplicación de signos al factorizar o falta de fundamentos algebraicos previos."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Actividades realizadas */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Actividades y Ejercicios Prácticos Realizados <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={actividadesRealizadas}
            onChange={(e) => setActividadesRealizadas(e.target.value)}
            placeholder="Ejemplo: Resolución de 5 problemas tipo examen, modelado gráfico y cuestionario diagnóstico."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Resultado & Requiere nueva asesoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Evaluación del Resultado Obtenido <span className="text-red-500">*</span>
            </label>
            <select
              value={resultado}
              onChange={(e) => setResultado(e.target.value as ResultadoAsesoria)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-700 font-semibold"
            >
              <option value="satisfactorio">Satisfactorio (Comprensión completa)</option>
              <option value="parcialmente_satisfactorio">Parcialmente Satisfactorio (Requiere práctica)</option>
              <option value="no_satisfactorio">No Satisfactorio (Persisten dudas básicas)</option>
              <option value="requiere_reforzamiento">Requiere Reforzamiento Integral</option>
            </select>
          </div>

          <div className="flex flex-col justify-center">
            <span className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              ¿Se sugiere programar una nueva sesión de seguimiento?
            </span>
            <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={requiereNuevaAsesoria}
                onChange={(e) => setRequiereNuevaAsesoria(e.target.checked)}
                className="w-4 h-4 text-emerald-800 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-700"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Sí, programar sesión de refuerzo
              </span>
            </label>
          </div>
        </div>

        {/* Recomendaciones */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Recomendaciones Pedagógicas para el Estudiante <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={2}
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
            placeholder="Recomendaciones para su estudio autónomo, bibliografía o ejercicios complementarios..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Adjuntar Evidencias (Requirement 20) */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <Paperclip className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            Evidencias y Documentos Adjuntos (Listas de asistencia, fotografías, ejercicios resueltos)
          </label>
          
          <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-colors text-center cursor-pointer relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
            <UploadCloud className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto mb-1" />
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Arrastra archivos aquí o haz <span className="text-emerald-800 dark:text-emerald-400 font-bold">clic para examinar</span>
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Formatos permitidos: PDF, JPG, PNG, DOCX</p>
          </div>

          {evidencias.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {evidencias.map(evi => (
                <div key={evi.id} className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{evi.nombre}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">({evi.tamanio})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidencia(evi.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Eliminar evidencia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Guardar Seguimiento y Cerrar Asesoría
          </button>
        </div>
      </form>
    </Modal>
  );
};
