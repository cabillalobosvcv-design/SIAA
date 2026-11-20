import { UserRole } from '../types/siaa';

export interface RoleHierarchyMeta {
  code: UserRole;
  nivel: number;
  label: string;
  shortLabel: string;
  portalTitle: string;
  badgeClass: string;
  headerBadgeClass: string;
  description: string;
  funciones: string[];
}

export const ROLE_HIERARCHY: RoleHierarchyMeta[] = [
  {
    code: 'admin',
    nivel: 1,
    label: 'Administrador',
    shortLabel: 'Administrador',
    portalTitle: 'Administración Central',
    badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
    headerBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    description: 'Máxima autoridad operativa y técnica del sistema SIAA.',
    funciones: [
      'Gestión integral de usuarios y niveles jerárquicos',
      'Administración de catálogos académicos y carga masiva',
      'Auditoría, reportes globales y configuración institucional',
      'Autorización, asignación, seguimiento y cierre de asesorías'
    ]
  },
  {
    code: 'director',
    nivel: 2,
    label: 'Director Académico',
    shortLabel: 'Director Acad.',
    portalTitle: 'Dirección Académica',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    headerBadgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    description: 'Supervisión académica global de todas las carreras y programas.',
    funciones: [
      'Supervisión de indicadores y métricas institucionales',
      'Autorización y rechazo de solicitudes de asesoría',
      'Asignación de docentes, horarios y espacios físicos',
      'Cierre oficial de expedientes y generación de reportes'
    ]
  },
  {
    code: 'jefe_carrera',
    nivel: 3,
    label: 'Jefe de Carrera',
    shortLabel: 'Jefe de Carrera',
    portalTitle: 'Jefatura de Carrera',
    badgeClass: 'bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-800',
    headerBadgeClass: 'bg-teal-500/20 text-teal-200 border-teal-400/40',
    description: 'Coordinación y seguimiento académico de su programa educativo adscrito.',
    funciones: [
      'Autorización y seguimiento de solicitudes de su carrera',
      'Asignación de profesores tutores, PA o administrativos docentes',
      'Consulta de disponibilidad docente y calendario de carrera',
      'Reportes de cumplimiento y cierre de asesorías de su área'
    ]
  },
  {
    code: 'ptc_tutor',
    nivel: 4,
    label: 'Profesor de Tiempo Completo (Tutor)',
    shortLabel: 'PTC (Tutor)',
    portalTitle: 'Portal PTC / Tutor',
    badgeClass: 'bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
    headerBadgeClass: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    description: 'Docente de planta con funciones de asesoría disciplinar y tutoría grupal.',
    funciones: [
      'Configuración de disponibilidad horaria de tutoría y asesoría',
      'Canalización y registro de solicitudes para alumnos tutorados',
      'Atención de sesiones y registro de seguimiento pedagógico',
      'Consulta de calendario e historial de asesorías impartidas'
    ]
  },
  {
    code: 'pa',
    nivel: 5,
    label: 'Profesor de Asignatura (PA)',
    shortLabel: 'Prof. Asignatura (PA)',
    portalTitle: 'Portal Docente (PA)',
    badgeClass: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800',
    headerBadgeClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    description: 'Catedrático especializado en asesorías académicas por asignatura.',
    funciones: [
      'Registro de bloques horarios de disponibilidad docente',
      'Atención de asesorías académicas asignadas en sus materias',
      'Registro de seguimiento pedagógico y evidencias de sesión',
      'Consulta de calendario e historial de sesiones atendidas'
    ]
  },
  {
    code: 'administrativo_docente',
    nivel: 6,
    label: 'Administrativo con Función Docente',
    shortLabel: 'Admin. Docente',
    portalTitle: 'Administrativo Docente',
    badgeClass: 'bg-violet-100 dark:bg-violet-950/70 text-violet-900 dark:text-violet-300 border border-violet-300 dark:border-violet-800',
    headerBadgeClass: 'bg-violet-500/20 text-violet-200 border-violet-400/40',
    description: 'Personal administrativo habilitado para impartir asesorías y apoyar gestión operativa.',
    funciones: [
      'Configuración de disponibilidad e impartición de asesorías',
      'Registro de solicitudes en apoyo a estudiantes y seguimiento',
      'Consulta operativa de solicitudes, calendario e historial',
      'Emisión de fichas oficiales y seguimiento de sesiones asignadas'
    ]
  },
  {
    code: 'alumno',
    nivel: 7,
    label: 'Alumno',
    shortLabel: 'Alumno',
    portalTitle: 'Portal del Estudiante',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    headerBadgeClass: 'bg-slate-500/20 text-slate-200 border-slate-400/40',
    description: 'Estudiante inscrito con acceso a solicitud y seguimiento de asesorías.',
    funciones: [
      'Generación de solicitudes de asesoría académica',
      'Modificación o cancelación de solicitudes pendientes',
      'Consulta de horarios asignados en calendario personal',
      'Descarga de fichas oficiales y revisión de recomendaciones'
    ]
  }
];

