import * as XLSX from 'xlsx';
import { SIAADataService, normalizePeriodoAndAnio } from './siaaService';
import {
  Aula,
  Carrera,
  Cuatrimestre,
  DisponibilidadEspecifica,
  Grupo,
  Materia,
  Modalidad,
  User,
  UserRole,
  UserStatus
} from '../types/siaa';
import { isTeachingRole, normalizeUserRole, getUserCarreraIds } from '../utils/roles';

export type BulkEntityType =
  | 'usuarios'
  | 'carreras'
  | 'materias'
  | 'grupos'
  | 'cuatrimestres'
  | 'aulas'
  | 'disponibilidad';

export interface BulkColumnSpec {
  key: string;
  label: string;
  required: boolean;
  type: string;
  example: string;
  allowedValues?: string;
  description: string;
}

export interface BulkEntitySpec {
  id: BulkEntityType;
  title: string;
  shortLabel: string;
  subtitle: string;
  filenameBase: string;
  upsertKeyLabel: string;
  columns: BulkColumnSpec[];
  sampleRows: Record<string, string | number>[];
}

export interface ParsedBulkRow {
  rowNumber: number;
  action: 'create' | 'update' | 'error';
  errors: string[];
  identifier: string;
  summary: string;
  data: Record<string, string>;
}

export interface ParsedBulkResult {
  fileName: string;
  entityType: BulkEntityType;
  totalRows: number;
  createCount: number;
  updateCount: number;
  errorCount: number;
  missingColumns: string[];
  rows: ParsedBulkRow[];
}

