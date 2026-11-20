import {
  User,
  Carrera,
  Cuatrimestre,
  Grupo,
  Materia,
  Aula,
  DisponibilidadRecurrente,
  DisponibilidadEspecifica,
  Asesoria,
  Notification,
  AuditLog
} from '../types/siaa';

export const INITIAL_CARRERAS: Carrera[] = [
  {
    id: 'carr-1',
    nombre: 'Ingeniería en Tecnologías de la Información y Desarrollo de Software',
    codigo: 'ITIDS',
    descripcion: 'Formación de profesionistas capaces de desarrollar soluciones de software multiplataforma y sistemas inteligentes.',
    estado: 'activo',
    fechaCreacion: '2024-01-15'
  },
  {
    id: 'carr-2',
    nombre: 'Ingeniería Industrial y Gestión de la Producción',
    codigo: 'IIGP',
    descripcion: 'Optimización de procesos productivos, gestión de la calidad y logística empresarial.',
    estado: 'activo',
    fechaCreacion: '2024-01-15'
  }
];

export const INITIAL_CUATRIMESTRES: Cuatrimestre[] = [
  { id: 'cuat-1', numero: 1, nombre: '1° Cuatrimestre', periodo: 'Sep-Dic', anio: 2026, descripcion: 'Primer Cuatrimestre (Tronco Común)', estado: 'activo' },
  { id: 'cuat-2', numero: 2, nombre: '2° Cuatrimestre', periodo: 'Ene-Abr', anio: 2026, descripcion: 'Segundo Cuatrimestre (Fundamentos)', estado: 'activo' },
  { id: 'cuat-3', numero: 3, nombre: '3° Cuatrimestre', periodo: 'May-Ago', anio: 2026, descripcion: 'Tercer Cuatrimestre (Especialidad Inicial)', estado: 'activo' },
  { id: 'cuat-4', numero: 4, nombre: '4° Cuatrimestre', periodo: 'Sep-Dic', anio: 2026, descripcion: 'Cuarto Cuatrimestre (Desarrollo Avanzado)', estado: 'activo' }
];

export const INITIAL_GRUPOS: Grupo[] = [
  { id: 'grup-1', nombre: 'SW-101', carreraId: 'carr-1', cuatrimestreId: 'cuat-1', turno: 'matutino', estado: 'activo' },
  { id: 'grup-2', nombre: 'SW-301', carreraId: 'carr-1', cuatrimestreId: 'cuat-3', turno: 'vespertino', estado: 'activo' },
  { id: 'grup-3', nombre: 'IND-101', carreraId: 'carr-2', cuatrimestreId: 'cuat-1', turno: 'matutino', estado: 'activo' },
  { id: 'grup-4', nombre: 'IND-301', carreraId: 'carr-2', cuatrimestreId: 'cuat-3', turno: 'vespertino', estado: 'activo' }
];

export const INITIAL_MATERIAS: Materia[] = [
  { id: 'mat-1', nombre: 'Cálculo Diferencial e Integral', codigo: 'MAT-101', carreraId: 'carr-1', cuatrimestreId: 'cuat-1', descripcion: 'Límites, derivadas e integrales aplicadas a la ingeniería.', estado: 'activo' },
  { id: 'mat-2', nombre: 'Fundamentos de Programación', codigo: 'PROG-102', carreraId: 'carr-1', cuatrimestreId: 'cuat-1', descripcion: 'Algoritmos, estructuras de control y programación orientada a objetos.', estado: 'activo' },
  { id: 'mat-3', nombre: 'Estructuras de Datos y Algoritmos', codigo: 'PROG-301', carreraId: 'carr-1', cuatrimestreId: 'cuat-3', descripcion: 'Árboles, grafos, pilas, colas y complejidad algorítmica.', estado: 'activo' },
  { id: 'mat-4', nombre: 'Base de Datos Relacionales y NoSQL', codigo: 'BD-302', carreraId: 'carr-1', cuatrimestreId: 'cuat-3', descripcion: 'Diseño entidad-relación, normalización y consultas complejas.', estado: 'activo' },
  { id: 'mat-5', nombre: 'Arquitectura de Software y Patrones', codigo: 'ARQ-401', carreraId: 'carr-1', cuatrimestreId: 'cuat-4', descripcion: 'Patrones de diseño GoF, microservicios y arquitectura limpia.', estado: 'activo' },
  { id: 'mat-6', nombre: 'Física y Mecánica Clásica', codigo: 'FIS-101', carreraId: 'carr-2', cuatrimestreId: 'cuat-1', descripcion: 'Cinemática, leyes de Newton, energía y trabajo.', estado: 'activo' },
  { id: 'mat-7', nombre: 'Probabilidad y Estadística Industrial', codigo: 'EST-102', carreraId: 'carr-2', cuatrimestreId: 'cuat-1', descripcion: 'Distribuciones de probabilidad, muestreo y pruebas de hipótesis.', estado: 'activo' },
  { id: 'mat-8', nombre: 'Control Estadístico de Procesos', codigo: 'CAL-301', carreraId: 'carr-2', cuatrimestreId: 'cuat-3', descripcion: 'Gráficos de control, capacidad de proceso Six Sigma.', estado: 'activo' },
  { id: 'mat-9', nombre: 'Investigación de Operaciones', codigo: 'INV-302', carreraId: 'carr-2', cuatrimestreId: 'cuat-3', descripcion: 'Programación lineal, método simplex y teoría de colas.', estado: 'activo' },
  { id: 'mat-10', nombre: 'Ingeniería de Métodos y Tiempos', codigo: 'MET-401', carreraId: 'carr-2', cuatrimestreId: 'cuat-4', descripcion: 'Estudio del trabajo, ergonomía y balanceo de líneas.', estado: 'activo' }
];

