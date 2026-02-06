export type Modalidad = {
    id: string;
    nombre: string;
    color: string;
};

export type Evento = {
    id: string;
    modalidad_id: string;
    tipo_evento_id?: string;
    titulo: string;
    fecha: string;
    hora: string;
    ubicacion: string | null;
    ubicacion_url: string | null;
    imagen_url: string | null;
    descripcion: string | null;
    tipo?: string;
    created_at: string;
    modalidades?: Modalidad;
    tipos_evento?: TipoEvento;
};

export type EventoConModalidad = Evento & {
    modalidades: Modalidad;
    tipos_evento?: TipoEvento;
};

export const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre'
] as const;

export const MODALIDADES_INICIALES = [
    { nombre: 'Tiro Práctico IPSC', color: '#DC2626' },
    { nombre: 'Silueta Metálica', color: '#2563EB' },
    { nombre: 'Cartel', color: '#059669' },
    { nombre: 'Long Range .22', color: '#7C3AED' },
    { nombre: 'Long Range Gran Calibre', color: '#DB2777' },
    { nombre: 'Tiro Práctico IDPA', color: '#EA580C' },
    { nombre: 'Tiro Dinámico', color: '#0891B2' },
    { nombre: 'Aire Comprimido (Olímpico)', color: '#4F46E5' },
    { nombre: 'Trap Americano', color: '#65A30D' },
    { nombre: 'Fosa Olímpica', color: '#CA8A04' },
    { nombre: 'Hélice', color: '#6B7280' },
];

export type Inscripcion = {
    id: string;
    evento_id: string | null;
    modalidad_id: string;
    nombre: string;
    telefono: string;
    email: string | null;
    notas: string | null;
    created_at: string;
    eventos?: Evento;
    modalidades?: Modalidad;
    estado_pago?: 'pendiente' | 'pagado' | 'parcial';
    monto_pagado?: number;
};

export type TipoEvento = {
    id: string;
    nombre: string;
    color: string;
};

export const TIPOS_EVENTO_INICIALES = [
    { nombre: 'Puntuable', color: '#DC2626' },
    { nombre: 'Jornada de Cero', color: '#6366F1' },
    { nombre: 'Tirada Social', color: '#059669' },
    { nombre: 'Otro', color: '#6B7280' },
];