export interface BulkImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export const BULK_ENTITY_SPECS: Record<BulkEntityType, BulkEntitySpec> = {
  usuarios: {
    id: 'usuarios',
    title: 'Usuarios Institucionales',
    shortLabel: 'Usuarios',
    subtitle: 'Alta o actualización masiva de alumnos, docentes, directivos y administradores.',
    filenameBase: 'Plantilla_SIAA_Usuarios',
    upsertKeyLabel: 'correo (si el correo ya existe se actualiza el usuario; si es nuevo se crea)',
    columns: [
      {
        key: 'correo',
        label: 'Correo Institucional',
        required: true,
        type: 'Texto (Email)',
        example: 'maria.lopez@alumno.siaa.edu.mx',
        description: 'Identificador único del usuario utilizado para crear o actualizar el registro.'
      },
      {
        key: 'nombre',
        label: 'Nombre(s)',
        required: true,
        type: 'Texto',
        example: 'María Fernanda',
        description: 'Nombre(s) propios del usuario.'
      },
      {
        key: 'apellidoPaterno',
        label: 'Apellido Paterno',
        required: true,
        type: 'Texto',
        example: 'López',
        description: 'Primer apellido.'
      },
      {
        key: 'apellidoMaterno',
        label: 'Apellido Materno',
        required: false,
        type: 'Texto',
        example: 'Hernández',
        description: 'Segundo apellido (opcional).'
      },
      {
        key: 'rol',
        label: 'Rol / Nivel Jerárquico',
        required: true,
        type: 'Lista',
        example: 'ptc_tutor',
        allowedValues: 'admin | director | jefe_carrera | ptc_tutor | pa | administrativo_docente | alumno',
        description: 'Nivel jerárquico dentro de SIAA.'
      },
      {
        key: 'matricula',
        label: 'Matrícula',
        required: false,
        type: 'Texto',
        example: '2026-SW0105',
        description: 'Requerido o recomendado cuando rol = alumno.'
      },
      {
        key: 'numeroEmpleado',
        label: 'No. Empleado',
        required: false,
        type: 'Texto',
        example: 'PTC-209',
        description: 'Recomendado para personal directivo, jefes de carrera, docentes y administrativos.'
      },
      {
        key: 'telefono',
        label: 'Teléfono',
        required: false,
        type: 'Texto',
        example: '55-1234-5678',
        description: 'Número de contacto institucional o personal.'
      },
      {
        key: 'carreraCodigo',
        label: 'Código(s) de Carrera',
        required: false,
        type: 'Código(s)',
        example: 'ITIDS, IIGP',
        description: 'Uno o varios códigos de carrera existentes separados por coma (ej. ITIDS o ITIDS, IIGP).'
      },
      {
        key: 'grupoNombre',
        label: 'Nombre de Grupo',
        required: false,
        type: 'Texto',
        example: 'SW-101',
        description: 'Grupo escolar asignado (para alumnos, ej. SW-101).'
      },
      {
        key: 'cuatrimestreNumero',
        label: 'Cuatrimestre (Número)',
        required: false,
        type: 'Número',
        example: '1',
        description: 'Número de cuatrimestre (ej. 1, 2, 3...).'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus de la cuenta (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        correo: 'carlos.ramirez@alumno.siaa.edu.mx',
        nombre: 'Carlos Alberto',
        apellidoPaterno: 'Ramírez',
        apellidoMaterno: 'Torres',
        rol: 'alumno',
        matricula: '2026-SW0110',
        numeroEmpleado: '',
        telefono: '55-4321-8765',
        carreraCodigo: 'ITIDS',
        grupoNombre: 'SW-101',
        cuatrimestreNumero: 1,
        estado: 'activo'
      },
      {
        correo: 'elena.vega@siaa.edu.mx',
        nombre: 'Elena',
        apellidoPaterno: 'Vega',
        apellidoMaterno: 'Campos',
        rol: 'ptc_tutor',
        matricula: '',
        numeroEmpleado: 'PTC-206',
        telefono: '55-9870-1122',
        carreraCodigo: 'ITIDS, IIGP',
        grupoNombre: '',
        cuatrimestreNumero: '',
        estado: 'activo'
      }
    ]
  },

  carreras: {
    id: 'carreras',
    title: 'Carreras y Programas Educativos',
    shortLabel: 'Carreras',
    subtitle: 'Registro o actualización masiva de programas académicos.',
    filenameBase: 'Plantilla_SIAA_Carreras',
    upsertKeyLabel: 'codigo (si el código existe se actualiza; si es nuevo se crea)',
    columns: [
      {
        key: 'codigo',
        label: 'Código de Carrera',
        required: true,
        type: 'Texto',
        example: 'IMEC',
        description: 'Siglas o clave única de la carrera (se convierte a mayúsculas).'
      },
      {
        key: 'nombre',
        label: 'Nombre Oficial',
        required: true,
        type: 'Texto',
        example: 'Ingeniería Mecatrónica',
        description: 'Nombre completo del programa educativo.'
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        required: false,
        type: 'Texto',
        example: 'Automatización, robótica y sistemas embebidos.',
        description: 'Descripción general de la carrera.'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus en catálogo (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        codigo: 'IMEC',
        nombre: 'Ingeniería en Mecatrónica y Automatización',
        descripcion: 'Diseño de sistemas robóticos, control industrial y electrónica aplicada.',
        estado: 'activo'
      }
    ]
  },

  materias: {
    id: 'materias',
    title: 'Materias y Asignaturas',
    shortLabel: 'Materias',
    subtitle: 'Carga o actualización masiva de asignaturas por carrera y cuatrimestre.',
    filenameBase: 'Plantilla_SIAA_Materias',
    upsertKeyLabel: 'codigo (si el código de materia existe se actualiza; si es nuevo se crea)',
    columns: [
      {
        key: 'codigo',
        label: 'Código de Materia',
        required: true,
        type: 'Texto',
        example: 'MAT-202',
        description: 'Clave institucional única de la materia.'
      },
      {
        key: 'nombre',
        label: 'Nombre de la Materia',
        required: true,
        type: 'Texto',
        example: 'Álgebra Lineal Aplicada',
        description: 'Nombre oficial de la asignatura.'
      },
      {
        key: 'carreraCodigo',
        label: 'Código de Carrera',
        required: true,
        type: 'Código',
        example: 'ITIDS',
        description: 'Código de una carrera existente en el catálogo (ej. ITIDS, IIGP).'
      },
      {
        key: 'cuatrimestreNumero',
        label: 'Cuatrimestre (Número)',
        required: true,
        type: 'Número',
        example: '2',
        description: 'Número de cuatrimestre existente (ej. 1, 2, 3, 4).'
      },
      {
        key: 'horasSemanales',
        label: 'Horas Semanales',
        required: false,
        type: 'Número',
        example: '5',
        description: 'Cantidad de horas por semana (por defecto: 4).'
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        required: false,
        type: 'Texto',
        example: 'Espacios vectoriales, matrices y transformaciones lineales.',
        description: 'Resumen temático de la asignatura.'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus en catálogo (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        codigo: 'MAT-202',
        nombre: 'Álgebra Lineal Aplicada',
        carreraCodigo: 'ITIDS',
        cuatrimestreNumero: 2,
        horasSemanales: 5,
        descripcion: 'Matrices, determinantes, espacios vectoriales y valores propios.',
        estado: 'activo'
      },
      {
        codigo: 'FIS-201',
        nombre: 'Termodinámica Industrial',
        carreraCodigo: 'IIGP',
        cuatrimestreNumero: 2,
        horasSemanales: 4,
        descripcion: 'Leyes de la termodinámica y transferencia de calor.',
        estado: 'activo'
      }
    ]
  },

  grupos: {
    id: 'grupos',
    title: 'Grupos Escolares',
    shortLabel: 'Grupos',
    subtitle: 'Alta o actualización masiva de grupos académicos.',
    filenameBase: 'Plantilla_SIAA_Grupos',
    upsertKeyLabel: 'nombre (si el nombre del grupo existe se actualiza; si es nuevo se crea)',
    columns: [
      {
        key: 'nombre',
        label: 'Nombre del Grupo',
        required: true,
        type: 'Texto',
        example: 'SW-201',
        description: 'Identificador único del grupo (ej. SW-101, SW-201).'
      },
      {
        key: 'carreraCodigo',
        label: 'Código de Carrera',
        required: true,
        type: 'Código',
        example: 'ITIDS',
        description: 'Código de la carrera adscrita (ej. ITIDS, IIGP).'
      },
      {
        key: 'cuatrimestreNumero',
        label: 'Cuatrimestre (Número)',
        required: true,
        type: 'Número',
        example: '2',
        description: 'Número de cuatrimestre existente.'
      },
      {
        key: 'turno',
        label: 'Turno',
        required: true,
        type: 'Lista',
        example: 'matutino',
        allowedValues: 'matutino | vespertino | mixto',
        description: 'Horario del grupo escolar.'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus en catálogo (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        nombre: 'SW-201',
        carreraCodigo: 'ITIDS',
        cuatrimestreNumero: 2,
        turno: 'matutino',
        estado: 'activo'
      },
      {
        nombre: 'IND-201',
        carreraCodigo: 'IIGP',
        cuatrimestreNumero: 2,
        turno: 'vespertino',
        estado: 'activo'
      }
    ]
  },

  cuatrimestres: {
    id: 'cuatrimestres',
    title: 'Cuatrimestres y Periodos',
    shortLabel: 'Cuatrimestres',
    subtitle: 'Alta o actualización de niveles cuatrimestrales y periodos oficiales.',
    filenameBase: 'Plantilla_SIAA_Cuatrimestres',
    upsertKeyLabel: 'numero (si el nivel numérico existe se actualiza; si es nuevo se crea)',
    columns: [
      {
        key: 'numero',
        label: 'Número / Nivel',
        required: true,
        type: 'Número',
        example: '5',
        description: 'Nivel numérico del cuatrimestre (1 a 15).'
      },
      {
        key: 'nombre',
        label: 'Nombre Oficial',
        required: true,
        type: 'Texto',
        example: '5° Cuatrimestre',
        description: 'Etiqueta del cuatrimestre.'
      },
      {
        key: 'periodo',
        label: 'Periodo Oficial',
        required: true,
        type: 'Lista',
        example: 'Sep-Dic',
        allowedValues: 'Sep-Dic | Ene-Abr | May-Ago',
        description: 'Periodo cuatrimestral oficial (Sep-Dic, Ene-Abr o May-Ago).'
      },
      {
        key: 'anio',
        label: 'Año',
        required: true,
        type: 'Número',
        example: '2026',
        description: 'Año correspondiente al registro (ej. 2026).'
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        required: false,
        type: 'Texto',
        example: 'Quinto Cuatrimestre (Estancia I)',
        description: 'Detalle opcional del nivel.'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus en catálogo (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        numero: 5,
        nombre: '5° Cuatrimestre',
        periodo: 'Sep-Dic',
        anio: 2026,
        descripcion: 'Quinto Cuatrimestre (Integración Profesional)',
        estado: 'activo'
      }
    ]
  },

  aulas: {
    id: 'aulas',
    title: 'Aulas y Espacios Físicos',
    shortLabel: 'Aulas',
    subtitle: 'Carga o actualización masiva de salones, laboratorios y cubículos.',
    filenameBase: 'Plantilla_SIAA_Aulas',
    upsertKeyLabel: 'nombre (si el nombre del aula existe se actualiza; si es nuevo se crea)',
    columns: [
      {
        key: 'nombre',
        label: 'Nombre del Aula / Espacio',
        required: true,
        type: 'Texto',
        example: 'Aula 205',
        description: 'Nombre identificador único del espacio.'
      },
      {
        key: 'edificio',
        label: 'Edificio',
        required: true,
        type: 'Texto',
        example: 'Edificio B - Tecnologías',
        description: 'Edificio o torre donde se ubica.'
      },
      {
        key: 'capacidad',
        label: 'Capacidad',
        required: true,
        type: 'Número',
        example: '30',
        description: 'Cupo máximo de estudiantes (1 a 500).'
      },
      {
        key: 'tipo',
        label: 'Tipo de Espacio',
        required: true,
        type: 'Texto',
        example: 'Aula Teórica',
        description: 'Ej. aula, sala_computo, laboratorio, taller, Aula Teórica.'
      },
      {
        key: 'ubicacion',
        label: 'Ubicación / Piso',
        required: false,
        type: 'Texto',
        example: 'Segundo Piso',
        description: 'Referencia interna de piso o ala.'
      },
      {
        key: 'estado',
        label: 'Estado',
        required: false,
        type: 'Lista',
        example: 'activo',
        allowedValues: 'activo | inactivo',
        description: 'Estatus en catálogo (por defecto: activo).'
      }
    ],
    sampleRows: [
      {
        nombre: 'Laboratorio de Software 4',
        edificio: 'Edificio B - Tecnologías',
        capacidad: 28,
        tipo: 'sala_computo',
        ubicacion: 'Segundo Piso',
        estado: 'activo'
      }
    ]
  },

  disponibilidad: {
    id: 'disponibilidad',
    title: 'Disponibilidad Docente (Calendario por Día y Mes)',
    shortLabel: 'Disponibilidad',
    subtitle: 'Carga simple por día y mes del calendario para registrar o actualizar horarios de asesoría.',
    filenameBase: 'Plantilla_SIAA_Disponibilidad_Calendario',
    upsertKeyLabel: 'correoDocente + día + mes + año + horaInicio (actualiza si coincide; crea si es nuevo)',
    columns: [
      {
        key: 'correoDocente',
        label: 'Correo del Docente',
        required: true,
        type: 'Correo electrónico',
        example: 'fernando.aguirre@siaa.edu.mx',
        description: 'Correo del docente registrado en el sistema.'
      },
      {
        key: 'dia',
        label: 'Día',
        required: true,
        type: 'Número (1-31)',
        example: '22',
        description: 'Día del mes en el calendario (ejemplo: 15 o 22).'
      },
      {
        key: 'mes',
        label: 'Mes',
        required: true,
        type: 'Número o Nombre',
        example: 'Septiembre',
        allowedValues: '1-12 o Enero..Diciembre',
        description: 'Mes del calendario (ejemplo: 9, 09 o Septiembre).'
      },
      {
        key: 'anio',
        label: 'Año',
        required: false,
        type: 'Año (4 dígitos)',
        example: '2026',
        description: 'Opcional. Si se deja vacío se usa el año actual.'
      },
      {
        key: 'horaInicio',
        label: 'Hora Inicio',
        required: true,
        type: 'Hora 24h (HH:mm)',
        example: '10:00',
        description: 'Hora de inicio en formato 24h (ejemplo: 09:00, 14:30).'
      },
      {
        key: 'horaFin',
        label: 'Hora Fin',
        required: true,
        type: 'Hora 24h (HH:mm)',
        example: '12:00',
        description: 'Hora de término, debe ser mayor a Hora Inicio.'
      },
      {
        key: 'modalidad',
        label: 'Modalidad',
        required: false,
        type: 'Lista',
        example: 'presencial',
        allowedValues: 'presencial | virtual | hibrida',
        description: 'Opcional (por defecto: presencial).'
      },
      {
        key: 'cupo',
        label: 'Cupo',
        required: false,
        type: 'Número (1-30)',
        example: '4',
        description: 'Cantidad de alumnos por horario (opcional, por defecto: 4).'
      }
    ],
    sampleRows: [
      {
        correoDocente: 'fernando.aguirre@siaa.edu.mx',
        dia: 22,
        mes: 'Septiembre',
        anio: 2026,
        horaInicio: '10:00',
        horaFin: '12:00',
        modalidad: 'presencial',
        cupo: 4
      },
      {
        correoDocente: 'lorena.mendez@siaa.edu.mx',
        dia: 24,
        mes: 9,
        anio: 2026,
        horaInicio: '16:00',
        horaFin: '17:30',
        modalidad: 'virtual',
        cupo: 3
      }
    ]
  }
};

function normalizeKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '');
}

function normalizeText(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function normalizeTimeValue(val: unknown): string {
  if (typeof val === 'number' && !isNaN(val) && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
  const str = normalizeText(val);
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return str;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return str;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

function normalizeMonthNumber(val: string): number | null {
  const raw = val
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!raw) return null;

  if (/^\d{1,2}$/.test(raw)) {
    const n = Number(raw);
    return n >= 1 && n <= 12 ? n : null;
  }

  const map: Record<string, number> = {
    ene: 1, enero: 1,
    feb: 2, febrero: 2,
    mar: 3, marzo: 3,
    abr: 4, abril: 4,
    may: 5, mayo: 5,
    jun: 6, junio: 6,
    jul: 7, julio: 7,
    ago: 8, agosto: 8,
    sep: 9, sept: 9, septiembre: 9, setiembre: 9,
    oct: 10, octubre: 10,
    nov: 11, noviembre: 11,
    dic: 12, diciembre: 12
  };
  return map[raw] ?? null;
}

function parseExcelOrTextFecha(val: unknown): { dia: string; mes: string; anio: string } | null {
  if (typeof val === 'number' && !isNaN(val) && val > 20000) {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return {
        dia: String(parsed.d),
        mes: String(parsed.m),
        anio: String(parsed.y)
      };
    }
  }
  const str = normalizeText(val);
  if (!str) return null;

  // YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return { anio: match[1], mes: match[2], dia: match[3] };
  }
  // DD/MM/YYYY or DD-MM-YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    return { dia: match[1], mes: match[2], anio: match[3] };
  }
  return null;
}

function validateAndBuildCalendarDate(
  diaRaw: string,
  mesRaw: string,
  anioRaw: string
): { fecha: string | null; label: string; error?: string } {
  const defaultYear = new Date().getFullYear();
  const anio = anioRaw.trim() ? Number(anioRaw.trim()) : defaultYear;
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    return { fecha: null, label: '--', error: `Año inválido "${anioRaw}" (use 4 dígitos, ej. ${defaultYear})` };
  }

  const mes = normalizeMonthNumber(mesRaw);
  if (!mes) {
    return { fecha: null, label: '--', error: `Mes inválido "${mesRaw || ''}" (use 1-12 o Enero..Diciembre)` };
  }

  const dia = Number(diaRaw.trim());
  if (!diaRaw.trim() || !Number.isInteger(dia) || dia < 1 || dia > 31) {
    return { fecha: null, label: '--', error: `Día inválido "${diaRaw || ''}" (use número del 1 al 31)` };
  }

  const testDate = new Date(anio, mes - 1, dia);
  if (
    testDate.getFullYear() !== anio ||
    testDate.getMonth() !== mes - 1 ||
    testDate.getDate() !== dia
  ) {
    return {
      fecha: null,
      label: '--',
      error: `Fecha inexistente: el día ${dia} no corresponde a ${MONTH_NAMES_ES[mes - 1]} ${anio}`
    };
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const fecha = `${anio}-${pad(mes)}-${pad(dia)}`;
  const label = `${pad(dia)}/${MONTH_NAMES_ES[mes - 1].slice(0, 3)}/${anio}`;
  return { fecha, label };
}

function normalizeEstado(val: string): UserStatus | null {
  if (!val) return 'activo';
  const clean = val.trim().toLowerCase();
  if (clean === 'activo' || clean === 'activa' || clean === '1' || clean === 'si' || clean === 'sí') return 'activo';
  if (clean === 'inactivo' || clean === 'inactiva' || clean === '0' || clean === 'no') return 'inactivo';
  return null;
}

function getCurrentExportRows(type: BulkEntityType): Record<string, string | number>[] {
  const carreras = SIAADataService.getCarreras();
  const cuatrimestres = SIAADataService.getCuatrimestres();
  const grupos = SIAADataService.getGrupos();
  const users = SIAADataService.getUsers();

  switch (type) {
    case 'usuarios':
      return users.map(u => {
        const carreraCodes = getUserCarreraIds(u)
          .map(cid => carreras.find(c => c.id === cid)?.codigo)
          .filter(Boolean)
          .join(', ');
        const grup = grupos.find(g => g.id === u.grupoId);
        const cuat = cuatrimestres.find(cu => cu.id === u.cuatrimestreId);
        return {
          correo: u.correo,
          nombre: u.nombre,
          apellidoPaterno: u.apellidoPaterno,
          apellidoMaterno: u.apellidoMaterno || '',
          rol: u.rol,
          matricula: u.matricula || '',
          numeroEmpleado: u.numeroEmpleado || '',
          telefono: u.telefono || '',
          carreraCodigo: carreraCodes,
          grupoNombre: grup?.nombre || '',
          cuatrimestreNumero: cuat?.numero ?? '',
          estado: u.estado
        };
      });
    case 'carreras':
      return carreras.map(c => ({
        codigo: c.codigo,
        nombre: c.nombre,
        descripcion: c.descripcion || '',
        estado: c.estado
      }));
    case 'materias':
      return SIAADataService.getMaterias().map(m => {
        const carr = carreras.find(c => c.id === m.carreraId);
        const cuat = cuatrimestres.find(cu => cu.id === m.cuatrimestreId);
        return {
          codigo: m.codigo,
          nombre: m.nombre,
          carreraCodigo: carr?.codigo || '',
          cuatrimestreNumero: cuat?.numero ?? m.cuatrimestreNumero ?? 1,
          horasSemanales: m.horasSemanales ?? 4,
          descripcion: m.descripcion || '',
          estado: m.estado
        };
      });
    case 'grupos':
      return grupos.map(g => {
        const carr = carreras.find(c => c.id === g.carreraId);
        const cuat = cuatrimestres.find(cu => cu.id === g.cuatrimestreId);
        return {
          nombre: g.nombre,
          carreraCodigo: carr?.codigo || '',
          cuatrimestreNumero: cuat?.numero ?? g.cuatrimestreNumero ?? 1,
          turno: g.turno,
          estado: g.estado
        };
      });
    case 'cuatrimestres':
      return cuatrimestres.map(cu => ({
        numero: cu.numero,
        nombre: cu.nombre || `${cu.numero}° Cuatrimestre`,
        periodo: cu.periodo || 'Sep-Dic',
        anio: cu.anio || new Date().getFullYear(),
        descripcion: cu.descripcion || '',
        estado: cu.estado
      }));
    case 'aulas':
      return SIAADataService.getAulas().map(a => ({
        nombre: a.nombre,
        edificio: a.edificio,
        capacidad: a.capacidad,
        tipo: a.tipo,
        ubicacion: a.ubicacion || '',
        estado: a.estado
      }));
    case 'disponibilidad':
      return SIAADataService.getDisponibilidadesEspecificas().map(d => {
        const doc = users.find(u => u.uid === d.docenteId);
        const [anioStr, mesStr, diaStr] = (d.fecha || '').split('-');
        const mesNum = Number(mesStr);
        const mesLabel = mesNum >= 1 && mesNum <= 12 ? MONTH_NAMES_ES[mesNum - 1] : mesStr || '';
        return {
          correoDocente: doc?.correo || '',
          dia: diaStr ? Number(diaStr) : '',
          mes: mesLabel,
          anio: anioStr ? Number(anioStr) : '',
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          modalidad: d.modalidad || 'presencial',
          cupo: d.cupoMaximo ?? 4
        };
      });
  }
}

export function downloadBulkTemplateXLSX(type: BulkEntityType, includeCurrentData: boolean): void {
  const spec = BULK_ENTITY_SPECS[type];
  const headers = spec.columns.map(c => c.key);
  const sourceRows = includeCurrentData ? getCurrentExportRows(type) : spec.sampleRows;

  const dataMatrix: (string | number)[][] = [
    headers,
    ...sourceRows.map(row => headers.map(h => (row[h] !== undefined && row[h] !== null ? row[h] : '')))
  ];

  const dataSheet = XLSX.utils.aoa_to_sheet(dataMatrix);
  dataSheet['!cols'] = headers.map((h, idx) => {
    const maxLen = Math.max(
      h.length,
      ...sourceRows.map(r => String(r[headers[idx]] ?? '').length),
      14
    );
    return { wch: Math.min(maxLen + 4, 42) };
  });

  const guideRows = [
    ['Columna (Encabezado Exacto)', 'Nombre Descriptivo', 'Obligatorio', 'Tipo', 'Valores Permitidos', 'Ejemplo', 'Descripción'],
    ...spec.columns.map(col => [
      col.key,
      col.label,
      col.required ? 'SÍ' : 'Opcional',
      col.type,
      col.allowedValues || 'Texto / Número libre',
      col.example,
      col.description
    ]),
    [],
    ['Regla de actualización', spec.upsertKeyLabel]
  ];
  const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 16 },
    { wch: 32 },
    { wch: 28 },
    { wch: 52 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos');
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Instrucciones');

  const suffix = includeCurrentData ? '_Con_Datos_Actuales' : '_Base';
  XLSX.writeFile(workbook, `${spec.filenameBase}${suffix}.xlsx`);
}

export function downloadBulkTemplateCSV(type: BulkEntityType, includeCurrentData: boolean): void {
  const spec = BULK_ENTITY_SPECS[type];
  const headers = spec.columns.map(c => c.key);
  const sourceRows = includeCurrentData ? getCurrentExportRows(type) : spec.sampleRows;

  const escapeCsv = (value: string | number): string => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCsv).join(','),
    ...sourceRows.map(row => headers.map(h => escapeCsv(row[h] ?? '')).join(','))
  ];

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const suffix = includeCurrentData ? '_Con_Datos_Actuales' : '_Base';
  link.href = url;
  link.setAttribute('download', `${spec.filenameBase}${suffix}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseAndValidateBulkFile(type: BulkEntityType, file: File): Promise<ParsedBulkResult> {
  const spec = BULK_ENTITY_SPECS[type];
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'datos') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  // Trim trailing completely empty rows
  const nonEmptyMatrix = rawMatrix.filter(
    row => Array.isArray(row) && row.some(cell => normalizeText(cell) !== '')
  );

  if (nonEmptyMatrix.length === 0) {
    return {
      fileName: file.name,
      entityType: type,
      totalRows: 0,
      createCount: 0,
      updateCount: 0,
      errorCount: 0,
      missingColumns: spec.columns.filter(c => c.required).map(c => c.key),
      rows: []
    };
  }

  const headerRow = nonEmptyMatrix[0].map(cell => normalizeText(cell));
  const normalizedToCanonical: Record<string, string> = {};
  spec.columns.forEach(c => {
    normalizedToCanonical[normalizeKey(c.key)] = c.key;
    normalizedToCanonical[normalizeKey(c.label)] = c.key;
  });

  if (type === 'disponibilidad') {
    normalizedToCanonical['docentecorreo'] = 'correoDocente';
    normalizedToCanonical['docente'] = 'correoDocente';
    normalizedToCanonical['correo'] = 'correoDocente';
    normalizedToCanonical['cupomaximo'] = 'cupo';
    normalizedToCanonical['cupos'] = 'cupo';
    normalizedToCanonical['ano'] = 'anio';
    normalizedToCanonical['fecha'] = 'fecha';
  }

  const colIndexMap: Record<string, number> = {};
  headerRow.forEach((rawCol, idx) => {
    const canonical = normalizedToCanonical[normalizeKey(rawCol)];
    if (canonical && colIndexMap[canonical] === undefined) {
      colIndexMap[canonical] = idx;
    }
  });

  const hasCombinedFecha = type === 'disponibilidad' && colIndexMap['fecha'] !== undefined;
  const missingColumns = spec.columns
    .filter(c => {
      if (!c.required) return false;
      if (hasCombinedFecha && (c.key === 'dia' || c.key === 'mes')) return false;
      return colIndexMap[c.key] === undefined;
    })
    .map(c => c.key);

  const existingUsers = SIAADataService.getUsers();
  const existingCarreras = SIAADataService.getCarreras();
  const existingMaterias = SIAADataService.getMaterias();
  const existingGrupos = SIAADataService.getGrupos();
  const existingCuatrimestres = SIAADataService.getCuatrimestres();
  const existingAulas = SIAADataService.getAulas();
  const existingDisp = SIAADataService.getDisponibilidadesEspecificas();

  const rows: ParsedBulkRow[] = [];

  for (let i = 1; i < nonEmptyMatrix.length; i++) {
    const rawRow = nonEmptyMatrix[i];
    const rowData: Record<string, string> = {};
    spec.columns.forEach(col => {
      const idx = colIndexMap[col.key];
      const cellVal = idx !== undefined ? rawRow[idx] : '';
      if (col.key === 'horaInicio' || col.key === 'horaFin') {
        rowData[col.key] = normalizeTimeValue(cellVal);
      } else {
        rowData[col.key] = normalizeText(cellVal);
      }
    });

    if (hasCombinedFecha && (!rowData.dia || !rowData.mes)) {
      const parsedFecha = parseExcelOrTextFecha(rawRow[colIndexMap['fecha']]);
      if (parsedFecha) {
        if (!rowData.dia) rowData.dia = parsedFecha.dia;
        if (!rowData.mes) rowData.mes = parsedFecha.mes;
        if (!rowData.anio) rowData.anio = parsedFecha.anio;
      }
    }

    const errors: string[] = [];
    let action: 'create' | 'update' | 'error' = 'create';
    let identifier = '';
    let summary = '';

    if (missingColumns.length > 0) {
      errors.push(`Faltan columnas obligatorias en el archivo: ${missingColumns.join(', ')}`);
    } else if (type === 'usuarios') {
      const correo = rowData.correo.toLowerCase();
      const rol = rowData.rol.toLowerCase();
      const estado = normalizeEstado(rowData.estado);

      if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        errors.push('Correo inválido u obligatorio');
      }
      if (!rowData.nombre) errors.push('Nombre obligatorio');
      if (!rowData.apellidoPaterno) errors.push('Apellido paterno obligatorio');
      const validRoles = [
        'admin',
        'administrador',
        'director',
        'director academico',
        'director académico',
        'jefe_carrera',
        'jefe de carrera',
        'jefes de carrera',
        'ptc_tutor',
        'ptc',
        'tutor',
        'docente',
        'profesor de tiempo completo',
        'profesor de tiempo completo (tutor)',
        'pa',
        'profesor de asignatura',
        'profesor de asignatura (pa)',
        'administrativo_docente',
        'administrativo con funcion docente',
        'administrativo con función docente',
        'alumno'
      ];
      if (!validRoles.includes(rol)) {
        errors.push('Rol inválido (use: admin, director, jefe_carrera, ptc_tutor, pa, administrativo_docente o alumno)');
      }
      if (!estado) errors.push('Estado inválido (use: activo o inactivo)');

      if (rowData.carreraCodigo) {
        const codes = rowData.carreraCodigo
          .split(/[,;|]+/)
          .map(c => c.trim().toUpperCase())
          .filter(Boolean);
        codes.forEach(code => {
          const carrMatch = existingCarreras.find(c => c.codigo.toUpperCase() === code);
          if (!carrMatch) errors.push(`Carrera "${code}" no existe`);
        });
      }
      if (rowData.grupoNombre) {
        const grupMatch = existingGrupos.find(g => g.nombre.toLowerCase() === rowData.grupoNombre.toLowerCase());
        if (!grupMatch) errors.push(`Grupo "${rowData.grupoNombre}" no existe`);
      }

      const exists = existingUsers.some(u => u.correo.toLowerCase() === correo);
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = rowData.correo || `Fila ${i + 1}`;
      summary = `${rowData.nombre} ${rowData.apellidoPaterno} (${rowData.rol || '--'})`;
    } else if (type === 'carreras') {
      const codigo = rowData.codigo.toUpperCase();
      const estado = normalizeEstado(rowData.estado);
      if (!codigo) errors.push('Código obligatorio');
      if (!rowData.nombre) errors.push('Nombre obligatorio');
      if (!estado) errors.push('Estado inválido (use: activo o inactivo)');

      const exists = existingCarreras.some(c => c.codigo.toUpperCase() === codigo);
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = codigo || `Fila ${i + 1}`;
      summary = rowData.nombre || '--';
    } else if (type === 'materias') {
      const codigo = rowData.codigo.toUpperCase();
      const cuatNum = Number(rowData.cuatrimestreNumero);
      const horas = rowData.horasSemanales ? Number(rowData.horasSemanales) : 4;
      const estado = normalizeEstado(rowData.estado);

      if (!codigo) errors.push('Código obligatorio');
      if (!rowData.nombre) errors.push('Nombre obligatorio');
      const carrMatch = existingCarreras.find(c => c.codigo.toUpperCase() === rowData.carreraCodigo.toUpperCase());
      if (!carrMatch) errors.push(`Código de carrera "${rowData.carreraCodigo || ''}" no encontrado`);
      const cuatMatch = existingCuatrimestres.find(cu => cu.numero === cuatNum);
      if (!cuatMatch) errors.push(`Cuatrimestre "${rowData.cuatrimestreNumero || ''}" no encontrado`);
      if (isNaN(horas) || horas < 1 || horas > 40) errors.push('Horas semanales inválidas');
      if (!estado) errors.push('Estado inválido (activo o inactivo)');

      const exists = existingMaterias.some(m => m.codigo.toUpperCase() === codigo);
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = codigo || `Fila ${i + 1}`;
      summary = `${rowData.nombre} (${rowData.carreraCodigo || '--'} • ${rowData.cuatrimestreNumero || '?'}°)`;
    } else if (type === 'grupos') {
      const cuatNum = Number(rowData.cuatrimestreNumero);
      const turno = rowData.turno.toLowerCase();
      const estado = normalizeEstado(rowData.estado);

      if (!rowData.nombre) errors.push('Nombre del grupo obligatorio');
      const carrMatch = existingCarreras.find(c => c.codigo.toUpperCase() === rowData.carreraCodigo.toUpperCase());
      if (!carrMatch) errors.push(`Carrera "${rowData.carreraCodigo || ''}" no encontrada`);
      const cuatMatch = existingCuatrimestres.find(cu => cu.numero === cuatNum);
      if (!cuatMatch) errors.push(`Cuatrimestre "${rowData.cuatrimestreNumero || ''}" no encontrado`);
      if (!['matutino', 'vespertino', 'mixto'].includes(turno)) {
        errors.push('Turno inválido (matutino, vespertino o mixto)');
      }
      if (!estado) errors.push('Estado inválido (activo o inactivo)');

      const exists = existingGrupos.some(g => g.nombre.toLowerCase() === rowData.nombre.toLowerCase());
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = rowData.nombre || `Fila ${i + 1}`;
      summary = `${rowData.carreraCodigo || '--'} • ${rowData.cuatrimestreNumero || '?'}° • ${rowData.turno || '--'}`;
    } else if (type === 'cuatrimestres') {
      const num = Number(rowData.numero);
      const estado = normalizeEstado(rowData.estado);
      const rawPeriodo = (rowData.periodo || '').trim();
      const rawAnio = (rowData.anio || '').trim();
      const cleanPeriodo = rawPeriodo.toLowerCase().replace(/\s+/g, '');
      const validPeriodo =
        !rawPeriodo ||
        cleanPeriodo.includes('sep') ||
        cleanPeriodo.includes('dic') ||
        cleanPeriodo.includes('ene') ||
        cleanPeriodo.includes('abr') ||
        cleanPeriodo.includes('may') ||
        cleanPeriodo.includes('ago');

      const parsedAnio = Number(rawAnio);
      const normalized = normalizePeriodoAndAnio(rawPeriodo, rawAnio);

      if (!rowData.numero || isNaN(num) || num < 1 || num > 15) {
        errors.push('Número debe estar entre 1 y 15');
      }
      if (!rowData.nombre) errors.push('Nombre obligatorio');
      if (!validPeriodo) errors.push('Periodo inválido (use Sep-Dic, Ene-Abr o May-Ago)');
      if (rawAnio && (isNaN(parsedAnio) || parsedAnio < 1990 || parsedAnio > 2100)) {
        errors.push('Año inválido (debe estar entre 1990 y 2100)');
      }
      if (!estado) errors.push('Estado inválido (activo o inactivo)');

      const exists = existingCuatrimestres.some(cu => cu.numero === num);
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = rowData.numero ? `${rowData.numero}°` : `Fila ${i + 1}`;
      summary = `${rowData.nombre} (${normalized.periodo} ${normalized.anio})`;
    } else if (type === 'aulas') {
      const cap = Number(rowData.capacidad);
      const estado = normalizeEstado(rowData.estado);

      if (!rowData.nombre) errors.push('Nombre de aula obligatorio');
      if (!rowData.edificio) errors.push('Edificio obligatorio');
      if (!rowData.tipo) errors.push('Tipo de espacio obligatorio');
      if (!rowData.capacidad || isNaN(cap) || cap < 1 || cap > 500) {
        errors.push('Capacidad debe ser número entre 1 y 500');
      }
      if (!estado) errors.push('Estado inválido (activo o inactivo)');

      const exists = existingAulas.some(a => a.nombre.toLowerCase() === rowData.nombre.toLowerCase());
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = rowData.nombre || `Fila ${i + 1}`;
      summary = `${rowData.edificio} • Cap. ${rowData.capacidad || '--'} (${rowData.tipo || '--'})`;
    } else if (type === 'disponibilidad') {
      const correo = rowData.correoDocente.toLowerCase();
      const docMatch = existingUsers.find(u => u.correo.toLowerCase() === correo && isTeachingRole(u.rol));
      const parsedDate = validateAndBuildCalendarDate(rowData.dia, rowData.mes, rowData.anio);
      const modalidad = (rowData.modalidad || 'presencial').toLowerCase();
      const cupo = rowData.cupo ? Number(rowData.cupo) : 4;

      if (!docMatch) errors.push(`Docente "${rowData.correoDocente || ''}" no encontrado o no tiene función docente`);
      if (parsedDate.error) errors.push(parsedDate.error);
      if (!isValidTime(rowData.horaInicio)) errors.push('Hora inicio inválida (use HH:mm, ej. 09:00)');
      if (!isValidTime(rowData.horaFin)) errors.push('Hora fin inválida (use HH:mm, ej. 10:00)');
      if (isValidTime(rowData.horaInicio) && isValidTime(rowData.horaFin) && rowData.horaInicio >= rowData.horaFin) {
        errors.push('Hora fin debe ser mayor a hora inicio');
      }
      if (!['presencial', 'virtual', 'hibrida'].includes(modalidad)) {
        errors.push('Modalidad inválida (presencial, virtual o hibrida)');
      }
      if (isNaN(cupo) || cupo < 1 || cupo > 30) errors.push('Cupo inválido (use número de 1 a 30)');

      if (parsedDate.fecha) {
        rowData.fechaIso = parsedDate.fecha;
      }

      const exists = !!docMatch && !!parsedDate.fecha && existingDisp.some(
        d => d.docenteId === docMatch.uid && d.fecha === parsedDate.fecha && d.horaInicio === rowData.horaInicio
      );
      action = errors.length > 0 ? 'error' : exists ? 'update' : 'create';
      identifier = `${rowData.correoDocente || '--'} (${parsedDate.label})`;
      summary = `${rowData.horaInicio || '--'}-${rowData.horaFin || '--'} • ${modalidad} • Cupo ${isNaN(cupo) ? '--' : cupo}`;
    }

    rows.push({
      rowNumber: i + 1,
      action,
      errors,
      identifier,
      summary,
      data: rowData
    });
  }

  return {
    fileName: file.name,
    entityType: type,
    totalRows: rows.length,
    createCount: rows.filter(r => r.action === 'create').length,
    updateCount: rows.filter(r => r.action === 'update').length,
    errorCount: rows.filter(r => r.action === 'error').length,
    missingColumns,
    rows
  };
}

export function applyBulkImport(
  type: BulkEntityType,
  parsedRows: ParsedBulkRow[],
  mode: 'upsert' | 'create_only',
  actor: User
): BulkImportSummary {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = parsedRows.filter(r => r.action === 'error').length;

  const validRows = parsedRows.filter(r => r.action !== 'error');
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const carreras = SIAADataService.getCarreras();
  const cuatrimestres = SIAADataService.getCuatrimestres();
  const grupos = SIAADataService.getGrupos();

  if (type === 'usuarios') {
    const list = [...SIAADataService.getUsers()];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const correo = d.correo.toLowerCase();
      const rol: UserRole = normalizeUserRole(d.rol);
      const estado = normalizeEstado(d.estado) || 'activo';
      const parsedCarreraIds = d.carreraCodigo
        ? Array.from(
            new Set(
              d.carreraCodigo
                .split(/[,;|]+/)
                .map(code => code.trim().toUpperCase())
                .filter(Boolean)
                .map(code => carreras.find(c => c.codigo.toUpperCase() === code)?.id)
                .filter((id): id is string => Boolean(id))
            )
          )
        : [];
      const grup = d.grupoNombre
        ? grupos.find(g => g.nombre.toLowerCase() === d.grupoNombre.toLowerCase())
        : undefined;
      const cuat = d.cuatrimestreNumero
        ? cuatrimestres.find(cu => cu.numero === Number(d.cuatrimestreNumero))
        : undefined;

      const existingIdx = list.findIndex(u => u.correo.toLowerCase() === correo);
      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        const prevIds = getUserCarreraIds(list[existingIdx]);
        const nextIds = parsedCarreraIds.length > 0
          ? (rol === 'alumno' ? [parsedCarreraIds[0]] : parsedCarreraIds)
          : prevIds;
        list[existingIdx] = {
          ...list[existingIdx],
          nombre: d.nombre,
          apellidoPaterno: d.apellidoPaterno,
          apellidoMaterno: d.apellidoMaterno || list[existingIdx].apellidoMaterno || '',
          rol,
          matricula: rol === 'alumno' ? d.matricula || list[existingIdx].matricula : undefined,
          numeroEmpleado: rol !== 'alumno' ? d.numeroEmpleado || list[existingIdx].numeroEmpleado : undefined,
          telefono: d.telefono || list[existingIdx].telefono,
          carreraId: nextIds[0],
          carrerasIds: nextIds,
          grupoId: rol === 'alumno' ? grup?.id ?? list[existingIdx].grupoId : undefined,
          cuatrimestreId: rol === 'alumno' ? cuat?.id ?? list[existingIdx].cuatrimestreId : undefined,
          estado,
          fechaActualizacion: todayFormatted
        };
        updated++;
      } else {
        const nextIds = rol === 'alumno' ? (parsedCarreraIds[0] ? [parsedCarreraIds[0]] : []) : parsedCarreraIds;
        const newUser: User = {
          uid: `user-bulk-${Date.now()}-${idx}`,
          nombre: d.nombre,
          apellidoPaterno: d.apellidoPaterno,
          apellidoMaterno: d.apellidoMaterno || '',
          correo: d.correo.trim(),
          rol,
          matricula: rol === 'alumno' ? d.matricula || undefined : undefined,
          numeroEmpleado: rol !== 'alumno' ? d.numeroEmpleado || undefined : undefined,
          telefono: d.telefono || undefined,
          carreraId: nextIds[0],
          carrerasIds: nextIds,
          grupoId: rol === 'alumno' ? grup?.id : undefined,
          cuatrimestreId: rol === 'alumno' ? cuat?.id : undefined,
          estado,
          fechaCreacion: todayFormatted,
          fechaActualizacion: todayFormatted
        };
        list.push(newUser);
        created++;
      }
    });
    SIAADataService.saveUsersBatch(list);
  } else if (type === 'carreras') {
    const list = [...carreras];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const codigo = d.codigo.toUpperCase();
      const estado = normalizeEstado(d.estado) || 'activo';
      const existingIdx = list.findIndex(c => c.codigo.toUpperCase() === codigo);

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          codigo,
          nombre: d.nombre,
          descripcion: d.descripcion || list[existingIdx].descripcion,
          estado
        };
        updated++;
      } else {
        const newCarr: Carrera = {
          id: `carr-bulk-${Date.now()}-${idx}`,
          codigo,
          nombre: d.nombre,
          descripcion: d.descripcion || undefined,
          estado,
          fechaCreacion: todayIso
        };
        list.push(newCarr);
        created++;
      }
    });
    SIAADataService.saveCarrerasBatch(list);
  } else if (type === 'materias') {
    const list = [...SIAADataService.getMaterias()];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const codigo = d.codigo.toUpperCase();
      const estado = normalizeEstado(d.estado) || 'activo';
      const carr = carreras.find(c => c.codigo.toUpperCase() === d.carreraCodigo.toUpperCase());
      const cuat = cuatrimestres.find(cu => cu.numero === Number(d.cuatrimestreNumero));
      const horas = d.horasSemanales ? Number(d.horasSemanales) : 4;
      const existingIdx = list.findIndex(m => m.codigo.toUpperCase() === codigo);

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          codigo,
          nombre: d.nombre,
          carreraId: carr?.id || list[existingIdx].carreraId,
          carreraNombre: carr?.nombre || list[existingIdx].carreraNombre,
          cuatrimestreId: cuat?.id || list[existingIdx].cuatrimestreId,
          cuatrimestreNumero: cuat?.numero || list[existingIdx].cuatrimestreNumero,
          horasSemanales: horas,
          descripcion: d.descripcion || list[existingIdx].descripcion,
          estado
        };
        updated++;
      } else {
        const newMat: Materia = {
          id: `mat-bulk-${Date.now()}-${idx}`,
          codigo,
          nombre: d.nombre,
          carreraId: carr?.id || '',
          carreraNombre: carr?.nombre || '',
          cuatrimestreId: cuat?.id || '',
          cuatrimestreNumero: cuat?.numero || 1,
          horasSemanales: horas,
          descripcion: d.descripcion || undefined,
          estado
        };
        list.push(newMat);
        created++;
      }
    });
    SIAADataService.saveMateriasBatch(list);
  } else if (type === 'grupos') {
    const list = [...grupos];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const estado = normalizeEstado(d.estado) || 'activo';
      const turno = d.turno.toLowerCase() as Grupo['turno'];
      const carr = carreras.find(c => c.codigo.toUpperCase() === d.carreraCodigo.toUpperCase());
      const cuat = cuatrimestres.find(cu => cu.numero === Number(d.cuatrimestreNumero));
      const existingIdx = list.findIndex(g => g.nombre.toLowerCase() === d.nombre.toLowerCase());

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          nombre: d.nombre,
          carreraId: carr?.id || list[existingIdx].carreraId,
          carreraNombre: carr?.nombre || list[existingIdx].carreraNombre,
          cuatrimestreId: cuat?.id || list[existingIdx].cuatrimestreId,
          cuatrimestreNumero: cuat?.numero || list[existingIdx].cuatrimestreNumero,
          turno,
          estado
        };
        updated++;
      } else {
        const newGrup: Grupo = {
          id: `grup-bulk-${Date.now()}-${idx}`,
          nombre: d.nombre,
          carreraId: carr?.id || '',
          carreraNombre: carr?.nombre || '',
          cuatrimestreId: cuat?.id || '',
          cuatrimestreNumero: cuat?.numero || 1,
          turno,
          estado
        };
        list.push(newGrup);
        created++;
      }
    });
    SIAADataService.saveGruposBatch(list);
  } else if (type === 'cuatrimestres') {
    const list = [...cuatrimestres];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const numero = Number(d.numero);
      const estado = normalizeEstado(d.estado) || 'activo';
      const existingIdx = list.findIndex(cu => cu.numero === numero);

      const normalized = normalizePeriodoAndAnio(d.periodo || list[existingIdx]?.periodo, d.anio || list[existingIdx]?.anio);

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          numero,
          nombre: d.nombre,
          periodo: normalized.periodo,
          anio: normalized.anio,
          descripcion: d.descripcion || list[existingIdx].descripcion,
          estado
        };
        updated++;
      } else {
        const newCuat: Cuatrimestre = {
          id: `cuat-bulk-${Date.now()}-${idx}`,
          numero,
          nombre: d.nombre,
          periodo: normalized.periodo,
          anio: normalized.anio,
          descripcion: d.descripcion || undefined,
          estado
        };
        list.push(newCuat);
        created++;
      }
    });
    SIAADataService.saveCuatrimestresBatch(list);
  } else if (type === 'aulas') {
    const list = [...SIAADataService.getAulas()];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const estado = normalizeEstado(d.estado) || 'activo';
      const capacidad = Number(d.capacidad);
      const existingIdx = list.findIndex(a => a.nombre.toLowerCase() === d.nombre.toLowerCase());

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          nombre: d.nombre,
          edificio: d.edificio,
          capacidad,
          tipo: d.tipo,
          ubicacion: d.ubicacion || list[existingIdx].ubicacion,
          estado
        };
        updated++;
      } else {
        const newAula: Aula = {
          id: `aul-bulk-${Date.now()}-${idx}`,
          nombre: d.nombre,
          edificio: d.edificio,
          capacidad,
          tipo: d.tipo,
          ubicacion: d.ubicacion || undefined,
          estado
        };
        list.push(newAula);
        created++;
      }
    });
    SIAADataService.saveAulasBatch(list);
  } else if (type === 'disponibilidad') {
    const users = SIAADataService.getUsers();
    const list = [...SIAADataService.getDisponibilidadesEspecificas()];
    validRows.forEach((row, idx) => {
      const d = row.data;
      const doc = users.find(u => u.correo.toLowerCase() === d.correoDocente.toLowerCase() && isTeachingRole(u.rol));
      const parsedDate = d.fechaIso
        ? { fecha: d.fechaIso }
        : validateAndBuildCalendarDate(d.dia, d.mes, d.anio);
      const fecha = parsedDate.fecha;

      if (!doc || !fecha) {
        skipped++;
        return;
      }
      const modalidad = ((d.modalidad || 'presencial').toLowerCase()) as Modalidad;
      const cupoMaximo = d.cupo ? Number(d.cupo) : 4;

      const existingIdx = list.findIndex(
        item => item.docenteId === doc.uid && item.fecha === fecha && item.horaInicio === d.horaInicio
      );

      if (existingIdx >= 0) {
        if (mode === 'create_only') {
          skipped++;
          return;
        }
        list[existingIdx] = {
          ...list[existingIdx],
          horaFin: d.horaFin,
          modalidad,
          cupoMaximo,
          activo: true
        };
        updated++;
      } else {
        const newDisp: DisponibilidadEspecifica = {
          id: `disp-cal-bulk-${Date.now()}-${idx}`,
          docenteId: doc.uid,
          fecha,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          modalidad,
          cupoMaximo,
          activo: true
        };
        list.push(newDisp);
        created++;
      }
    });
    SIAADataService.saveDisponibilidadEspecificaBatch(list);
  }

  SIAADataService.logAudit({
    usuarioId: actor.uid,
    usuarioNombre: `${actor.nombre} ${actor.apellidoPaterno}`,
    rol: actor.rol,
    accion: `CARGA_MASIVA_${type.toUpperCase()}`,
    modulo: 'Carga Masiva',
    documentoAfectado: BULK_ENTITY_SPECS[type].title,
    detalles: `Creados: ${created}, Actualizados: ${updated}, Omitidos: ${skipped}, Errores: ${errors}`
  });

  return { created, updated, skipped, errors };
}
