import { Asesoria, InstitutionalConfig } from '../types/siaa';

function escapeHtml(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSafeImageSrc(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  ) {
    return escapeHtml(trimmed);
  }
  return '';
}

function formatEstadoLabel(estado: string): string {
  return estado.replace(/_/g, ' ').toUpperCase();
}

export function printFichaAsesoria(asesoria: Asesoria, config: InstitutionalConfig): void {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const printDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const shortName = escapeHtml((config.nombreCorto || 'SIAA').toUpperCase());
  const fullName = escapeHtml((config.nombreCompleto || 'Sistema Integral de Asesorías Académicas').toUpperCase());
  const logoSrc = getSafeImageSrc(config.logoURL);

  const fechaHora = asesoria.fechaProgramada
    ? `${escapeHtml(asesoria.fechaProgramada)} (${escapeHtml(asesoria.horaInicio || '--')} - ${escapeHtml(asesoria.horaTermino || '--')} hrs)`
    : 'Por definir';

  const autorizacionHtml = asesoria.autorizadaPor
    ? `
      <div class="auth-banner">
        <strong>Autorización institucional:</strong> ${escapeHtml(asesoria.autorizadaPor)}
        ${asesoria.fechaAutorizacion ? ` el ${escapeHtml(asesoria.fechaAutorizacion)}` : ''}
        ${asesoria.observacionesAutorizacion ? ` — "${escapeHtml(asesoria.observacionesAutorizacion)}"` : ''}
      </div>
    `
    : '';

  const evidenciasHtml =
    asesoria.seguimiento?.evidencias && asesoria.seguimiento.evidencias.length > 0
      ? `
        <div class="field-box full-span">
          <div class="field-label">Evidencias Adjuntas (${asesoria.seguimiento.evidencias.length})</div>
          <ul class="evidence-list">
            ${asesoria.seguimiento.evidencias
              .map(
                (evi) =>
                  `<li>${escapeHtml(evi.nombre)}${evi.tamanio ? ` <span class="muted">(${escapeHtml(evi.tamanio)})</span>` : ''}</li>`
              )
              .join('')}
          </ul>
        </div>
      `
      : '';

  const seguimientoHtml = asesoria.seguimiento
    ? `
      <div class="grid-2">
        <div class="field-box">
          <div class="field-label">Temas Trabajados en Sesión</div>
          <div class="field-value">${escapeHtml(asesoria.seguimiento.temasTrabajados)}</div>
        </div>
        <div class="field-box">
          <div class="field-label">Dificultades Específicas Detectadas</div>
          <div class="field-value">${escapeHtml(asesoria.seguimiento.dificultadesDetectadas)}</div>
        </div>
        <div class="field-box">
          <div class="field-label">Actividades y Ejercicios Desarrollados</div>
          <div class="field-value">${escapeHtml(asesoria.seguimiento.actividadesRealizadas)}</div>
        </div>
        <div class="field-box">
          <div class="field-label">Recomendaciones para el Alumno</div>
          <div class="field-value">${escapeHtml(asesoria.seguimiento.recomendaciones)}</div>
        </div>
      </div>
      <div class="result-bar">
        <div>
          <span class="result-label">Resultado Obtenido</span>
          <strong class="result-value">${escapeHtml(formatEstadoLabel(asesoria.seguimiento.resultado))}</strong>
        </div>
        <div>
          <span class="result-label">¿Requiere Nueva Asesoría?</span>
          <strong class="result-value">${asesoria.seguimiento.requiereNuevaAsesoria ? 'SÍ (Programar refuerzo)' : 'NO (Superó dificultad)'}</strong>
        </div>
        <div>
          <span class="result-label">Fecha de Seguimiento</span>
          <strong class="result-value">${escapeHtml(asesoria.seguimiento.fechaSeguimiento)}</strong>
        </div>
      </div>
      ${evidenciasHtml}
    `
    : `
      <div class="empty-follow-up">
        Aún no se ha registrado el seguimiento ni los resultados pedagógicos de esta asesoría.
      </div>
    `;

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Ficha de Asesoría ${escapeHtml(asesoria.folio)}</title>
    <style>
      @page {
        size: letter portrait;
        margin: 12mm 14mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 11px;
        line-height: 1.42;
        color: #0f172a;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .header {
        background: #134e4a;
        color: #ffffff;
        padding: 14px 16px;
        border-bottom: 4px solid #ca8a04;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        border-radius: 6px 6px 0 0;
      }
      .header-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo-wrap {
        width: 48px;
        height: 48px;
        background: #ffffff;
        border-radius: 6px;
        padding: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .logo-wrap img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .header h1 {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.02em;
      }
      .header .subtitle {
        margin-top: 3px;
        font-size: 10px;
        color: #fef08a;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .print-meta {
        text-align: right;
        font-size: 9.5px;
        color: #e2e8f0;
        white-space: nowrap;
      }
      .folio-strip {
        margin-top: 12px;
        padding: 10px 14px;
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }
      .folio-badge {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        font-weight: 800;
        color: #134e4a;
      }
      .meta-pills {
        display: flex;
        gap: 16px;
        font-size: 10.5px;
      }
      .meta-pills span strong {
        color: #0f172a;
      }
      .section {
        margin-top: 12px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        overflow: hidden;
        break-inside: avoid;
      }
      .section-title {
        background: #e2e8f0;
        color: #134e4a;
        font-weight: 800;
        font-size: 10px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 6px 12px;
        border-bottom: 1px solid #cbd5e1;
      }
      .section-body {
        padding: 10px 12px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .full-span {
        grid-column: 1 / -1;
      }
      .label {
        font-size: 9.5px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .value {
        margin-top: 2px;
        font-size: 11px;
        font-weight: 600;
        color: #0f172a;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .subvalue {
        font-size: 10px;
        color: #475569;
        margin-top: 1px;
      }
      .detail-block {
        margin-top: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        padding: 8px 10px;
      }
      .detail-item + .detail-item {
        margin-top: 6px;
      }
      .field-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 5px;
        padding: 8px 10px;
      }
      .field-label {
        font-weight: 700;
        font-size: 10px;
        color: #334155;
        margin-bottom: 3px;
      }
      .field-value {
        color: #1e293b;
        white-space: pre-wrap;
      }
      .auth-banner {
        margin-top: 8px;
        padding: 6px 10px;
        border-radius: 5px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        font-size: 10px;
      }
      .result-bar {
        margin-top: 8px;
        padding: 8px 12px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 5px;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }
      .result-label {
        display: block;
        font-size: 9px;
        color: #047857;
        font-weight: 700;
        text-transform: uppercase;
      }
      .result-value {
        font-size: 10.5px;
        color: #064e3b;
      }
      .evidence-list {
        margin: 4px 0 0;
        padding-left: 16px;
      }
      .muted {
        color: #64748b;
      }
      .empty-follow-up {
        text-align: center;
        padding: 14px;
        color: #64748b;
        background: #f8fafc;
        border-radius: 5px;
        font-style: italic;
      }
      .signatures {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 44px;
        padding: 0 18px;
        break-inside: avoid;
      }
      .sig-box {
        text-align: center;
      }
      .sig-line {
        border-top: 1px solid #64748b;
        margin-bottom: 5px;
        padding-top: 4px;
      }
      .sig-title {
        font-weight: 800;
        font-size: 9.5px;
        color: #334155;
        letter-spacing: 0.03em;
      }
      .sig-name {
        font-size: 9.5px;
        color: #475569;
        margin-top: 2px;
      }
      .doc-footer {
        margin-top: 18px;
        padding-top: 8px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="header-brand">
        ${logoSrc ? `<div class="logo-wrap"><img src="${logoSrc}" alt="Logotipo institucional" /></div>` : ''}
        <div>
          <h1>${shortName} — ${fullName}</h1>
          <div class="subtitle">FICHA OFICIAL DE ASESORÍA ACADÉMICA Y SEGUIMIENTO PEDAGÓGICO</div>
        </div>
      </div>
      <div class="print-meta">
        <div>Impresión: ${escapeHtml(printDate)}</div>
        <div>Solicitud: ${escapeHtml(asesoria.fechaSolicitud || 'N/A')}</div>
      </div>
    </header>

    <div class="folio-strip">
      <div class="folio-badge">FOLIO: ${escapeHtml(asesoria.folio)}</div>
      <div class="meta-pills">
        <span>Estado: <strong>${escapeHtml(formatEstadoLabel(asesoria.estado))}</strong></span>
        <span>Prioridad: <strong>${escapeHtml((asesoria.prioridad || 'media').toUpperCase())}</strong></span>
      </div>
    </div>

    <section class="section">
      <div class="section-title">1. Datos del Alumno y Programa Académico</div>
      <div class="section-body">
        <div class="grid-3">
          <div>
            <div class="label">Nombre Completo</div>
            <div class="value">${escapeHtml(asesoria.alumnoNombre)}</div>
          </div>
          <div>
            <div class="label">Matrícula Oficial</div>
            <div class="value mono">${escapeHtml(asesoria.matricula)}</div>
          </div>
          <div>
            <div class="label">Grupo y Cuatrimestre</div>
            <div class="value">${escapeHtml(asesoria.grupoNombre)} • ${escapeHtml(asesoria.cuatrimestreNumero)}° Cuatrimestre</div>
          </div>
          <div>
            <div class="label">Sede / Unidad Académica</div>
            <div class="value">${escapeHtml(asesoria.sedeNombre || 'Universidad Tecnológica de Parral')}</div>
          </div>
          <div>
            <div class="label">División Académica</div>
            <div class="value">${escapeHtml(asesoria.divisionNombre || 'Sin división asignada')}</div>
          </div>
          <div>
            <div class="label">Carrera / Programa</div>
            <div class="value">${escapeHtml(asesoria.carreraNombre)}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-title">2. Información de la Asesoría y Programación</div>
      <div class="section-body">
        <div class="grid-2">
          <div>
            <div class="label">Materia / Asignatura</div>
            <div class="value">${escapeHtml(asesoria.materiaNombre)}</div>
            <div class="subvalue mono">${escapeHtml(asesoria.materiaCodigo)}</div>
          </div>
          <div>
            <div class="label">Docente Asesor Asignado</div>
            <div class="value">${escapeHtml(asesoria.docenteAsignadoNombre || 'Sin asignar')}</div>
            <div class="subvalue">Catedrático Especialista</div>
          </div>
          <div>
            <div class="label">Fecha y Horario</div>
            <div class="value">${fechaHora}</div>
          </div>
          <div>
            <div class="label">Sede, Aula y Modalidad</div>
            <div class="value">${escapeHtml(asesoria.aulaNombre || 'Por definir')}</div>
            <div class="subvalue">${escapeHtml(asesoria.sedeNombre || 'Universidad Tecnológica de Parral')} · ${escapeHtml((asesoria.modalidad || 'presencial').toUpperCase())}</div>
          </div>
        </div>

        <div class="detail-block">
          <div class="detail-item">
            <strong>Motivo de la solicitud:</strong> ${escapeHtml(asesoria.motivo)}
          </div>
          <div class="detail-item">
            <strong>Temas específicos con dificultad:</strong> ${escapeHtml(asesoria.temasDificultad)}
          </div>
          ${
            asesoria.observaciones
              ? `<div class="detail-item"><strong>Observaciones generales:</strong> ${escapeHtml(asesoria.observaciones)}</div>`
              : ''
          }
        </div>
        ${autorizacionHtml}
      </div>
    </section>

    <section class="section">
      <div class="section-title">3. Seguimiento Pedagógico y Resultados</div>
      <div class="section-body">
        ${seguimientoHtml}
      </div>
    </section>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">FIRMA DEL DOCENTE ASESOR</div>
        <div class="sig-name">${escapeHtml(asesoria.docenteAsignadoNombre || 'Nombre y Firma')}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-title">FIRMA DEL ALUMNO ASESORADO</div>
        <div class="sig-name">${escapeHtml(asesoria.alumnoNombre)}</div>
      </div>
    </div>

    <footer class="doc-footer">
      <span>${shortName} • Coordinación de Calidad Académica</span>
      <span>Documento oficial de respaldo • Folio ${escapeHtml(asesoria.folio)}</span>
    </footer>
  </body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }

    const triggerPrint = () => {
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      // Fallback cleanup in case afterprint does not fire in embedded contexts
      setTimeout(cleanup, 60000);
    };

    const images = Array.from(win.document.images || []);
    if (images.length === 0) {
      triggerPrint();
      return;
    }

    Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            })
      )
    ).then(triggerPrint);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}
