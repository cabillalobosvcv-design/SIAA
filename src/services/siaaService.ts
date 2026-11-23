import {
  User,
  Carrera,
  Cuatrimestre,
  Grupo,
  Materia,
  Aula,
  TipoEspacio,
  DisponibilidadRecurrente,
  DisponibilidadEspecifica,
  Asesoria,
  EstadoAsesoria,
  Notification,
  AuditLog,
  FilterParams,
  UserRole,
  InstitutionalConfig,
  PeriodoOficial
} from '../types/siaa';
import {
  INITIAL_USERS,
  INITIAL_CARRERAS,
  INITIAL_CUATRIMESTRES,
  INITIAL_GRUPOS,
  INITIAL_MATERIAS,
  INITIAL_AULAS,
  INITIAL_TIPOS_ESPACIO,
  INITIAL_DISPONIBILIDADES_RECURRENTES,
  INITIAL_DISPONIBILIDADES_ESPECIFICAS,
  INITIAL_ASESORIAS,
  INITIAL_NOTIFICACIONES,
  INITIAL_AUDIT_LOGS
} from './seedData';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { normalizeUserRole, getUserCarreraIds, userHasCarrera } from '../utils/roles';

const STORAGE_KEYS = {
  USERS: 'siaa_users',
  CARRERAS: 'siaa_carreras',
  CUATRIMESTRES: 'siaa_cuatrimestres',
  GRUPOS: 'siaa_grupos',
  MATERIAS: 'siaa_materias',
  AULAS: 'siaa_aulas',
  TIPOS_ESPACIO: 'siaa_tipos_espacio',
  DISP_REC: 'siaa_disp_recurrentes',
  DISP_ESP: 'siaa_disp_especificas',
  ASESORIAS: 'siaa_asesorias',
  NOTIFICATIONS: 'siaa_notifications',
  AUDIT: 'siaa_audit_logs',
  CONFIG: 'siaa_institutional_config'
};

export const DEFAULT_INSTITUTIONAL_CONFIG: InstitutionalConfig = {
  nombreCorto: 'SIAA',
  nombreCompleto: 'Sistema Integral de Asesorías Académicas',
  subtitulo: 'Plataforma Institucional de Tutoría, Acompañamiento y Rezago Pedagógico',
  logoURL: undefined,
  duracionAsesoria: 60,
  horaApertura: '07:00',
  horaCierre: '21:00',
  anticipacionHoras: 24,
  notifCorreo: true
};

export const OFFICIAL_PERIODS: { value: PeriodoOficial; label: string }[] = [
  { value: 'Sep-Dic', label: 'Sep-Dic (Septiembre - Diciembre)' },
  { value: 'Ene-Abr', label: 'Ene-Abr (Enero - Abril)' },
  { value: 'May-Ago', label: 'May-Ago (Mayo - Agosto)' }
];

export function normalizePeriodoAndAnio(
  rawPeriodo?: string,
  rawAnio?: number | string
): { periodo: PeriodoOficial; anio: number } {
  const clean = (rawPeriodo || '').toLowerCase().replace(/\s+/g, '');
  let periodo: PeriodoOficial = 'Sep-Dic';
  if (clean.includes('ene') || clean.includes('abr')) {
    periodo = 'Ene-Abr';
  } else if (clean.includes('may') || clean.includes('ago')) {
    periodo = 'May-Ago';
  } else if (clean.includes('sep') || clean.includes('dic')) {
    periodo = 'Sep-Dic';
  }

  let anio = Number(rawAnio);
  if (!anio || isNaN(anio) || anio < 1990 || anio > 2100) {
    const yearMatch = (rawPeriodo || '').match(/(19\d{2}|20\d{2}|2100)/);
    anio = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  }

  return { periodo, anio };
}

const LEGACY_SPACE_TYPE_MAP: Record<string, string> = {
  aula: 'Aula Teórica',
  'aula teorica': 'Aula Teórica',
  'aula teórica': 'Aula Teórica',
  sala_computo: 'Sala de Cómputo',
  'sala de computo': 'Sala de Cómputo',
  'sala de cómputo': 'Sala de Cómputo',
  laboratorio: 'Laboratorio',
  taller: 'Taller',
  cubiculo: 'Cubículo de Asesorías',
  'cubículo': 'Cubículo de Asesorías',
  'cubiculo de asesorias': 'Cubículo de Asesorías',
  'cubículo de asesorías': 'Cubículo de Asesorías',
  virtual: 'Sala Audiovisual / Virtual',
  audiovisual: 'Sala Audiovisual / Virtual'
};

export function normalizeTipoEspacioNombre(raw?: string, configuredTipos?: TipoEspacio[]): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Aula Teórica';
  const lower = trimmed.toLowerCase();
  if (configuredTipos && configuredTipos.length > 0) {
    const exactMatch = configuredTipos.find(t => t.nombre.trim().toLowerCase() === lower);
    if (exactMatch) return exactMatch.nombre;
  }
  const legacyTarget = LEGACY_SPACE_TYPE_MAP[lower];
  if (legacyTarget) {
    if (configuredTipos && configuredTipos.length > 0) {
      const configuredLegacy = configuredTipos.find(
        t => t.nombre.trim().toLowerCase() === legacyTarget.toLowerCase()
      );
      if (configuredLegacy) return configuredLegacy.nombre;
    }
    return legacyTarget;
  }
  return trimmed;
}

type SIAADataEventName =
  | 'siaa-config-updated'
  | 'siaa-users-updated'
  | 'siaa-notifications-updated'
  | 'siaa-asesorias-updated';

const realtimeChannel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('siaa-realtime-sync') : null;

function emitDataEvent(eventName: SIAADataEventName): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName));
  }
  try {
    realtimeChannel?.postMessage({ type: eventName, ts: Date.now() });
  } catch {
    // Ignore channel errors if closed
  }
}

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error('Error reading localStorage', e);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Error writing localStorage', e);
  }
}

export class SIAADataService {
  // Read collections
  static getUsers(): User[] {
    const normalizeUser = (u: User): User => {
      const merged = getUserCarreraIds(u);
      return {
        ...u,
        rol: normalizeUserRole(u.rol as string),
        carreraId: merged[0] || undefined,
        carrerasIds: merged
      };
    };

    let users = getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    const migratedFlag = localStorage.getItem('siaa_roles_v2_migrated');
    if (!migratedFlag) {
      const upgraded: User[] = users.map(u => {
        if (u.uid === 'user-dir-2') return { ...u, rol: 'jefe_carrera', correo: 'jefe.industrial@siaa.edu.mx' };
        if (u.uid === 'user-doc-3' || u.uid === 'user-doc-4') return { ...u, rol: 'pa' };
        if (u.uid === 'user-doc-5') return { ...u, rol: 'administrativo_docente' };
        return { ...u, rol: normalizeUserRole(u.rol as string) };
      });
      const jefeSeed = INITIAL_USERS.find(s => s.uid === 'user-jefe-1');
      if (jefeSeed && !upgraded.some(u => u.uid === jefeSeed.uid)) {
        upgraded.splice(2, 0, jefeSeed);
      }
      users = upgraded;
      localStorage.setItem('siaa_roles_v2_migrated', '1');
    }

    const multiCareerFlag = localStorage.getItem('siaa_multicarrera_v1');
    if (!multiCareerFlag) {
      users = users.map(u => {
        if ((u.uid === 'user-doc-1' || u.uid === 'user-doc-5') && (!u.carrerasIds || u.carrerasIds.length <= 1)) {
          return { ...u, carreraId: 'carr-1', carrerasIds: ['carr-1', 'carr-2'] };
        }
        return normalizeUser(u);
      });
      setStored(STORAGE_KEYS.USERS, users);
      localStorage.setItem('siaa_multicarrera_v1', '1');
      return users;
    }

    return users.map(normalizeUser);
  }

  static getCarreras(): Carrera[] {
    return getStored<Carrera[]>(STORAGE_KEYS.CARRERAS, INITIAL_CARRERAS);
  }

  static getCuatrimestres(): Cuatrimestre[] {
    const raw = getStored<Cuatrimestre[]>(STORAGE_KEYS.CUATRIMESTRES, INITIAL_CUATRIMESTRES);
    return raw.map((cu, index) => {
      const defaultPeriod = OFFICIAL_PERIODS[index % OFFICIAL_PERIODS.length].value;
      const normalized = normalizePeriodoAndAnio(cu.periodo || defaultPeriod, cu.anio);
      return {
        ...cu,
        nombre: cu.nombre || `${cu.numero}° Cuatrimestre`,
        periodo: normalized.periodo,
        anio: normalized.anio
      };
    });
  }