export const INITIAL_AULAS: Aula[] = [
  { id: 'aul-1', nombre: 'Aula Magna 101', edificio: 'Edificio A', capacidad: 40, ubicacion: 'Planta Baja', tipo: 'aula', estado: 'activo' },
  { id: 'aul-2', nombre: 'Laboratorio de Cómputo 3', edificio: 'Edificio B - Tecnologías', capacidad: 30, ubicacion: 'Segundo Piso', tipo: 'sala_computo', estado: 'activo' },
  { id: 'aul-3', nombre: 'Laboratorio de Redes y Sistemas', edificio: 'Edificio B - Tecnologías', capacidad: 25, ubicacion: 'Primer Piso', tipo: 'laboratorio', estado: 'activo' },
  { id: 'aul-4', nombre: 'Aula de Asesorías Personalizadas 204', edificio: 'Edificio C - Cubículos', capacidad: 10, ubicacion: 'Segundo Piso', tipo: 'aula', estado: 'activo' },
  { id: 'aul-5', nombre: 'Taller de Ergonomía y Manufactura', edificio: 'Edificio D - Ingenierías', capacidad: 35, ubicacion: 'Planta Baja', tipo: 'taller', estado: 'activo' }
];

export const INITIAL_USERS: User[] = [
  // 1 Administrador
  {
    uid: 'user-admin-1',
    nombre: 'Carlos',
    apellidoPaterno: 'Mendoza',
    apellidoMaterno: 'Villaseñor',
    correo: 'admin@siaa.edu.mx',
    numeroEmpleado: 'EMP-ADM-001',
    telefono: '55-1234-5678',
    rol: 'admin',
    estado: 'activo',
    fechaCreacion: '2025-01-10',
    fechaActualizacion: '2026-02-01'
  },
  // 1 Director Académico
  {
    uid: 'user-dir-1',
    nombre: 'Patricia',
    apellidoPaterno: 'Valenzuela',
    apellidoMaterno: 'Ríos',
    correo: 'directora.academica@siaa.edu.mx',
    numeroEmpleado: 'EMP-DIR-102',
    telefono: '55-9876-5432',
    rol: 'director',
    estado: 'activo',
    fechaCreacion: '2025-01-12',
    fechaActualizacion: '2026-01-15'
  },
  // 2 Jefes de Carrera
  {
    uid: 'user-jefe-1',
    nombre: 'Claudia',
    apellidoPaterno: 'Navarro',
    apellidoMaterno: 'Herrera',
    correo: 'jefa.itids@siaa.edu.mx',
    numeroEmpleado: 'EMP-JEF-101',
    telefono: '55-6123-4500',
    rol: 'jefe_carrera',
    carreraId: 'carr-1',
    carrerasIds: ['carr-1'],
    estado: 'activo',
    fechaCreacion: '2025-01-12',
    fechaActualizacion: '2026-01-15'
  },
  {
    uid: 'user-dir-2',
    nombre: 'Roberto',
    apellidoPaterno: 'Estrada',
    apellidoMaterno: 'Gómez',
    correo: 'jefe.industrial@siaa.edu.mx',
    numeroEmpleado: 'EMP-JEF-103',
    telefono: '55-5555-1234',
    rol: 'jefe_carrera',
    carreraId: 'carr-2',
    carrerasIds: ['carr-2'],
    estado: 'activo',
    fechaCreacion: '2025-01-12',
    fechaActualizacion: '2026-01-15'
  },
  // 2 Profesores de Tiempo Completo (Tutor)
  {
    uid: 'user-doc-1',
    nombre: 'Fernando',
    apellidoPaterno: 'Aguirre',
    apellidoMaterno: 'Salazar',
    correo: 'fernando.aguirre@siaa.edu.mx',
    numeroEmpleado: 'PTC-201',
    telefono: '55-3344-5566',
    rol: 'ptc_tutor',
    carreraId: 'carr-1',
    carrerasIds: ['carr-1', 'carr-2'],
    estado: 'activo',
    fechaCreacion: '2025-02-01',
    fechaActualizacion: '2026-02-10'
  },
  {
    uid: 'user-doc-2',
    nombre: 'Lorena',
    apellidoPaterno: 'Méndez',
    apellidoMaterno: 'Castillo',
    correo: 'lorena.mendez@siaa.edu.mx',
    numeroEmpleado: 'PTC-202',
    telefono: '55-4455-6677',
    rol: 'ptc_tutor',
    carreraId: 'carr-1',
    carrerasIds: ['carr-1'],
    estado: 'activo',
    fechaCreacion: '2025-02-01',
    fechaActualizacion: '2026-02-10'
  },
  // 2 Profesores de Asignatura (PA)
  {
    uid: 'user-doc-3',
    nombre: 'Javier',
    apellidoPaterno: 'Rocha',
    apellidoMaterno: 'Vargas',
    correo: 'javier.rocha@siaa.edu.mx',
    numeroEmpleado: 'PA-301',
    telefono: '55-6677-8899',
    rol: 'pa',
    carreraId: 'carr-2',
    carrerasIds: ['carr-2'],
    estado: 'activo',
    fechaCreacion: '2025-02-01',
    fechaActualizacion: '2026-02-10'
  },
  {
    uid: 'user-doc-4',
    nombre: 'Sofía',
    apellidoPaterno: 'Paredes',
    apellidoMaterno: 'Morales',
    correo: 'sofia.paredes@siaa.edu.mx',
    numeroEmpleado: 'PA-302',
    telefono: '55-7788-9900',
    rol: 'pa',
    carreraId: 'carr-2',
    carrerasIds: ['carr-2'],
    estado: 'activo',
    fechaCreacion: '2025-02-01',
    fechaActualizacion: '2026-02-10'
  },
  // 1 Administrativo con Función Docente
  {
    uid: 'user-doc-5',
    nombre: 'Daniel',
    apellidoPaterno: 'Quiroz',
    apellidoMaterno: 'López',
    correo: 'daniel.quiroz@siaa.edu.mx',
    numeroEmpleado: 'ADM-DOC-401',
    telefono: '55-8899-0011',
    rol: 'administrativo_docente',
    carreraId: 'carr-1',
    carrerasIds: ['carr-1', 'carr-2'],
    estado: 'activo',
    fechaCreacion: '2025-02-01',
    fechaActualizacion: '2026-02-10'
  },
  // 10 Alumnos
  {
    uid: 'user-alu-1',
    nombre: 'Alejandro',
    apellidoPaterno: 'García',
    apellidoMaterno: 'Vega',
    correo: 'alejandro.garcia@alumno.siaa.edu.mx',
    matricula: '2024-SW0101',
    telefono: '55-1111-2222',
    rol: 'alumno',
    carreraId: 'carr-1',
    grupoId: 'grup-1',
    cuatrimestreId: 'cuat-1',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-2',
    nombre: 'Valeria',
    apellidoPaterno: 'Sánchez',
    apellidoMaterno: 'Hernández',
    correo: 'valeria.sanchez@alumno.siaa.edu.mx',
    matricula: '2024-SW0102',
    telefono: '55-2222-3333',
    rol: 'alumno',
    carreraId: 'carr-1',
    grupoId: 'grup-1',
    cuatrimestreId: 'cuat-1',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-3',
    nombre: 'Mateo',
    apellidoPaterno: 'Ramírez',
    apellidoMaterno: 'Suárez',
    correo: 'mateo.ramirez@alumno.siaa.edu.mx',
    matricula: '2024-SW0301',
    telefono: '55-3333-4444',
    rol: 'alumno',
    carreraId: 'carr-1',
    grupoId: 'grup-2',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-4',
    nombre: 'Camila',
    apellidoPaterno: 'Cruz',
    apellidoMaterno: 'Navarro',
    correo: 'camila.cruz@alumno.siaa.edu.mx',
    matricula: '2024-SW0302',
    telefono: '55-4444-5555',
    rol: 'alumno',
    carreraId: 'carr-1',
    grupoId: 'grup-2',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-5',
    nombre: 'Diego',
    apellidoPaterno: 'Torres',
    apellidoMaterno: 'Pérez',
    correo: 'diego.torres@alumno.siaa.edu.mx',
    matricula: '2024-SW0303',
    telefono: '55-5555-6666',
    rol: 'alumno',
    carreraId: 'carr-1',
    grupoId: 'grup-2',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-6',
    nombre: 'Mariana',
    apellidoPaterno: 'Ortiz',
    apellidoMaterno: 'Campos',
    correo: 'mariana.ortiz@alumno.siaa.edu.mx',
    matricula: '2024-IN0101',
    telefono: '55-6666-7777',
    rol: 'alumno',
    carreraId: 'carr-2',
    grupoId: 'grup-3',
    cuatrimestreId: 'cuat-1',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-7',
    nombre: 'Emiliano',
    apellidoPaterno: 'Jiménez',
    apellidoMaterno: 'Aguilar',
    correo: 'emiliano.jimenez@alumno.siaa.edu.mx',
    matricula: '2024-IN0102',
    telefono: '55-7777-8888',
    rol: 'alumno',
    carreraId: 'carr-2',
    grupoId: 'grup-3',
    cuatrimestreId: 'cuat-1',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-8',
    nombre: 'Fernanda',
    apellidoPaterno: 'Morales',
    apellidoMaterno: 'Ríos',
    correo: 'fernanda.morales@alumno.siaa.edu.mx',
    matricula: '2024-IN0301',
    telefono: '55-8888-9999',
    rol: 'alumno',
    carreraId: 'carr-2',
    grupoId: 'grup-4',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-9',
    nombre: 'Santiago',
    apellidoPaterno: 'Castro',
    apellidoMaterno: 'Delgado',
    correo: 'santiago.castro@alumno.siaa.edu.mx',
    matricula: '2024-IN0302',
    telefono: '55-9999-0000',
    rol: 'alumno',
    carreraId: 'carr-2',
    grupoId: 'grup-4',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  },
  {
    uid: 'user-alu-10',
    nombre: 'Ximena',
    apellidoPaterno: 'Flores',
    apellidoMaterno: 'Luna',
    correo: 'ximena.flores@alumno.siaa.edu.mx',
    matricula: '2024-IN0303',
    telefono: '55-1010-2020',
    rol: 'alumno',
    carreraId: 'carr-2',
    grupoId: 'grup-4',
    cuatrimestreId: 'cuat-3',
    estado: 'activo',
    fechaCreacion: '2025-03-01',
    fechaActualizacion: '2026-01-20'
  }
];

