export type UserRole =
  | 'admin'
  | 'director'
  | 'jefe_carrera'
  | 'ptc_tutor'
  | 'pa'
  | 'administrativo_docente'
  | 'alumno';

export type UserStatus = 'activo' | 'inactivo';

export interface User {
  uid: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  matricula?: string;       // For students
  numeroEmpleado?: string;  // For teachers/directors/admins
  telefono?: string;
  rol: UserRole;
  carreraId?: string;
  carrerasIds?: string[];
  grupoId?: string;
  cuatrimestreId?: string;
  estado: UserStatus;
  fotoURL?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export type SIAAUser = User;

export interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  estado: UserStatus;
  fechaCreacion?: string;
}

export type PeriodoOficial = 'Sep-Dic' | 'Ene-Abr' | 'May-Ago';

export interface Cuatrimestre {
  id: string;
  numero: number;
  nombre?: string;
  periodo?: PeriodoOficial | string;
  anio?: number;
  descripcion?: string;
  estado: UserStatus;
}

export interface Grupo {
  id: string;
  nombre: string;
  carreraId: string;
  carreraNombre?: string;
  cuatrimestreId: string;
  cuatrimestreNumero?: number;
  turno: 'matutino' | 'vespertino' | 'mixto';
  estado: UserStatus;
}

export interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  carreraId: string;
  carreraNombre?: string;
  cuatrimestreId: string;
  cuatrimestreNumero?: number;
  horasSemanales?: number;
  descripcion?: string;
  estado: UserStatus;
}

export interface Aula {
  id: string;
  nombre: string;
  edificio: string;
  capacidad: number;
  ubicacion?: string;
  tipo: string;
  estado: UserStatus;
}

export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

export interface DisponibilidadRecurrente {
  id: string;
  docenteId: string;
  diaSemana: DiaSemana;
  horaInicio: string; // HH:mm format (e.g. "09:00")
  horaFin: string;    // HH:mm format (e.g. "10:00")
  materiaId?: string;
  aulaId?: string;
  modalidad?: Modalidad;
  cupoMaximo?: number;
  activo?: boolean;
  observaciones?: string;
}

export interface DisponibilidadEspecifica {
  id: string;
  docenteId: string;
  fecha: string;      // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string;    // HH:mm
  materiaId?: string;
  aulaId?: string;
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  observaciones?: string;
}

export type EstadoAsesoria =
  | 'pendiente'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'
  | 'asignada'
  | 'confirmada'
  | 'en_proceso'
  | 'realizada'
  | 'cancelada'
  | 'no_asistio'
  | 'cerrada';

export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type Modalidad = 'presencial' | 'virtual' | 'hibrida';

export type ResultadoAsesoria = 'satisfactorio' | 'parcialmente_satisfactorio' | 'no_satisfactorio' | 'requiere_reforzamiento';

export interface Evidencia {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  fecha: string;
  tamanio?: string;
}

export interface SeguimientoAsesoria {
  temasTrabajados: string;
  dificultadesDetectadas: string;
  actividadesRealizadas: string;
  resultado: 'satisfactorio' | 'parcialmente_satisfactorio' | 'no_satisfactorio' | 'requiere_reforzamiento';
  recomendaciones: string;
  observaciones: string;
  requiereNuevaAsesoria: boolean;
  fechaSeguimiento: string;
  evidencias: Evidencia[];
}

export interface Asesoria {
  id: string; // Document ID
  folio: string; // e.g. SIAA-2026-000001
  fechaSolicitud: string; // YYYY-MM-DD
  
  // Student info
  alumnoId: string;
  alumnoNombre: string;
  matricula: string;
  carreraId: string;
  carreraNombre: string;
  grupoId: string;
  grupoNombre: string;
  cuatrimestreId: string;
  cuatrimestreNumero: number;

  // Requester info
  solicitanteId: string;
  solicitanteRol: UserRole;
  solicitanteNombre: string;

  // Academic info
  materiaId: string;
  materiaNombre: string;
  materiaCodigo: string;
  motivo: string;
  temasDificultad: string;
  prioridad: Prioridad;

  // Assignment info
  docenteAsignadoId?: string;
  docenteAsignadoNombre?: string;
  fechaProgramada?: string; // YYYY-MM-DD
  horaInicio?: string;      // HH:mm
  horaTermino?: string;     // HH:mm
  modalidad?: Modalidad;
  aulaId?: string;
  aulaNombre?: string;
  observaciones?: string;

  // Status & Workflow
  estado: EstadoAsesoria;
  autorizadaPor?: string;
  fechaAutorizacion?: string;
  observacionesAutorizacion?: string;
  motivoRechazo?: string;

  // Follow-up
  seguimiento?: SeguimientoAsesoria;
  fechaCierre?: string;
}

export interface Notification {
  id: string;
  userId: string;
  titulo: string;
  mensaje: string;
  tipo: 'solicitud' | 'autorizacion' | 'asignacion' | 'cancelacion' | 'recordatorio' | 'seguimiento';
  referenciaId?: string;
  leida: boolean;
  fechaCreacion: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: UserRole;
  accion: string;
  modulo: string;
  documentoAfectado: string;
  fecha: string;
  hora: string;
  fechaHora?: string;
  detalles?: string;
  ip?: string;
}

export interface FilterParams {
  fechaInicio?: string;
  fechaFin?: string;
  alumno?: string;
  matricula?: string;
  carreraId?: string;
  grupoId?: string;
  cuatrimestreId?: string;
  materiaId?: string;
  docenteId?: string;
  estado?: string;
  modalidad?: string;
  aulaId?: string;
}

export interface InstitutionalConfig {
  nombreCorto: string;
  nombreCompleto: string;
  subtitulo: string;
  logoURL?: string;
  duracionAsesoria: number;
  horaApertura: string;
  horaCierre: string;
  anticipacionHoras: number;
  notifCorreo: boolean;
  fechaActualizacion?: string;
}