  static getGrupos(): Grupo[] {
    return getStored<Grupo[]>(STORAGE_KEYS.GRUPOS, INITIAL_GRUPOS);
  }

  static getMaterias(): Materia[] {
    return getStored<Materia[]>(STORAGE_KEYS.MATERIAS, INITIAL_MATERIAS);
  }

  static getTiposEspacio(): TipoEspacio[] {
    return getStored<TipoEspacio[]>(STORAGE_KEYS.TIPOS_ESPACIO, INITIAL_TIPOS_ESPACIO);
  }

  static getAulas(): Aula[] {
    const tipos = this.getTiposEspacio();
    return getStored<Aula[]>(STORAGE_KEYS.AULAS, INITIAL_AULAS).map(aula => ({
      ...aula,
      tipo: normalizeTipoEspacioNombre(aula.tipo, tipos)
    }));
  }

  static getDisponibilidadesRecurrentes(docenteId?: string): DisponibilidadRecurrente[] {
    const all = getStored<DisponibilidadRecurrente[]>(STORAGE_KEYS.DISP_REC, INITIAL_DISPONIBILIDADES_RECURRENTES);
    return docenteId ? all.filter(d => d.docenteId === docenteId) : all;
  }

  static getDisponibilidadesEspecificas(docenteId?: string): DisponibilidadEspecifica[] {
    const all = getStored<DisponibilidadEspecifica[]>(STORAGE_KEYS.DISP_ESP, INITIAL_DISPONIBILIDADES_ESPECIFICAS);
    return docenteId ? all.filter(d => d.docenteId === docenteId) : all;
  }

  static getAsesorias(): Asesoria[] {
    return getStored<Asesoria[]>(STORAGE_KEYS.ASESORIAS, INITIAL_ASESORIAS);
  }

  static getAsesoriaById(id: string): Asesoria | undefined {
    return this.getAsesorias().find(a => a.id === id);
  }

