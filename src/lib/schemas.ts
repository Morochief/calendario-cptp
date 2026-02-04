/**
 * Zod Validation Schemas for all entities
 * Provides runtime validation and TypeScript inference
 */
import { z } from 'zod';

// ========================================
// Base Schemas
// ========================================

export const uuidSchema = z.string().uuid();

// ========================================
// Modalidad Schema
// ========================================

export const modalidadSchema = z.object({
    id: uuidSchema,
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal (#RRGGBB)'),
    contacto_nombre: z.string().max(100).nullable().optional(),
    contacto_telefono: z.string().max(50).nullable().optional(),
    created_at: z.string().optional(),
});

export const modalidadCreateSchema = modalidadSchema.omit({ id: true, created_at: true });
export const modalidadUpdateSchema = modalidadCreateSchema.partial();

// ========================================
// Tipo Evento Schema
// ========================================

export const tipoEventoSchema = z.object({
    id: uuidSchema,
    nombre: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal'),
    descripcion: z.string().max(500).nullable().optional(),
    created_at: z.string().optional(),
});

export const tipoEventoCreateSchema = tipoEventoSchema.omit({ id: true, created_at: true });

// ========================================
// Evento Schema
// ========================================

export const eventoSchema = z.object({
    id: uuidSchema,
    modalidad_id: uuidSchema,
    tipo_evento_id: uuidSchema.nullable().optional(),
    titulo: z.string()
        .min(1, 'El título es requerido')
        .max(200, 'Máximo 200 caracteres')
        .transform(val => val.trim()),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
    hora: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').default('08:30'),
    ubicacion: z.string().max(200).nullable().optional(),
    ubicacion_url: z.string().url('Debe ser una URL válida').nullable().optional(),
    imagen_url: z.string().url('Debe ser una URL válida').nullable().optional(),
    descripcion: z.string().max(1000).nullable().optional(),
    tipo: z.string().max(50).nullable().optional(), // Legacy field
    created_at: z.string().optional(),
});

export const eventoCreateSchema = eventoSchema.omit({ id: true, created_at: true });
export const eventoUpdateSchema = eventoCreateSchema.partial().extend({
    modalidad_id: uuidSchema,
    titulo: z.string().min(1).max(200),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// ========================================
// Inscripcion Schema
// ========================================

export const inscripcionSchema = z.object({
    id: uuidSchema,
    nombre: z.string()
        .min(1, 'El nombre es requerido')
        .max(100, 'Máximo 100 caracteres')
        .transform(val => val.trim()),
    telefono: z.string()
        .min(1, 'El teléfono es requerido')
        .max(30, 'Máximo 30 caracteres')
        .transform(val => val.trim()),
    email: z.string().email('Email inválido').nullable().optional()
        .or(z.literal(''))
        .transform(val => val === '' ? null : val),
    modalidad_id: uuidSchema,
    tipo_evento_id: uuidSchema.nullable().optional(),
    evento_id: uuidSchema.nullable().optional(),
    notas: z.string().max(500).nullable().optional(),
    created_at: z.string().optional(),
});

export const inscripcionCreateSchema = inscripcionSchema.omit({ id: true, created_at: true });

// ========================================
// Type Inference Exports
// ========================================

export type ModalidadInput = z.infer<typeof modalidadCreateSchema>;
export type TipoEventoInput = z.infer<typeof tipoEventoCreateSchema>;
export type EventoInput = z.infer<typeof eventoCreateSchema>;
export type InscripcionInput = z.infer<typeof inscripcionCreateSchema>;

// ========================================
// Validation Helpers
// ========================================

export function validateEventoData(data: unknown) {
    return eventoCreateSchema.safeParse(data);
}

export function validateInscripcionData(data: unknown) {
    return inscripcionCreateSchema.safeParse(data);
}

export function validateModalidadData(data: unknown) {
    return modalidadCreateSchema.safeParse(data);
}

/**
 * Sanitizes a string by escaping HTML characters
 * Use this for any user-generated content displayed in the UI
 */
export function sanitizeString(input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}