export const INITIAL_DISPONIBILIDADES_RECURRENTES: DisponibilidadRecurrente[] = [
  // Dr. Fernando Aguirre (Matemáticas)
  { id: 'disp-rec-1', docenteId: 'user-doc-1', diaSemana: 'lunes', horaInicio: '09:00', horaFin: '10:00', materiaId: 'mat-1', aulaId: 'aul-4', observaciones: 'Atención personalizada cálculo' },
  { id: 'disp-rec-2', docenteId: 'user-doc-1', diaSemana: 'lunes', horaInicio: '10:00', horaFin: '11:00', materiaId: 'mat-1', aulaId: 'aul-4' },
  { id: 'disp-rec-3', docenteId: 'user-doc-1', diaSemana: 'miercoles', horaInicio: '11:00', horaFin: '12:00', materiaId: 'mat-1', aulaId: 'aul-4' },
  { id: 'disp-rec-4', docenteId: 'user-doc-1', diaSemana: 'viernes', horaInicio: '09:00', horaFin: '10:00', materiaId: 'mat-1', aulaId: 'aul-4' },
  
  // Mtra. Lorena Méndez (Programación / Estructuras)
  { id: 'disp-rec-5', docenteId: 'user-doc-2', diaSemana: 'martes', horaInicio: '10:00', horaFin: '11:00', materiaId: 'mat-2', aulaId: 'aul-2', observaciones: 'Laboratorio de programación' },
  { id: 'disp-rec-6', docenteId: 'user-doc-2', diaSemana: 'martes', horaInicio: '11:00', horaFin: '12:00', materiaId: 'mat-3', aulaId: 'aul-2' },
  { id: 'disp-rec-7', docenteId: 'user-doc-2', diaSemana: 'jueves', horaInicio: '14:00', horaFin: '15:00', materiaId: 'mat-3', aulaId: 'aul-2' },
  { id: 'disp-rec-8', docenteId: 'user-doc-2', diaSemana: 'jueves', horaInicio: '15:00', horaFin: '16:00', materiaId: 'mat-5', aulaId: 'aul-2' },

  // Ing. Javier Rocha (Física)
  { id: 'disp-rec-9', docenteId: 'user-doc-3', diaSemana: 'lunes', horaInicio: '12:00', horaFin: '13:00', materiaId: 'mat-6', aulaId: 'aul-1' },
  { id: 'disp-rec-10', docenteId: 'user-doc-3', diaSemana: 'miercoles', horaInicio: '12:00', horaFin: '13:00', materiaId: 'mat-6', aulaId: 'aul-1' },

  // Lic. Sofía Paredes (Estadística / Calidad)
  { id: 'disp-rec-11', docenteId: 'user-doc-4', diaSemana: 'martes', horaInicio: '12:00', horaFin: '13:00', materiaId: 'mat-7', aulaId: 'aul-4' },
  { id: 'disp-rec-12', docenteId: 'user-doc-4', diaSemana: 'miercoles', horaInicio: '15:00', horaFin: '16:00', materiaId: 'mat-8', aulaId: 'aul-5' },

  // Mtro. Daniel Quiroz (Bases de datos)
  { id: 'disp-rec-13', docenteId: 'user-doc-5', diaSemana: 'viernes', horaInicio: '10:00', horaFin: '11:00', materiaId: 'mat-4', aulaId: 'aul-3' },
  { id: 'disp-rec-14', docenteId: 'user-doc-5', diaSemana: 'viernes', horaInicio: '11:00', horaFin: '12:00', materiaId: 'mat-4', aulaId: 'aul-3' }
];