export const ROLE_META_MAP: Record<UserRole, RoleHierarchyMeta> = ROLE_HIERARCHY.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<UserRole, RoleHierarchyMeta>
);

/**
 * Normalizes legacy role codes (e.g. 'docente') or friendly names to canonical UserRole.
 */
export function normalizeUserRole(raw?: string | null): UserRole {
  const clean = (raw || '').trim().toLowerCase();
  if (clean === 'admin' || clean === 'administrador') return 'admin';
  if (clean === 'director' || clean === 'director academico' || clean === 'director académico') return 'director';
  if (clean === 'jefe_carrera' || clean === 'jefe de carrera' || clean === 'jefes de carrera') return 'jefe_carrera';
  if (
    clean === 'ptc_tutor' ||
    clean === 'ptc' ||
    clean === 'tutor' ||
    clean === 'docente' ||
    clean === 'profesor de tiempo completo' ||
    clean === 'profesor de tiempo completo (tutor)'
  ) {
    return 'ptc_tutor';
  }
  if (clean === 'pa' || clean === 'profesor de asignatura' || clean === 'profesor de asignatura (pa)') return 'pa';
  if (
    clean === 'administrativo_docente' ||
    clean === 'administrativo con funcion docente' ||
    clean === 'administrativo con función docente' ||
    clean === 'administrativos con funcion de docentes' ||
    clean === 'administrativos con función de docentes'
  ) {
    return 'administrativo_docente';
  }
  return 'alumno';
}

export function getRoleMeta(role?: UserRole | string | null): RoleHierarchyMeta {
  const normalized = normalizeUserRole(role);
  return ROLE_META_MAP[normalized];
}

export function getRoleLabel(role?: UserRole | string | null): string {
  return getRoleMeta(role).label;
}

/** True for any role with teaching / advisory delivery duties */
export function isTeachingRole(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'ptc_tutor' || r === 'pa' || r === 'administrativo_docente';
}

/** True for academic leadership & system administration */
export function isCoordinationOrAdminRole(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'admin' || r === 'director' || r === 'jefe_carrera';
}

/** True if role can authorize/reject requests and assign teachers/classrooms */
export function canAuthorizeOrAssign(role?: UserRole | string | null): boolean {
  return isCoordinationOrAdminRole(role);
}

/** True if role can register/edit pedagogical follow-up */
export function canRegisterSeguimiento(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'admin' || isTeachingRole(r);
}

/** True if role can create/channel advisory requests on behalf of students */
export function canCreateSolicitudForStudents(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'admin' || r === 'director' || r === 'jefe_carrera' || r === 'ptc_tutor' || r === 'administrativo_docente';
}

/** True if role has access to institutional reports */
export function canAccessReports(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'admin' || r === 'director' || r === 'jefe_carrera';
}

/** True if role needs carreraId linkage in user profiles */
export function roleUsesCareerAssignment(role?: UserRole | string | null): boolean {
  const r = normalizeUserRole(role);
  return r === 'alumno' || r === 'jefe_carrera' || r === 'ptc_tutor' || r === 'pa' || r === 'director';
}
