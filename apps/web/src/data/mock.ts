export type TicketPriority = "P1" | "P2" | "P3" | "P4";

export type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status: "Resuelto" | "En atención" | "En espera";
  createdAt: string;
  updatedAt: string;
  owner: string;
  location: string;
  score: number;
  urgency: number;
  impact: number;
  factor: number;
};

export const tickets: Ticket[] = [
  {
    id: "T1",
    title: "No puedo entrar al aula virtual",
    description: "No puedo entrar al aula virtual y mi examen empieza en 30 minutos.",
    category: "Aula virtual – Acceso",
    priority: "P1",
    status: "Resuelto",
    createdAt: "Martes, 10:02 a. m.",
    updatedAt: "Martes, 10:18 a. m.",
    owner: "Johan Rodríguez",
    location: "Campus Norte · Aula 204",
    score: 12,
    urgency: 3,
    impact: 2,
    factor: 2,
  },
  {
    id: "T2",
    title: "Red caída en el laboratorio B",
    description: "La conexión no está disponible para 40 alumnos y hay una evaluación en curso.",
    category: "Conectividad",
    priority: "P1",
    status: "En atención",
    createdAt: "Martes, 10:05 a. m.",
    updatedAt: "Martes, 10:09 a. m.",
    owner: "María González",
    location: "Campus Norte · Laboratorio B",
    score: 9,
    urgency: 3,
    impact: 3,
    factor: 1,
  },
  {
    id: "T3",
    title: "Error al subir una tarea",
    description: "La plataforma muestra un error al cargar una tarea que vence hoy a las 11:59 p. m.",
    category: "Aula virtual – Entregas",
    priority: "P2",
    status: "En espera",
    createdAt: "Martes, 10:07 a. m.",
    updatedAt: "Martes, 10:07 a. m.",
    owner: "Camila Torres",
    location: "Remoto",
    score: 6,
    urgency: 2,
    impact: 2,
    factor: 1.5,
  },
  {
    id: "T4",
    title: "Correo institucional sin sincronizar",
    description: "El correo institucional no se sincroniza en el celular.",
    category: "Correo institucional",
    priority: "P4",
    status: "En espera",
    createdAt: "Martes, 10:10 a. m.",
    updatedAt: "Martes, 10:10 a. m.",
    owner: "Luis Martínez",
    location: "Remoto",
    score: 2,
    urgency: 2,
    impact: 1,
    factor: 1,
  },
];

export const timeline = [
  { time: "10:02 a. m.", label: "Incidencia registrada", detail: "El reporte fue recibido correctamente.", tone: "blue" },
  { time: "10:03 a. m.", label: "Clasificación simulada", detail: "Aula virtual – Acceso · Prioridad P1 crítica.", tone: "purple" },
  { time: "10:04 a. m.", label: "Asignada a TI", detail: "Agente: Andrés Pérez.", tone: "blue" },
  { time: "10:16 a. m.", label: "Falla confirmada", detail: "Se restableció el acceso al aula virtual.", tone: "green" },
  { time: "10:18 a. m.", label: "Incidencia resuelta", detail: "Puedes solicitar tu constancia de atención.", tone: "green" },
];