export const INITIAL_DISPONIBILIDADES_ESPECIFICAS: DisponibilidadEspecifica[] = [
  {
    id: 'disp-esp-1',
    docenteId: 'user-doc-1',
    fecha: '2026-09-22',
    horaInicio: '16:00',
    horaFin: '17:00',
    materiaId: 'mat-1',
    aulaId: 'aul-4',
    modalidad: 'presencial',
    observaciones: 'Sesión extraordinaria de repaso de límites'
  },
  {
    id: 'disp-esp-2',
    docenteId: 'user-doc-2',
    fecha: '2026-09-23',
    horaInicio: '17:00',
    horaFin: '18:00',
    materiaId: 'mat-3',
    aulaId: 'aul-2',
    modalidad: 'virtual',
    observaciones: 'Resolución de dudas sobre árboles binarios'
  }
];

export const INITIAL_ASESORIAS: Asesoria[] = [
  // 1. Asesoría Realizada y Cerrada con seguimiento completo
  {
    id: 'ase-001',
    folio: 'SIAA-2026-000001',
    fechaSolicitud: '2026-09-10',
    alumnoId: 'user-alu-1',
    alumnoNombre: 'Alejandro García Vega',
    matricula: '2024-SW0101',
    carreraId: 'carr-1',
    carreraNombre: 'Ingeniería en Tecnologías de la Información y Desarrollo de Software',
    grupoId: 'grup-1',
    grupoNombre: 'SW-101',
    cuatrimestreId: 'cuat-1',
    cuatrimestreNumero: 1,
    solicitanteId: 'user-alu-1',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Alejandro García Vega',
    materiaId: 'mat-1',
    materiaNombre: 'Cálculo Diferencial e Integral',
    materiaCodigo: 'MAT-101',
    motivo: 'Dificultad severa para comprender el cálculo de derivadas mediante la regla de la cadena y optimización.',
    temasDificultad: 'Regla de la cadena, máximos y mínimos relativos.',
    prioridad: 'alta',
    docenteAsignadoId: 'user-doc-1',
    docenteAsignadoNombre: 'Dr. Fernando Aguirre Salazar',
    fechaProgramada: '2026-09-14',
    horaInicio: '09:00',
    horaTermino: '10:00',
    modalidad: 'presencial',
    aulaId: 'aul-4',
    aulaNombre: 'Aula de Asesorías Personalizadas 204',
    observaciones: 'El alumno trajo su examen diagnóstico previo.',
    estado: 'cerrada',
    autorizadaPor: 'Dra. Patricia Valenzuela Ríos',
    fechaAutorizacion: '2026-09-11',
    observacionesAutorizacion: 'Solicitud plenamente justificada por reprobación de parcial 1.',
    seguimiento: {
      temasTrabajados: 'Descomposición analítica de funciones compuestas y aplicaciones prácticas de la derivada en problemas geométricos.',
      dificultadesDetectadas: 'Confusión al identificar la función interna y externa en funciones trigonométricas compuestas.',
      actividadesRealizadas: 'Resolución guiada de 8 ejercicios prácticos y formulación de mnemotecnia para reglas de derivación.',
      resultado: 'satisfactorio',
      recomendaciones: 'Practicar 10 ejercicios adicionales del libro Stewart Cálculo página 214 antes del segundo examen parcial.',
      observaciones: 'El alumno demostró notable mejoría y excelente disposición al trabajo.',
      requiereNuevaAsesoria: false,
      fechaSeguimiento: '2026-09-14',
      evidencias: [
        {
          id: 'evi-1',
          nombre: 'Ficha_Ejercicios_Derivadas_Resueltos.pdf',
          url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80',
          tipo: 'application/pdf',
          fecha: '2026-09-14',
          tamanio: '1.2 MB'
        }
      ]
    },
    fechaCierre: '2026-09-15'
  },
  // 2. Asesoría Confirmada (Próxima)
  {
    id: 'ase-002',
    folio: 'SIAA-2026-000002',
    fechaSolicitud: '2026-09-15',
    alumnoId: 'user-alu-3',
    alumnoNombre: 'Mateo Ramírez Suárez',
    matricula: '2024-SW0301',
    carreraId: 'carr-1',
    carreraNombre: 'Ingeniería en Tecnologías de la Información y Desarrollo de Software',
    grupoId: 'grup-2',
    grupoNombre: 'SW-301',
    cuatrimestreId: 'cuat-3',
    cuatrimestreNumero: 3,
    solicitanteId: 'user-alu-3',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Mateo Ramírez Suárez',
    materiaId: 'mat-3',
    materiaNombre: 'Estructuras de Datos y Algoritmos',
    materiaCodigo: 'PROG-301',
    motivo: 'Problemas en la implementación de balanceo en Árboles AVL y recorridos recursivos en Java.',
    temasDificultad: 'Rotaciones simples y dobles en árboles AVL.',
    prioridad: 'urgente',
    docenteAsignadoId: 'user-doc-2',
    docenteAsignadoNombre: 'Mtra. Lorena Méndez Castillo',
    fechaProgramada: '2026-09-22',
    horaInicio: '11:00',
    horaTermino: '12:00',
    modalidad: 'presencial',
    aulaId: 'aul-2',
    aulaNombre: 'Laboratorio de Cómputo 3',
    observaciones: 'Llevar computadora portátil con JDK configurado.',
    estado: 'confirmada',
    autorizadaPor: 'Dra. Patricia Valenzuela Ríos',
    fechaAutorizacion: '2026-09-16',
    observacionesAutorizacion: 'Aprobada prioritariamente.'
  },
  // 3. Solicitud Pendiente de Autorización
  {
    id: 'ase-003',
    folio: 'SIAA-2026-000003',
    fechaSolicitud: '2026-09-17',
    alumnoId: 'user-alu-6',
    alumnoNombre: 'Mariana Ortiz Campos',
    matricula: '2024-IN0101',
    carreraId: 'carr-2',
    carreraNombre: 'Ingeniería Industrial y Gestión de la Producción',
    grupoId: 'grup-3',
    grupoNombre: 'IND-101',
    cuatrimestreId: 'cuat-1',
    cuatrimestreNumero: 1,
    solicitanteId: 'user-alu-6',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Mariana Ortiz Campos',
    materiaId: 'mat-6',
    materiaNombre: 'Física y Mecánica Clásica',
    materiaCodigo: 'FIS-101',
    motivo: 'Dificultad en diagramas de cuerpo libre con fricción estática y dinámica en planos inclinados.',
    temasDificultad: 'Leyes de Newton en planos inclinados y coeficientes de fricción.',
    prioridad: 'media',
    estado: 'pendiente'
  },
  // 4. Asesoría Aprobada pero pendiente de asignación de horario/docente
  {
    id: 'ase-004',
    folio: 'SIAA-2026-000004',
    fechaSolicitud: '2026-09-16',
    alumnoId: 'user-alu-8',
    alumnoNombre: 'Fernanda Morales Ríos',
    matricula: '2024-IN0301',
    carreraId: 'carr-2',
    carreraNombre: 'Ingeniería Industrial y Gestión de la Producción',
    grupoId: 'grup-4',
    grupoNombre: 'IND-301',
    cuatrimestreId: 'cuat-3',
    cuatrimestreNumero: 3,
    solicitanteId: 'user-alu-8',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Fernanda Morales Ríos',
    materiaId: 'mat-8',
    materiaNombre: 'Control Estadístico de Procesos',
    materiaCodigo: 'CAL-301',
    motivo: 'Cálculo de límites de control estadístico en cartas X-barra y R.',
    temasDificultad: 'Cartas de control y capacidad de proceso Cp y Cpk.',
    prioridad: 'alta',
    estado: 'aprobada',
    autorizadaPor: 'Ing. Roberto Estrada Gómez',
    fechaAutorizacion: '2026-09-17',
    observacionesAutorizacion: 'Aprobada para asignación de docente asesor.'
  },
  // 5. Asesoría Realizada pendiente de cierre final
  {
    id: 'ase-005',
    folio: 'SIAA-2026-000005',
    fechaSolicitud: '2026-09-12',
    alumnoId: 'user-alu-4',
    alumnoNombre: 'Camila Cruz Navarro',
    matricula: '2024-SW0302',
    carreraId: 'carr-1',
    carreraNombre: 'Ingeniería en Tecnologías de la Información y Desarrollo de Software',
    grupoId: 'grup-2',
    grupoNombre: 'SW-301',
    cuatrimestreId: 'cuat-3',
    cuatrimestreNumero: 3,
    solicitanteId: 'user-alu-4',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Camila Cruz Navarro',
    materiaId: 'mat-4',
    materiaNombre: 'Base de Datos Relacionales y NoSQL',
    materiaCodigo: 'BD-302',
    motivo: 'Subconsultas correlacionadas en SQL y normalización hasta 3FN.',
    temasDificultad: 'Formas normales y JOINs complejos.',
    prioridad: 'media',
    docenteAsignadoId: 'user-doc-5',
    docenteAsignadoNombre: 'Mtro. Daniel Quiroz López',
    fechaProgramada: '2026-09-18',
    horaInicio: '10:00',
    horaTermino: '11:00',
    modalidad: 'presencial',
    aulaId: 'aul-3',
    aulaNombre: 'Laboratorio de Redes y Sistemas',
    estado: 'realizada',
    autorizadaPor: 'Dra. Patricia Valenzuela Ríos',
    fechaAutorizacion: '2026-09-13',
    seguimiento: {
      temasTrabajados: 'Modelado relacional de caso real y optimización de índices SQL.',
      dificultadesDetectadas: 'Falta de abstracción en dependencias funcionales transitivas.',
      actividadesRealizadas: 'Normalización guiada de esquema de ventas desde 0FN a 3FN.',
      resultado: 'satisfactorio',
      recomendaciones: 'Repasar teoría de álgebra relacional en el portal institucional.',
      observaciones: 'Comprendió el concepto de llave primaria y foránea adecuadamente.',
      requiereNuevaAsesoria: false,
      fechaSeguimiento: '2026-09-18',
      evidencias: []
    }
  },
  // 6. Asesoría Cancelada
  {
    id: 'ase-006',
    folio: 'SIAA-2026-000006',
    fechaSolicitud: '2026-09-08',
    alumnoId: 'user-alu-2',
    alumnoNombre: 'Valeria Sánchez Hernández',
    matricula: '2024-SW0102',
    carreraId: 'carr-1',
    carreraNombre: 'Ingeniería en Tecnologías de la Información y Desarrollo de Software',
    grupoId: 'grup-1',
    grupoNombre: 'SW-101',
    cuatrimestreId: 'cuat-1',
    cuatrimestreNumero: 1,
    solicitanteId: 'user-alu-2',
    solicitanteRol: 'alumno',
    solicitanteNombre: 'Valeria Sánchez Hernández',
    materiaId: 'mat-2',
    materiaNombre: 'Fundamentos de Programación',
    materiaCodigo: 'PROG-102',
    motivo: 'Dudas sobre arreglos unidimensionales.',
    temasDificultad: 'Vectores y matrices.',
    prioridad: 'baja',
    estado: 'cancelada',
    observaciones: 'Cancelada por la alumna por resolución de dudas en clase regular.'
  }
];