  static getNotifications(userId?: string): Notification[] {
    const all = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICACIONES);
    return userId ? all.filter(n => n.userId === userId) : all;
  }

  static getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  }

  static getInstitutionalConfig(): InstitutionalConfig {
    const stored = getStored<InstitutionalConfig>(STORAGE_KEYS.CONFIG, DEFAULT_INSTITUTIONAL_CONFIG);
    return {
      ...DEFAULT_INSTITUTIONAL_CONFIG,
      ...stored
    };
  }

  static updateInstitutionalConfig(
    updates: Partial<InstitutionalConfig>,
    actor?: User
  ): InstitutionalConfig {
    const current = this.getInstitutionalConfig();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const updated: InstitutionalConfig = {
      ...current,
      ...updates,
      fechaActualizacion: today
    };

    setStored(STORAGE_KEYS.CONFIG, updated);
    emitDataEvent('siaa-config-updated');

    if (actor) {
      const logoChanged = 'logoURL' in updates && updates.logoURL !== current.logoURL;
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: logoChanged ? 'LOGOTIPO_INSTITUCIONAL_ACTUALIZADO' : 'CONFIGURACION_ACTUALIZADA',
        modulo: 'Configuración',
        documentoAfectado: updated.nombreCorto || 'SIAA',
        detalles: logoChanged
          ? updated.logoURL
            ? 'Se actualizó el logotipo institucional en la base de datos.'
            : 'Se restableció el logotipo institucional predeterminado.'
          : `Parámetros institucionales actualizados (${updated.nombreCorto}).`
      });
    }

    return updated;
  }

  // Audit Log recording
  static logAudit(params: {
    usuarioId: string;
    usuarioNombre: string;
    rol: UserRole;
    accion: string;
    modulo: string;
    documentoAfectado: string;
    detalles?: string;
    ip?: string;
  }) {
    const logs = this.getAuditLogs();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const fechaHora = `${fecha} ${hora}`;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      rol: params.rol,
      accion: params.accion,
      modulo: params.modulo,
      documentoAfectado: params.documentoAfectado,
      fecha,
      hora,
      fechaHora,
      detalles: params.detalles || '',
      ip: params.ip || '192.168.1.10'
    };

    setStored(STORAGE_KEYS.AUDIT, [newLog, ...logs]);
  }

  // Notifications
  static sendNotification(params: {
    userId: string;
    titulo: string;
    mensaje: string;
    tipo: Notification['tipo'];
    referenciaId?: string;
  }) {
    const notifs = this.getNotifications();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.userId,
      titulo: params.titulo,
      mensaje: params.mensaje,
      tipo: params.tipo,
      referenciaId: params.referenciaId,
      leida: false,
      fechaCreacion: fecha
    };

    setStored(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs]);
    emitDataEvent('siaa-notifications-updated');
  }

  static markNotificationAsRead(id: string) {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, leida: true } : n);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    emitDataEvent('siaa-notifications-updated');
  }

  static markNotificationsReadByIds(userId: string, notificationIds: string[]) {
    if (notificationIds.length === 0) return;
    const idSet = new Set(notificationIds);
    const notifs = this.getNotifications();
    let changed = false;
    const updated = notifs.map(n => {
      if (n.userId === userId && idSet.has(n.id) && !n.leida) {
        changed = true;
        return { ...n, leida: true };
      }
      return n;
    });
    if (changed) {
      setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
      emitDataEvent('siaa-notifications-updated');
    }
  }

  static markAllNotificationsAsRead(userId: string) {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => n.userId === userId ? { ...n, leida: true } : n);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    emitDataEvent('siaa-notifications-updated');
  }

  // Folio generator
  static generateNextFolio(): string {
    const asesorias = this.getAsesorias();
    const currentYear = new Date().getFullYear();
    const yearPrefix = `SIAA-${currentYear}-`;
    const folios = asesorias
      .map(a => a.folio)
      .filter(f => f.startsWith(yearPrefix))
      .map(f => parseInt(f.replace(yearPrefix, ''), 10))
      .filter(n => !isNaN(n));
    
    const maxNumber = folios.length > 0 ? Math.max(...folios) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(6, '0');
    return `${yearPrefix}${nextNumber}`;
  }

  // Conflict detection
  static checkScheduleConflict(params: {
    docenteId?: string;
    alumnoId?: string;
    aulaId?: string;
    fecha: string;      // YYYY-MM-DD
    horaInicio: string; // HH:mm
    horaTermino: string;// HH:mm
    excludeAsesoriaId?: string;
  }): { hasConflict: boolean; reason?: string } {
    const { docenteId, alumnoId, aulaId, fecha, horaInicio, horaTermino, excludeAsesoriaId } = params;
    const asesorias = this.getAsesorias();

    // Only active sessions that occupy time slots
    const activeStates: EstadoAsesoria[] = ['asignada', 'confirmada', 'en_proceso'];

    for (const a of asesorias) {
      if (a.id === excludeAsesoriaId) continue;
      if (!activeStates.includes(a.estado)) continue;
      if (a.fechaProgramada !== fecha) continue;
      if (!a.horaInicio || !a.horaTermino) continue;

      // Check overlap: (StartA < EndB) and (EndA > StartB)
      const overlaps = horaInicio < a.horaTermino && horaTermino > a.horaInicio;
      if (!overlaps) continue;

      // 1. Conflict for teacher
      if (docenteId && a.docenteAsignadoId === docenteId) {
        return {
          hasConflict: true,
          reason: `El docente asignado ya tiene una asesoría programada (${a.folio}) de ${a.horaInicio} a ${a.horaTermino} en esta fecha.`
        };
      }

      // 2. Conflict for student
      if (alumnoId && a.alumnoId === alumnoId) {
        return {
          hasConflict: true,
          reason: `El alumno ya tiene otra asesoría agendada (${a.folio}) de ${a.horaInicio} a ${a.horaTermino} en esta fecha.`
        };
      }

      // 3. Conflict for classroom
      if (aulaId && a.aulaId === aulaId) {
        return {
          hasConflict: true,
          reason: `El aula seleccionada (${a.aulaNombre || 'Aula'}) se encuentra ocupada de ${a.horaInicio} a ${a.horaTermino} por la asesoría ${a.folio}.`
        };
      }
    }

    return { hasConflict: false };
  }

  // Request creation
  static createSolicitud(params: Omit<Asesoria, 'id' | 'folio' | 'estado'>): Asesoria {
    const folio = this.generateNextFolio();
    const id = `ase-${Date.now()}`;
    const newAsesoria: Asesoria = {
      ...params,
      id,
      folio,
      estado: 'pendiente'
    };

    const list = this.getAsesorias();
    setStored(STORAGE_KEYS.ASESORIAS, [newAsesoria, ...list]);

    // Send notifications to administrators, academic directors, and career heads matching the career
    const users = this.getUsers();
    const managers = users.filter(u => {
      if (u.rol === 'admin') return true;
      if (u.rol === 'director' || u.rol === 'jefe_carrera') {
        const assigned = getUserCarreraIds(u);
        return assigned.length === 0 || userHasCarrera(u, params.carreraId);
      }
      return false;
    });
    managers.forEach(u => {
      this.sendNotification({
        userId: u.uid,
        titulo: 'Nueva Solicitud de Asesoría',
        mensaje: `El alumno ${params.alumnoNombre} ha solicitado asesoría en ${params.materiaNombre} (Folio: ${folio}).`,
        tipo: 'solicitud',
        referenciaId: id
      });
    });

    this.logAudit({
      usuarioId: params.solicitanteId,
      usuarioNombre: params.solicitanteNombre,
      rol: params.solicitanteRol,
      accion: 'SOLICITUD_CREADA',
      modulo: 'Solicitudes',
      documentoAfectado: folio,
      detalles: `Materia: ${params.materiaNombre}, Motivo: ${params.motivo.slice(0, 60)}`
    });

    emitDataEvent('siaa-asesorias-updated');
    return newAsesoria;
  }

  static updateSolicitud(
    asesoriaId: string,
    updates: {
      alumnoId: string;
      alumnoNombre: string;
      matricula: string;
      carreraId: string;
      carreraNombre: string;
      grupoId: string;
      grupoNombre: string;
      cuatrimestreId: string;
      cuatrimestreNumero: number;
      materiaId: string;
      materiaNombre: string;
      materiaCodigo: string;
      motivo: string;
      temasDificultad: string;
      prioridad: Asesoria['prioridad'];
    },
    actor: User
  ): Asesoria | undefined {
    const list = this.getAsesorias();
    const idx = list.findIndex(a => a.id === asesoriaId);
    if (idx === -1) return undefined;

    const updatedAsesoria: Asesoria = {
      ...list[idx],
      ...updates
    };
    list[idx] = updatedAsesoria;
    setStored(STORAGE_KEYS.ASESORIAS, list);

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'SOLICITUD_ACTUALIZADA',
      modulo: 'Solicitudes',
      documentoAfectado: updatedAsesoria.folio,
      detalles: `Materia: ${updatedAsesoria.materiaNombre}, Prioridad: ${updatedAsesoria.prioridad}`
    });

    emitDataEvent('siaa-asesorias-updated');
    return updatedAsesoria;
  }

  static deleteAsesoria(asesoriaId: string, actor: User): boolean {
    const list = this.getAsesorias();
    const target = list.find(a => a.id === asesoriaId);
    if (!target) return false;

    setStored(STORAGE_KEYS.ASESORIAS, list.filter(a => a.id !== asesoriaId));

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'ASESORIA_ELIMINADA',
      modulo: 'Asesorías',
      documentoAfectado: target.folio,
      detalles: `Registro eliminado (${target.alumnoNombre} - ${target.materiaNombre})`
    });

    emitDataEvent('siaa-asesorias-updated');
    return true;
  }

  // Update asesoria
  static updateAsesoria(asesoria: Asesoria, actionUser: User, actionName: string, details?: string): void {
    const list = this.getAsesorias();
    const updated = list.map(a => a.id === asesoria.id ? asesoria : a);
    setStored(STORAGE_KEYS.ASESORIAS, updated);

    this.logAudit({
      usuarioId: actionUser.uid,
      usuarioNombre: `${actionUser.nombre} ${actionUser.apellidoPaterno}`,
      rol: actionUser.rol,
      accion: actionName,
      modulo: 'Asesorías',
      documentoAfectado: asesoria.folio,
      detalles: details || `Estado actualizado a ${asesoria.estado}`
    });
    emitDataEvent('siaa-asesorias-updated');
  }

  static updateAsesoriaEstado(
    asesoriaId: string,
    nuevoEstado: EstadoAsesoria,
    actor: User,
    detalles?: string
  ): void {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria) return;
    const prevEstado = asesoria.estado;
    asesoria.estado = nuevoEstado;
    this.updateAsesoria(asesoria, actor, `ESTADO_${nuevoEstado.toUpperCase()}`, detalles);

    if (prevEstado !== nuevoEstado) {
      const estadoLabel = nuevoEstado.replace(/_/g, ' ').toUpperCase();
      if (asesoria.alumnoId !== actor.uid) {
        this.sendNotification({
          userId: asesoria.alumnoId,
          titulo: 'Actualización de Estado de Asesoría',
          mensaje: `Tu asesoría ${asesoria.folio} (${asesoria.materiaNombre}) cambió a estado ${estadoLabel}.`,
          tipo: nuevoEstado === 'cancelada' || nuevoEstado === 'rechazada' ? 'cancelacion' : 'autorizacion',
          referenciaId: asesoria.id
        });
      }
      if (asesoria.docenteAsignadoId && asesoria.docenteAsignadoId !== actor.uid) {
        this.sendNotification({
          userId: asesoria.docenteAsignadoId,
          titulo: 'Cambio de Estado en Sesión Asignada',
          mensaje: `La asesoría ${asesoria.folio} de ${asesoria.alumnoNombre} cambió a estado ${estadoLabel}.`,
          tipo: nuevoEstado === 'cancelada' || nuevoEstado === 'rechazada' ? 'cancelacion' : 'asignacion',
          referenciaId: asesoria.id
        });
      }
    }
  }

  // Authorize request
  static autorizarSolicitud(
    asesoriaId: string,
    autorizador: User,
    observaciones?: string
  ): { success: boolean; message?: string } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria) return { success: false, message: 'Asesoría no encontrada' };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    asesoria.estado = 'aprobada';
    asesoria.autorizadaPor = `${autorizador.nombre} ${autorizador.apellidoPaterno}`;
    asesoria.fechaAutorizacion = fecha;
    asesoria.observacionesAutorizacion = observaciones;

    this.updateAsesoria(asesoria, autorizador, 'SOLICITUD_APROBADA', observaciones);

    // Notify student
    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Solicitud Aprobada',
      mensaje: `Tu solicitud de asesoría (${asesoria.folio}) para ${asesoria.materiaNombre} ha sido aprobada. En breve se te asignará docente y horario.`,
      tipo: 'autorizacion',
      referenciaId: asesoria.id
    });

    return { success: true };
  }

  // Reject request
  static rechazarSolicitud(
    asesoriaId: string,
    autorizador: User,
    motivoRechazo: string
  ): { success: boolean; message?: string } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria) return { success: false, message: 'Asesoría no encontrada' };

    asesoria.estado = 'rechazada';
    asesoria.motivoRechazo = motivoRechazo;

    this.updateAsesoria(asesoria, autorizador, 'SOLICITUD_RECHAZADA', `Motivo: ${motivoRechazo}`);

    // Notify student
    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Solicitud No Aprobada',
      mensaje: `Tu solicitud (${asesoria.folio}) no pudo ser aprobada. Motivo: ${motivoRechazo}`,
      tipo: 'cancelacion',
      referenciaId: asesoria.id
    });

    return { success: true };
  }

  // Assign teacher & schedule
  static asignarAsesoria(params: {
    asesoriaId: string;
    docenteId: string;
    fecha: string;
    horaInicio: string;
    horaTermino: string;
    aulaId: string;
    modalidad: 'presencial' | 'virtual' | 'hibrida';
    observaciones?: string;
    actor: User;
  }): { success: boolean; message?: string } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === params.asesoriaId);
    if (!asesoria) return { success: false, message: 'Asesoría no encontrada' };

    // Check conflict
    const conflict = this.checkScheduleConflict({
      docenteId: params.docenteId,
      alumnoId: asesoria.alumnoId,
      aulaId: params.aulaId,
      fecha: params.fecha,
      horaInicio: params.horaInicio,
      horaTermino: params.horaTermino,
      excludeAsesoriaId: asesoria.id
    });

    if (conflict.hasConflict) {
      return { success: false, message: conflict.reason };
    }

    const docente = this.getUsers().find(u => u.uid === params.docenteId);
    const aula = this.getAulas().find(a => a.id === params.aulaId);

    asesoria.docenteAsignadoId = params.docenteId;
    asesoria.docenteAsignadoNombre = docente ? `${docente.nombre} ${docente.apellidoPaterno} ${docente.apellidoMaterno}` : 'Docente Asignado';
    asesoria.fechaProgramada = params.fecha;
    asesoria.horaInicio = params.horaInicio;
    asesoria.horaTermino = params.horaTermino;
    asesoria.aulaId = params.aulaId;
    asesoria.aulaNombre = aula ? aula.nombre : 'Aula asignada';
    asesoria.modalidad = params.modalidad;
    asesoria.observaciones = params.observaciones;
    asesoria.estado = 'confirmada';

    this.updateAsesoria(asesoria, params.actor, 'ASESORIA_ASIGNADA_Y_CONFIRMADA', `Docente: ${asesoria.docenteAsignadoNombre}, Fecha: ${params.fecha} ${params.horaInicio}`);

    // Notify Student
    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Asesoría Programada y Confirmada',
      mensaje: `Tu asesoría de ${asesoria.materiaNombre} (${asesoria.folio}) fue asignada con ${asesoria.docenteAsignadoNombre} para el día ${params.fecha} de ${params.horaInicio} a ${params.horaTermino} en ${asesoria.aulaNombre}.`,
      tipo: 'asignacion',
      referenciaId: asesoria.id
    });

    // Notify Teacher
    this.sendNotification({
      userId: params.docenteId,
      titulo: 'Nueva Asesoría Asignada',
      mensaje: `Has sido asignado como asesor de ${asesoria.alumnoNombre} (${asesoria.folio}) en ${asesoria.materiaNombre} el ${params.fecha} de ${params.horaInicio} a ${params.horaTermino}.`,
      tipo: 'asignacion',
      referenciaId: asesoria.id
    });

    return { success: true };
  }

  // Register follow-up (Docente)
  static registrarSeguimiento(params: {
    asesoriaId: string;
    temasTrabajados: string;
    dificultadesDetectadas: string;
    actividadesRealizadas: string;
    resultado: 'satisfactorio' | 'parcialmente_satisfactorio' | 'no_satisfactorio' | 'requiere_reforzamiento';
    recomendaciones: string;
    observaciones: string;
    requiereNuevaAsesoria: boolean;
    evidencias: { id: string; nombre: string; url: string; tipo: string; fecha: string; tamanio?: string }[];
    actor: User;
  }): { success: boolean; message?: string } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === params.asesoriaId);
    if (!asesoria) return { success: false, message: 'Asesoría no encontrada' };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fecha = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    asesoria.seguimiento = {
      temasTrabajados: params.temasTrabajados,
      dificultadesDetectadas: params.dificultadesDetectadas,
      actividadesRealizadas: params.actividadesRealizadas,
      resultado: params.resultado,
      recomendaciones: params.recomendaciones,
      observaciones: params.observaciones,
      requiereNuevaAsesoria: params.requiereNuevaAsesoria,
      fechaSeguimiento: fecha,
      evidencias: params.evidencias
    };
    asesoria.estado = 'realizada';

    this.updateAsesoria(asesoria, params.actor, 'SEGUIMIENTO_REGISTRADO', `Resultado: ${params.resultado}. Nueva asesoría: ${params.requiereNuevaAsesoria ? 'Sí' : 'No'}`);

    // Notify student
    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Resultado de Asesoría Registrado',
      mensaje: `El docente ha registrado el seguimiento de tu asesoría en ${asesoria.materiaNombre}. Puedes consultar la ficha oficial de resultados.`,
      tipo: 'seguimiento',
      referenciaId: asesoria.id
    });

    return { success: true };
  }

  static deleteSeguimiento(asesoriaId: string, actor: User): { success: boolean } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria || !asesoria.seguimiento) return { success: false };

    const updated: Asesoria = {
      ...asesoria,
      seguimiento: undefined,
      estado: asesoria.docenteAsignadoId ? 'confirmada' : 'pendiente'
    };

    this.updateAsesoria(updated, actor, 'SEGUIMIENTO_ELIMINADO', 'Se eliminó el seguimiento pedagógico registrado.');
    return { success: true };
  }

  // Close advisory (Admin / Director)
  static cerrarAsesoria(asesoriaId: string, actor: User): { success: boolean } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria) return { success: false };

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    asesoria.fechaCierre = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    asesoria.estado = 'cerrada';

    this.updateAsesoria(asesoria, actor, 'ASESORIA_CERRADA', 'Cierre oficial y archivo del expediente de asesoría.');

    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Expediente de Asesoría Cerrado',
      mensaje: `El expediente de tu asesoría ${asesoria.folio} (${asesoria.materiaNombre}) ha sido cerrado oficialmente.`,
      tipo: 'seguimiento',
      referenciaId: asesoria.id
    });

    if (asesoria.docenteAsignadoId && asesoria.docenteAsignadoId !== actor.uid) {
      this.sendNotification({
        userId: asesoria.docenteAsignadoId,
        titulo: 'Asesoría Cerrada Oficialmente',
        mensaje: `La sesión ${asesoria.folio} con ${asesoria.alumnoNombre} fue cerrada por coordinación.`,
        tipo: 'seguimiento',
        referenciaId: asesoria.id
      });
    }

    return { success: true };
  }

  // Cancel advisory
  static cancelarAsesoria(asesoriaId: string, motivo: string, actor: User): { success: boolean } {
    const list = this.getAsesorias();
    const asesoria = list.find(a => a.id === asesoriaId);
    if (!asesoria) return { success: false };

    asesoria.estado = 'cancelada';
    asesoria.observaciones = `Cancelada: ${motivo}`;

    this.updateAsesoria(asesoria, actor, 'ASESORIA_CANCELADA', `Motivo: ${motivo}`);

    // Notify student & teacher
    this.sendNotification({
      userId: asesoria.alumnoId,
      titulo: 'Asesoría Cancelada',
      mensaje: `La asesoría ${asesoria.folio} ha sido cancelada. Motivo: ${motivo}`,
      tipo: 'cancelacion',
      referenciaId: asesoria.id
    });

    if (asesoria.docenteAsignadoId) {
      this.sendNotification({
        userId: asesoria.docenteAsignadoId,
        titulo: 'Asesoría Cancelada',
        mensaje: `La asesoría ${asesoria.folio} programada para el alumno ${asesoria.alumnoNombre} ha sido cancelada. Motivo: ${motivo}`,
        tipo: 'cancelacion',
        referenciaId: asesoria.id
      });
    }

    return { success: true };
  }

  // Availability management
  static addDisponibilidadRecurrente(disp: Omit<DisponibilidadRecurrente, 'id'>): DisponibilidadRecurrente {
    const list = this.getDisponibilidadesRecurrentes();
    const newDisp: DisponibilidadRecurrente = {
      ...disp,
      id: `disp-rec-${Date.now()}`
    };
    list.push(newDisp);
    setStored(STORAGE_KEYS.DISP_REC, list);
    return newDisp;
  }

  static updateDisponibilidadRecurrente(
    id: string,
    updates: Partial<Omit<DisponibilidadRecurrente, 'id'>>
  ): DisponibilidadRecurrente | undefined {
    const list = this.getDisponibilidadesRecurrentes();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.DISP_REC, list);
    return list[idx];
  }

  static saveDisponibilidadRecurrente(disp: DisponibilidadRecurrente): void {
    const list = this.getDisponibilidadesRecurrentes();
    const idx = list.findIndex(d => d.id === disp.id);
    if (idx >= 0) {
      list[idx] = disp;
    } else {
      list.push(disp);
    }
    setStored(STORAGE_KEYS.DISP_REC, list);
  }

  static deleteDisponibilidadRecurrente(id: string): void {
    const list = this.getDisponibilidadesRecurrentes();
    setStored(STORAGE_KEYS.DISP_REC, list.filter(d => d.id !== id));
  }

  static addDisponibilidadEspecifica(disp: Omit<DisponibilidadEspecifica, 'id'>): DisponibilidadEspecifica {
    const list = this.getDisponibilidadesEspecificas();
    const newDisp: DisponibilidadEspecifica = {
      ...disp,
      id: `disp-esp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    };
    list.push(newDisp);
    setStored(STORAGE_KEYS.DISP_ESP, list);
    return newDisp;
  }

  static updateDisponibilidadEspecifica(
    id: string,
    updates: Partial<Omit<DisponibilidadEspecifica, 'id'>>
  ): DisponibilidadEspecifica | undefined {
    const list = this.getDisponibilidadesEspecificas();
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.DISP_ESP, list);
    return list[idx];
  }

  static saveDisponibilidadEspecifica(disp: DisponibilidadEspecifica): void {
    const list = this.getDisponibilidadesEspecificas();
    const idx = list.findIndex(d => d.id === disp.id);
    if (idx >= 0) {
      list[idx] = disp;
    } else {
      list.push(disp);
    }
    setStored(STORAGE_KEYS.DISP_ESP, list);
  }

  static deleteDisponibilidadEspecifica(id: string): void {
    const list = this.getDisponibilidadesEspecificas();
    setStored(STORAGE_KEYS.DISP_ESP, list.filter(d => d.id !== id));
  }

  // User management
  static createUser(
    userData: Omit<User, 'uid' | 'fechaCreacion' | 'fechaActualizacion'>,
    actor: User
  ): User {
    const list = this.getUsers();
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const normalizedCarreras = getUserCarreraIds(userData);
    const newUser: User = {
      ...userData,
      carreraId: normalizedCarreras[0] || undefined,
      carrerasIds: normalizedCarreras,
      uid: `user-${Date.now()}`,
      fechaCreacion: today,
      fechaActualizacion: today
    };

    list.push(newUser);
    setStored(STORAGE_KEYS.USERS, list);
    emitDataEvent('siaa-users-updated');

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'USUARIO_CREADO',
      modulo: 'Usuarios',
      documentoAfectado: newUser.correo,
      detalles: `Nombre: ${newUser.nombre} ${newUser.apellidoPaterno}, Rol: ${newUser.rol}`
    });

    return newUser;
  }

  static updateUser(uid: string, updates: Partial<User>, actor: User): User | undefined {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.uid === uid);
    if (idx === -1) return undefined;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const mergedUser: User = {
      ...list[idx],
      ...updates,
      fechaActualizacion: today
    };

    if ('carrerasIds' in updates || 'carreraId' in updates) {
      const normalizedCarreras = Array.isArray(updates.carrerasIds)
        ? Array.from(new Set(updates.carrerasIds.filter(Boolean)))
        : updates.carreraId
        ? [updates.carreraId]
        : [];
      mergedUser.carrerasIds = normalizedCarreras;
      mergedUser.carreraId = normalizedCarreras[0] || undefined;
    }

    list[idx] = mergedUser;
    setStored(STORAGE_KEYS.USERS, list);
    emitDataEvent('siaa-users-updated');

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'USUARIO_ACTUALIZADO',
      modulo: 'Usuarios',
      documentoAfectado: mergedUser.correo,
      detalles: `Actualización de campos en usuario: ${mergedUser.nombre} ${mergedUser.apellidoPaterno}`
    });

    return mergedUser;
  }

  static updateUserPhoto(uid: string, fotoURL: string | undefined, actor: User): User | undefined {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.uid === uid);
    if (idx === -1) return undefined;

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    const updatedUser: User = {
      ...list[idx],
      fotoURL,
      fechaActualizacion: today
    };

    list[idx] = updatedUser;
    setStored(STORAGE_KEYS.USERS, list);
    emitDataEvent('siaa-users-updated');

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'FOTO_PERFIL_ACTUALIZADA',
      modulo: 'Perfil',
      documentoAfectado: updatedUser.correo,
      detalles: fotoURL
        ? `Se actualizó la fotografía de perfil de ${updatedUser.nombre} ${updatedUser.apellidoPaterno}.`
        : `Se eliminó la fotografía de perfil de ${updatedUser.nombre} ${updatedUser.apellidoPaterno}.`
    });

    return updatedUser;
  }

  static resetPassword(uid: string, _newPass: string, actor: User): void {
    const list = this.getUsers();
    const user = list.find(u => u.uid === uid);
    if (!user) return;

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'RESTABLECIMIENTO_CONTRASENA',
      modulo: 'Seguridad',
      documentoAfectado: user.correo,
      detalles: `Restablecimiento de contraseña para ${user.correo}`
    });
  }

  static saveUser(user: User, actor: User): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.uid === user.uid);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    if (idx >= 0) {
      user.fechaActualizacion = today;
      list[idx] = user;
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'USUARIO_ACTUALIZADO',
        modulo: 'Usuarios',
        documentoAfectado: user.correo,
        detalles: `Rol: ${user.rol}, Estado: ${user.estado}`
      });
    } else {
      user.fechaCreacion = today;
      user.fechaActualizacion = today;
      list.push(user);
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'USUARIO_CREADO',
        modulo: 'Usuarios',
        documentoAfectado: user.correo,
        detalles: `Nombre: ${user.nombre} ${user.apellidoPaterno}, Rol: ${user.rol}`
      });
    }
    setStored(STORAGE_KEYS.USERS, list);
    emitDataEvent('siaa-users-updated');
  }

  static toggleUserStatus(uid: string, actor: User): User | undefined {
    const list = this.getUsers();
    const user = list.find(u => u.uid === uid);
    if (user) {
      user.estado = user.estado === 'activo' ? 'inactivo' : 'activo';
      setStored(STORAGE_KEYS.USERS, list);
      emitDataEvent('siaa-users-updated');
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'ESTADO_USUARIO_CAMBIADO',
        modulo: 'Usuarios',
        documentoAfectado: user.correo,
        detalles: `Nuevo estado: ${user.estado}`
      });
    }
    return user;
  }

  static deleteUser(uid: string, actor: User): boolean {
    const list = this.getUsers();
    const target = list.find(u => u.uid === uid);
    if (!target) return false;

    setStored(STORAGE_KEYS.USERS, list.filter(u => u.uid !== uid));
    emitDataEvent('siaa-users-updated');

    this.logAudit({
      usuarioId: actor.uid,
      usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
      rol: actor.rol,
      accion: 'USUARIO_ELIMINADO',
      modulo: 'Usuarios',
      documentoAfectado: target.correo,
      detalles: `Usuario eliminado: ${target.nombre} ${target.apellidoPaterno} (${target.rol})`
    });

    return true;
  }

  // Catalog methods
  static addCarrera(carrera: Omit<Carrera, 'id'>): Carrera {
    const list = this.getCarreras();
    const newCarrera: Carrera = {
      ...carrera,
      id: `carr-${Date.now()}`
    };
    list.push(newCarrera);
    setStored(STORAGE_KEYS.CARRERAS, list);
    return newCarrera;
  }

  static updateCarrera(id: string, updates: Partial<Carrera>): Carrera | undefined {
    const list = this.getCarreras();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.CARRERAS, list);
    return list[idx];
  }

  static deleteCarrera(id: string, actor?: User): boolean {
    const list = this.getCarreras();
    const target = list.find(c => c.id === id);
    if (!target) return false;
    setStored(STORAGE_KEYS.CARRERAS, list.filter(c => c.id !== id));
    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_CARRERA_ELIMINADA',
        modulo: 'Catálogos',
        documentoAfectado: target.codigo,
        detalles: `Carrera eliminada: ${target.nombre}`
      });
    }
    return true;
  }

  static addMateria(materia: Omit<Materia, 'id'>): Materia {
    const list = this.getMaterias();
    const newMateria: Materia = {
      ...materia,
      id: `mat-${Date.now()}`
    };
    list.push(newMateria);
    setStored(STORAGE_KEYS.MATERIAS, list);
    return newMateria;
  }

  static updateMateria(id: string, updates: Partial<Materia>): Materia | undefined {
    const list = this.getMaterias();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.MATERIAS, list);
    return list[idx];
  }

  static deleteMateria(id: string, actor?: User): boolean {
    const list = this.getMaterias();
    const target = list.find(m => m.id === id);
    if (!target) return false;
    setStored(STORAGE_KEYS.MATERIAS, list.filter(m => m.id !== id));
    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_MATERIA_ELIMINADA',
        modulo: 'Catálogos',
        documentoAfectado: target.codigo,
        detalles: `Materia eliminada: ${target.nombre}`
      });
    }
    return true;
  }

  static addTipoEspacio(tipo: Omit<TipoEspacio, 'id'>, actor?: User): TipoEspacio {
    const list = this.getTiposEspacio();
    const cleanName = tipo.nombre.trim();
    const existing = list.find(t => t.nombre.trim().toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      if (existing.estado === 'inactivo' && tipo.estado === 'activo') {
        return this.updateTipoEspacio(existing.id, { estado: 'activo', descripcion: tipo.descripcion ?? existing.descripcion }, actor) || existing;
      }
      return existing;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const newTipo: TipoEspacio = {
      ...tipo,
      nombre: cleanName,
      descripcion: tipo.descripcion?.trim() || undefined,
      id: `tip-esp-${Date.now()}`,
      fechaCreacion: tipo.fechaCreacion || today
    };
    list.push(newTipo);
    setStored(STORAGE_KEYS.TIPOS_ESPACIO, list);

    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_TIPO_ESPACIO_CREADO',
        modulo: 'Catálogos',
        documentoAfectado: newTipo.nombre,
        detalles: `Nuevo tipo de espacio registrado: ${newTipo.nombre}`
      });
    }
    return newTipo;
  }

  static updateTipoEspacio(id: string, updates: Partial<TipoEspacio>, actor?: User): TipoEspacio | undefined {
    const list = this.getTiposEspacio();
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return undefined;

    const previousName = list[idx].nombre;
    const nextName = updates.nombre !== undefined ? updates.nombre.trim() : previousName;
    if (!nextName) return undefined;

    const updated: TipoEspacio = {
      ...list[idx],
      ...updates,
      nombre: nextName,
      descripcion: updates.descripcion !== undefined ? (updates.descripcion.trim() || undefined) : list[idx].descripcion
    };
    list[idx] = updated;
    setStored(STORAGE_KEYS.TIPOS_ESPACIO, list);

    // Cascade rename onto existing Aulas that used the previous space type name
    if (previousName.trim().toLowerCase() !== nextName.toLowerCase()) {
      const aulas = getStored<Aula[]>(STORAGE_KEYS.AULAS, INITIAL_AULAS);
      let modifiedAulas = false;
      const updatedAulas = aulas.map(a => {
        const normalizedCurrent = normalizeTipoEspacioNombre(a.tipo);
        if (
          a.tipo.trim().toLowerCase() === previousName.trim().toLowerCase() ||
          normalizedCurrent.toLowerCase() === previousName.trim().toLowerCase()
        ) {
          modifiedAulas = true;
          return { ...a, tipo: nextName };
        }
        return a;
      });
      if (modifiedAulas) {
        setStored(STORAGE_KEYS.AULAS, updatedAulas);
      }
    }

    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_TIPO_ESPACIO_ACTUALIZADO',
        modulo: 'Catálogos',
        documentoAfectado: nextName,
        detalles:
          previousName !== nextName
            ? `Tipo de espacio renombrado de "${previousName}" a "${nextName}"`
            : `Tipo de espacio actualizado: ${nextName} (${updated.estado})`
      });
    }

    return updated;
  }

  static deleteTipoEspacio(id: string, actor?: User, replacementTipoNombre?: string): boolean {
    const list = this.getTiposEspacio();
    const target = list.find(t => t.id === id);
    if (!target) return false;

    if (replacementTipoNombre && replacementTipoNombre.trim()) {
      const targetLower = target.nombre.trim().toLowerCase();
      const aulas = getStored<Aula[]>(STORAGE_KEYS.AULAS, INITIAL_AULAS);
      let changed = false;
      const reassigned = aulas.map(a => {
        const normalized = normalizeTipoEspacioNombre(a.tipo);
        if (a.tipo.trim().toLowerCase() === targetLower || normalized.toLowerCase() === targetLower) {
          changed = true;
          return { ...a, tipo: replacementTipoNombre.trim() };
        }
        return a;
      });
      if (changed) {
        setStored(STORAGE_KEYS.AULAS, reassigned);
      }
    }

    setStored(STORAGE_KEYS.TIPOS_ESPACIO, list.filter(t => t.id !== id));

    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_TIPO_ESPACIO_ELIMINADO',
        modulo: 'Catálogos',
        documentoAfectado: target.nombre,
        detalles: replacementTipoNombre
          ? `Tipo de espacio eliminado: ${target.nombre} (espacios reasignados a ${replacementTipoNombre})`
          : `Tipo de espacio eliminado: ${target.nombre}`
      });
    }
    return true;
  }

  static ensureTipoEspacioExists(rawNombre: string): string {
    const list = this.getTiposEspacio();
    const resolved = normalizeTipoEspacioNombre(rawNombre, list);
    const exists = list.some(t => t.nombre.trim().toLowerCase() === resolved.toLowerCase());
    if (!exists && resolved) {
      this.addTipoEspacio({
        nombre: resolved,
        descripcion: 'Registrado desde importación o catálogo de aulas',
        estado: 'activo'
      });
    }
    return resolved;
  }

  static saveTiposEspacioBatch(items: TipoEspacio[]): void {
    setStored(STORAGE_KEYS.TIPOS_ESPACIO, items);
  }

  static addAula(aula: Omit<Aula, 'id'>): Aula {
    const list = this.getAulas();
    const resolvedTipo = this.ensureTipoEspacioExists(aula.tipo);
    const newAula: Aula = {
      ...aula,
      tipo: resolvedTipo,
      id: `aula-${Date.now()}`
    };
    list.push(newAula);
    setStored(STORAGE_KEYS.AULAS, list);
    return newAula;
  }

  static updateAula(id: string, updates: Partial<Aula>): Aula | undefined {
    const list = this.getAulas();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    const resolvedUpdates = { ...updates };
    if (resolvedUpdates.tipo !== undefined) {
      resolvedUpdates.tipo = this.ensureTipoEspacioExists(resolvedUpdates.tipo);
    }
    list[idx] = { ...list[idx], ...resolvedUpdates };
    setStored(STORAGE_KEYS.AULAS, list);
    return list[idx];
  }

  static deleteAula(id: string, actor?: User): boolean {
    const list = this.getAulas();
    const target = list.find(a => a.id === id);
    if (!target) return false;
    setStored(STORAGE_KEYS.AULAS, list.filter(a => a.id !== id));
    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_AULA_ELIMINADA',
        modulo: 'Catálogos',
        documentoAfectado: target.nombre,
        detalles: `Aula eliminada: ${target.nombre} (${target.edificio})`
      });
    }
    return true;
  }

  static addGrupo(grupo: Omit<Grupo, 'id'>): Grupo {
    const list = this.getGrupos();
    const newGrupo: Grupo = {
      ...grupo,
      id: `grup-${Date.now()}`
    };
    list.push(newGrupo);
    setStored(STORAGE_KEYS.GRUPOS, list);
    return newGrupo;
  }

  static updateGrupo(id: string, updates: Partial<Grupo>): Grupo | undefined {
    const list = this.getGrupos();
    const idx = list.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.GRUPOS, list);
    return list[idx];
  }

  static deleteGrupo(id: string, actor?: User): boolean {
    const list = this.getGrupos();
    const target = list.find(g => g.id === id);
    if (!target) return false;
    setStored(STORAGE_KEYS.GRUPOS, list.filter(g => g.id !== id));
    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_GRUPO_ELIMINADO',
        modulo: 'Catálogos',
        documentoAfectado: target.nombre,
        detalles: `Grupo eliminado: ${target.nombre}`
      });
    }
    return true;
  }

  static addCuatrimestre(cuatrimestre: Omit<Cuatrimestre, 'id'>): Cuatrimestre {
    const list = this.getCuatrimestres();
    const newCuat: Cuatrimestre = {
      ...cuatrimestre,
      id: `cuat-${Date.now()}`
    };
    list.push(newCuat);
    setStored(STORAGE_KEYS.CUATRIMESTRES, list);
    return newCuat;
  }

  static updateCuatrimestre(id: string, updates: Partial<Cuatrimestre>): Cuatrimestre | undefined {
    const list = this.getCuatrimestres();
    const idx = list.findIndex(cu => cu.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...updates };
    setStored(STORAGE_KEYS.CUATRIMESTRES, list);
    return list[idx];
  }

  static deleteCuatrimestre(id: string, actor?: User): boolean {
    const list = this.getCuatrimestres();
    const target = list.find(cu => cu.id === id);
    if (!target) return false;
    setStored(STORAGE_KEYS.CUATRIMESTRES, list.filter(cu => cu.id !== id));
    if (actor) {
      this.logAudit({
        usuarioId: actor.uid,
        usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
        rol: actor.rol,
        accion: 'CATALOGO_CUATRIMESTRE_ELIMINADO',
        modulo: 'Catálogos',
        documentoAfectado: target.nombre || `${target.numero}°`,
        detalles: `Cuatrimestre eliminado: ${target.nombre || target.numero}`
      });
    }
    return true;
  }

  static saveUsersBatch(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
    emitDataEvent('siaa-users-updated');
  }

  static saveCarrerasBatch(carreras: Carrera[]): void {
    setStored(STORAGE_KEYS.CARRERAS, carreras);
  }

  static saveMateriasBatch(materias: Materia[]): void {
    setStored(STORAGE_KEYS.MATERIAS, materias);
  }

  static saveGruposBatch(grupos: Grupo[]): void {
    setStored(STORAGE_KEYS.GRUPOS, grupos);
  }

  static saveCuatrimestresBatch(cuatrimestres: Cuatrimestre[]): void {
    setStored(STORAGE_KEYS.CUATRIMESTRES, cuatrimestres);
  }

  static saveAulasBatch(aulas: Aula[]): void {
    setStored(STORAGE_KEYS.AULAS, aulas);
  }

  static saveDisponibilidadRecurrenteBatch(items: DisponibilidadRecurrente[]): void {
    setStored(STORAGE_KEYS.DISP_REC, items);
  }

  static saveDisponibilidadEspecificaBatch(items: DisponibilidadEspecifica[]): void {
    setStored(STORAGE_KEYS.DISP_ESP, items);
  }

  static resetToSeedData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CARRERAS);
    localStorage.removeItem(STORAGE_KEYS.CUATRIMESTRES);
    localStorage.removeItem(STORAGE_KEYS.GRUPOS);
    localStorage.removeItem(STORAGE_KEYS.MATERIAS);
    localStorage.removeItem(STORAGE_KEYS.AULAS);
    localStorage.removeItem(STORAGE_KEYS.TIPOS_ESPACIO);
    localStorage.removeItem(STORAGE_KEYS.DISP_REC);
    localStorage.removeItem(STORAGE_KEYS.DISP_ESP);
    localStorage.removeItem(STORAGE_KEYS.ASESORIAS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    emitDataEvent('siaa-config-updated');
    emitDataEvent('siaa-users-updated');
  }

  // Filter application
  static filterAsesorias(asesorias: Asesoria[], filters: FilterParams): Asesoria[] {
    return asesorias.filter(a => {
      if (filters.fechaInicio && a.fechaProgramada && a.fechaProgramada < filters.fechaInicio) return false;
      if (filters.fechaFin && a.fechaProgramada && a.fechaProgramada > filters.fechaFin) return false;
      if (filters.carreraId && a.carreraId !== filters.carreraId) return false;
      if (filters.grupoId && a.grupoId !== filters.grupoId) return false;
      if (filters.cuatrimestreId && a.cuatrimestreId !== filters.cuatrimestreId) return false;
      if (filters.materiaId && a.materiaId !== filters.materiaId) return false;
      if (filters.docenteId && a.docenteAsignadoId !== filters.docenteId) return false;
      if (filters.estado && a.estado !== filters.estado) return false;
      if (filters.modalidad && a.modalidad !== filters.modalidad) return false;
      if (filters.aulaId && a.aulaId !== filters.aulaId) return false;
      if (filters.matricula && !a.matricula.toLowerCase().includes(filters.matricula.toLowerCase())) return false;
      if (filters.alumno) {
        const query = filters.alumno.toLowerCase();
        const matchesName = a.alumnoNombre.toLowerCase().includes(query);
        const matchesMatricula = a.matricula.toLowerCase().includes(query);
        if (!matchesName && !matchesMatricula) return false;
      }
      return true;
    });
  }

  // Export to XLSX (Requirement 23)
  static exportToXLSX(data: Asesoria[], customFilename?: string): void {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const filename = customFilename || `Reporte_Asesorias_SIAA_${dateStr}.xlsx`;

    const rows = data.map(item => ({
      'Folio': item.folio,
      'Fecha Solicitud': item.fechaSolicitud,
      'Matrícula': item.matricula,
      'Alumno': item.alumnoNombre,
      'Carrera': item.carreraNombre,
      'Grupo': item.grupoNombre,
      'Materia': item.materiaNombre,
      'Código Materia': item.materiaCodigo,
      'Docente Asesor': item.docenteAsignadoNombre || 'No asignado',
      'Fecha Programada': item.fechaProgramada || 'Sin programar',
      'Hora Inicio': item.horaInicio || '--',
      'Hora Término': item.horaTermino || '--',
      'Modalidad': item.modalidad ? item.modalidad.toUpperCase() : 'N/A',
      'Aula': item.aulaNombre || 'Sin aula',
      'Estado': item.estado.toUpperCase().replace('_', ' '),
      'Prioridad': item.prioridad.toUpperCase(),
      'Resultado': item.seguimiento ? item.seguimiento.resultado.toUpperCase().replace('_', ' ') : 'Pendiente',
      'Observaciones': item.observaciones || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto calculate column widths
    const colWidths = Object.keys(rows[0] || {}).map(key => ({
      wch: Math.max(key.length, 14)
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asesorías SIAA');
    XLSX.writeFile(workbook, filename);
  }

  static exportToExcel(data: Asesoria[], customFilename?: string): void {
    this.exportToXLSX(data, customFilename);
  }

  // Export General Report to PDF (Requirement 24.1)
  static exportReportPDF(data: Asesoria[], title: string = 'Reporte General de Asesorías Académicas'): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const config = this.getInstitutionalConfig();
    const shortName = (config.nombreCorto || 'SIAA').toUpperCase();
    const fullName = (config.nombreCompleto || 'SISTEMA INTEGRAL DE ASESORÍAS ACADÉMICAS').toUpperCase();

    // Institutional Header
    doc.setFillColor(19, 78, 74); // Institutional Green #134e4a
    doc.rect(0, 0, 297, 24, 'F');

    let textOffsetX = 14;
    if (config.logoURL) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 3, 18, 18, 2, 2, 'F');
        const format = config.logoURL.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(config.logoURL, format, 13, 4, 16, 16);
        textOffsetX = 35;
      } catch {
        textOffsetX = 14;
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`${shortName} — ${fullName}`, textOffsetX, 11, { maxWidth: 220 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(218, 165, 32); // Gold accent
    doc.text('DIRECCIÓN DE GESTIÓN Y SEGUIMIENTO ACADÉMICO UNIVERSITARIO', textOffsetX, 18);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Fecha de emisión: ${dateStr}`, 235, 18);

    // Subtitle & Metrics
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 14, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const realizadas = data.filter(d => d.estado === 'realizada' || d.estado === 'cerrada').length;
    const confirmadas = data.filter(d => d.estado === 'confirmada' || d.estado === 'asignada').length;
    const pendientes = data.filter(d => d.estado === 'pendiente' || d.estado === 'en_revision').length;

    doc.text(`Total registros: ${data.length}  |  Realizadas/Cerradas: ${realizadas}  |  Programadas: ${confirmadas}  |  Pendientes: ${pendientes}`, 14, 41);

    // Table
    const tableBody = data.map(item => [
      item.folio,
      item.matricula,
      item.alumnoNombre,
      item.materiaNombre,
      item.docenteAsignadoNombre || 'No asignado',
      item.fechaProgramada || item.fechaSolicitud,
      item.horaInicio ? `${item.horaInicio}-${item.horaTermino}` : '--',
      item.aulaNombre || 'Virtual / Por definir',
      item.estado.toUpperCase().replace('_', ' ')
    ]);

    autoTable(doc, {
      startY: 46,
      head: [['Folio', 'Matrícula', 'Alumno', 'Materia', 'Docente Asesor', 'Fecha', 'Horario', 'Aula', 'Estado']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [19, 78, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    doc.save(`Reporte_SIAA_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.pdf`);
  }

  static exportGeneralReportPDF(data: Asesoria[], title: string = 'Reporte General de Asesorías Académicas'): void {
    this.exportReportPDF(data, title);
  }

  // Export Individual Advisory Sheet to PDF (Requirement 24.2 - Ficha de Asesoría)
  static exportFichaPDF(asesoria: Asesoria): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const printDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const config = this.getInstitutionalConfig();
    const shortName = (config.nombreCorto || 'SIAA').toUpperCase();
    const fullName = (config.nombreCompleto || 'SISTEMA INTEGRAL DE ASESORÍAS ACADÉMICAS').toUpperCase();

    const pageWidth = 215.9;
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    const maxY = 250;

    const drawPageFooter = () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `${shortName} • Expediente oficial de tutorías y asesorías académicas • Folio ${asesoria.folio}`,
        marginX,
        269
      );
    };

    // Header bar
    doc.setFillColor(19, 78, 74); // Emerald
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Gold accent stripe
    doc.setFillColor(202, 138, 4); // Gold
    doc.rect(0, 32, pageWidth, 2.5, 'F');

    let textOffsetX = marginX;
    if (config.logoURL) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(12, 5, 22, 22, 2.5, 2.5, 'F');
        const format = config.logoURL.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(config.logoURL, format, 13.5, 6.5, 19, 19);
        textOffsetX = 39;
      } catch {
        textOffsetX = marginX;
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text(`${shortName} — ${fullName}`, textOffsetX, 13.5, { maxWidth: pageWidth - textOffsetX - 12 });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(254, 240, 138);
    doc.text('FICHA OFICIAL DE ASESORÍA ACADÉMICA Y SEGUIMIENTO PEDAGÓGICO', textOffsetX, 22);

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Impresión: ${printDate}`, pageWidth - marginX, 28, { align: 'right' });

    // Folio, Status & Priority Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(marginX, 40, contentWidth, 16, 2, 2, 'F');
    doc.setTextColor(19, 78, 74);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(`FOLIO: ${asesoria.folio}`, 19, 49.5);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('ESTADO:', 92, 49.5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(asesoria.estado.toUpperCase().replace('_', ' '), 109, 49.5);

    doc.setTextColor(100, 116, 139);
    doc.text('PRIORIDAD:', 153, 49.5);
    doc.setTextColor(15, 23, 42);
    doc.text((asesoria.prioridad || 'media').toUpperCase(), 175, 49.5);

    let currentY = 63;

    const ensureSpace = (neededHeight: number) => {
      if (currentY + neededHeight > maxY) {
        drawPageFooter();
        doc.addPage();
        doc.setFillColor(19, 78, 74);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setFillColor(202, 138, 4);
        doc.rect(0, 12, pageWidth, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${shortName} — Ficha de Asesoría ${asesoria.folio} (Continuación)`, marginX, 8);
        currentY = 22;
      }
    };

    const drawSectionHeader = (title: string) => {
      ensureSpace(14);
      doc.setFillColor(226, 232, 240);
      doc.rect(marginX, currentY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(19, 78, 74);
      doc.text(title, marginX + 4, currentY + 4.8);
      currentY += 11.5;
    };

    const drawWrappedField = (label: string, value: string, labelWidth = 42) => {
      const textValue = (value || 'N/A').trim() || 'N/A';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const valueX = marginX + 4 + labelWidth;
      const availableWidth = contentWidth - 8 - labelWidth;
      const lines = doc.splitTextToSize(textValue, availableWidth) as string[];
      const blockHeight = Math.max(6, lines.length * 4.3 + 2);
      ensureSpace(blockHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(label, marginX + 4, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(lines, valueX, currentY);
      currentY += blockHeight;
    };

    const drawTwoColumnRow = (label1: string, value1: string, label2: string, value2: string) => {
      ensureSpace(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(label1, marginX + 4, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const col1Lines = doc.splitTextToSize(value1 || 'N/A', 62) as string[];
      doc.text(col1Lines, marginX + 38, currentY);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text(label2, 120, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const col2Lines = doc.splitTextToSize(value2 || 'N/A', 52) as string[];
      doc.text(col2Lines, 148, currentY);

      const maxLines = Math.max(col1Lines.length, col2Lines.length);
      currentY += Math.max(6.5, maxLines * 4.3 + 2);
    };

    // Section 1: Datos del Alumno y Académicos
    drawSectionHeader('1. INFORMACIÓN DEL ALUMNO Y PROGRAMA ACADÉMICO');
    drawTwoColumnRow('Alumno:', asesoria.alumnoNombre, 'Matrícula:', asesoria.matricula);
    drawWrappedField('Carrera:', asesoria.carreraNombre, 34);
    drawTwoColumnRow('Grupo:', asesoria.grupoNombre, 'Cuatrimestre:', `${asesoria.cuatrimestreNumero}° Cuatrimestre`);
    currentY += 2;

    // Section 2: Datos de la Asesoría
    drawSectionHeader('2. DETALLES DE LA ASESORÍA Y PROGRAMACIÓN');
    drawWrappedField('Materia:', `${asesoria.materiaNombre} (${asesoria.materiaCodigo})`, 34);
    drawTwoColumnRow(
      'Docente Asesor:',
      asesoria.docenteAsignadoNombre || 'Por asignar',
      'Modalidad:',
      (asesoria.modalidad || 'presencial').toUpperCase()
    );
    const fechaHora = asesoria.fechaProgramada
      ? `${asesoria.fechaProgramada} (${asesoria.horaInicio} - ${asesoria.horaTermino} hrs)`
      : 'No programada';
    drawTwoColumnRow('Fecha y Horario:', fechaHora, 'Aula / Espacio:', asesoria.aulaNombre || 'Por definir');
    drawWrappedField('Motivo:', asesoria.motivo, 34);
    drawWrappedField('Temas solicitados:', asesoria.temasDificultad, 34);
    if (asesoria.observaciones) {
      drawWrappedField('Observaciones:', asesoria.observaciones, 34);
    }
    if (asesoria.autorizadaPor) {
      const authSummary = `${asesoria.autorizadaPor}${asesoria.fechaAutorizacion ? ` (${asesoria.fechaAutorizacion})` : ''}${asesoria.observacionesAutorizacion ? ` — "${asesoria.observacionesAutorizacion}"` : ''}`;
      drawWrappedField('Autorización:', authSummary, 34);
    }
    currentY += 2;

    // Section 3: Seguimiento y Resultados
    drawSectionHeader('3. RESULTADOS PEDAGÓGICOS Y SEGUIMIENTO DEL DOCENTE');
    if (asesoria.seguimiento) {
      drawWrappedField('Temas Trabajados:', asesoria.seguimiento.temasTrabajados, 40);
      drawWrappedField('Dificultades:', asesoria.seguimiento.dificultadesDetectadas, 40);
      drawWrappedField('Actividades:', asesoria.seguimiento.actividadesRealizadas, 40);
      drawWrappedField('Recomendaciones:', asesoria.seguimiento.recomendaciones, 40);
      drawTwoColumnRow(
        'Resultado:',
        asesoria.seguimiento.resultado.toUpperCase().replace('_', ' '),
        'Nueva asesoría:',
        asesoria.seguimiento.requiereNuevaAsesoria ? 'SÍ (Programar refuerzo)' : 'NO'
      );
      drawWrappedField('Fecha Seguimiento:', asesoria.seguimiento.fechaSeguimiento || 'N/A', 40);
      if (asesoria.seguimiento.evidencias && asesoria.seguimiento.evidencias.length > 0) {
        const evidenciasText = asesoria.seguimiento.evidencias
          .map(e => `${e.nombre}${e.tamanio ? ` (${e.tamanio})` : ''}`)
          .join(', ');
        drawWrappedField('Evidencias:', evidenciasText, 40);
      }
    } else {
      ensureSpace(10);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'La asesoría aún no cuenta con registro de seguimiento por parte del docente asesor asignado.',
        marginX + 4,
        currentY
      );
      currentY += 8;
    }

    // Signatures Section (always keep together and clear of content)
    const neededSignSpace = 34;
    if (currentY + neededSignSpace > maxY) {
      drawPageFooter();
      doc.addPage();
      currentY = 30;
    }
    const signY = Math.max(currentY + 20, 224);
    doc.setDrawColor(148, 163, 184);
    doc.line(24, signY, 88, signY);
    doc.line(128, signY, 192, signY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('FIRMA DEL DOCENTE ASESOR', 56, signY + 5, { align: 'center' });
    doc.text('FIRMA DEL ALUMNO ASESORADO', 160, signY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(asesoria.docenteAsignadoNombre || 'Nombre y Firma', 56, signY + 9.5, { align: 'center', maxWidth: 66 });
    doc.text(asesoria.alumnoNombre, 160, signY + 9.5, { align: 'center', maxWidth: 66 });

    drawPageFooter();

    doc.save(`Ficha_Asesoria_${asesoria.folio}.pdf`);
  }
}