export const INITIAL_NOTIFICACIONES: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-alu-3',
    titulo: 'Asesoría Confirmada',
    mensaje: 'Tu asesoría de Estructuras de Datos ha sido confirmada para el 22/09/2026 a las 11:00 en Laboratorio de Cómputo 3.',
    tipo: 'asignacion',
    referenciaId: 'ase-002',
    leida: false,
    fechaCreacion: '2026-09-16 14:30'
  },
  {
    id: 'notif-2',
    userId: 'user-doc-2',
    titulo: 'Nueva Asesoría Asignada',
    mensaje: 'Se te ha asignado como docente asesor del alumno Mateo Ramírez en Estructuras de Datos (Folio: SIAA-2026-000002).',
    tipo: 'asignacion',
    referenciaId: 'ase-002',
    leida: false,
    fechaCreacion: '2026-09-16 14:30'
  },
  {
    id: 'notif-3',
    userId: 'user-admin-1',
    titulo: 'Nueva Solicitud Pendiente',
    mensaje: 'La alumna Mariana Ortiz ha generado la solicitud SIAA-2026-000003 en Física y Mecánica Clásica.',
    tipo: 'solicitud',
    referenciaId: 'ase-003',
    leida: false,
    fechaCreacion: '2026-09-17 09:15'
  },
  {
    id: 'notif-4',
    userId: 'user-dir-1',
    titulo: 'Solicitud por Revisar',
    mensaje: 'Hay 1 nueva solicitud pendiente de revisión en la carrera de ITIDS.',
    tipo: 'solicitud',
    referenciaId: 'ase-003',
    leida: true,
    fechaCreacion: '2026-09-17 09:16'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    usuarioId: 'user-alu-1',
    usuarioNombre: 'Alejandro García Vega',
    rol: 'alumno',
    accion: 'SOLICITUD_CREADA',
    modulo: 'Solicitudes',
    documentoAfectado: 'SIAA-2026-000001',
    fecha: '10/09/2026',
    hora: '11:20',
    detalles: 'Creó solicitud de asesoría en Cálculo Diferencial e Integral.'
  },
  {
    id: 'aud-2',
    usuarioId: 'user-dir-1',
    usuarioNombre: 'Dra. Patricia Valenzuela Ríos',
    rol: 'director',
    accion: 'SOLICITUD_AUTORIZADA',
    modulo: 'Autorizaciones',
    documentoAfectado: 'SIAA-2026-000001',
    fecha: '11/09/2026',
    hora: '10:05',
    detalles: 'Autorizó solicitud prioritaria para el alumno.'
  },
  {
    id: 'aud-3',
    usuarioId: 'user-admin-1',
    usuarioNombre: 'Mtro. Carlos Mendoza Villaseñor',
    rol: 'admin',
    accion: 'DOCENTE_ASIGNADO',
    modulo: 'Asignaciones',
    documentoAfectado: 'SIAA-2026-000001',
    fecha: '11/09/2026',
    hora: '12:30',
    detalles: 'Asignó al Dr. Fernando Aguirre para el 14/09/2026 09:00 en Aula 204.'
  },
  {
    id: 'aud-4',
    usuarioId: 'user-doc-1',
    usuarioNombre: 'Dr. Fernando Aguirre Salazar',
    rol: 'ptc_tutor',
    accion: 'SEGUIMIENTO_REGISTRADO',
    modulo: 'Seguimiento',
    documentoAfectado: 'SIAA-2026-000001',
    fecha: '14/09/2026',
    hora: '10:15',
    detalles: 'Registró seguimiento y resultado satisfactorio con evidencias.'
  },
  {
    id: 'aud-5',
    usuarioId: 'user-admin-1',
    usuarioNombre: 'Mtro. Carlos Mendoza Villaseñor',
    rol: 'admin',
    accion: 'ASESORIA_CERRADA',
    modulo: 'Asesorías',
    documentoAfectado: 'SIAA-2026-000001',
    fecha: '15/09/2026',
    hora: '09:00',
    detalles: 'Cerró formalmente la ficha de asesoría académica.'
  }
];
