'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { SelectEmptyState } from '@/components/EmptyState';
import { createClient } from '@/lib/supabase';
import { Modalidad, TipoEvento } from '@/lib/types';
import { eventoCreateSchema, EventoInput } from '@/lib/schemas';

interface EventFormProps {
    initialData?: Partial<EventoInput> & { id?: string };
    isEditing?: boolean;
}

/**
 * Reusable Event Form Component
 * Handles both creating and editing events with Zod validation
 */
export default function EventForm({ initialData, isEditing = false }: EventFormProps) {
    const [modalidades, setModalidades] = useState<Modalidad[]>([]);
    const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const router = useRouter();
    const { showToast } = useToast();

    // Form state
    const [titulo, setTitulo] = useState(initialData?.titulo || '');
    const [modalidadId, setModalidadId] = useState(initialData?.modalidad_id || '');
    const [fecha, setFecha] = useState(initialData?.fecha || '');
    const [hora, setHora] = useState(initialData?.hora || '08:30');
    const [ubicacion, setUbicacion] = useState(initialData?.ubicacion || '');
    const [ubicacionUrl, setUbicacionUrl] = useState(
        initialData?.ubicacion_url || 'https://maps.app.goo.gl/weBjZMXHERaafE858?g_st=aw'
    );
    const [imagenUrl, setImagenUrl] = useState(initialData?.imagen_url || '');
    const [descripcion, setDescripcion] = useState(initialData?.descripcion || '');
    const [tipoEventoId, setTipoEventoId] = useState(initialData?.tipo_evento_id || '');

    useEffect(() => {
        loadOptions();
    }, []);

    // Update form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setTitulo(initialData.titulo || '');
            setModalidadId(initialData.modalidad_id || '');
            setFecha(initialData.fecha || '');
            setHora(initialData.hora || '08:30');
            setUbicacion(initialData.ubicacion || '');
            setUbicacionUrl(initialData.ubicacion_url || 'https://maps.app.goo.gl/weBjZMXHERaafE858?g_st=aw');
            setImagenUrl(initialData.imagen_url || '');
            setDescripcion(initialData.descripcion || '');
            setTipoEventoId(initialData.tipo_evento_id || '');
        }
    }, [initialData]);

    async function loadOptions() {
        const supabase = createClient();

        // Load modalidades
        const { data: modalidadesData } = await supabase
            .from('modalidades')
            .select('*')
            .order('nombre');

        if (modalidadesData) {
            setModalidades(modalidadesData);
            if (modalidadesData.length > 0 && !modalidadId) {
                setModalidadId(modalidadesData[0].id);
            }
        }

        // Load tipos de evento
        const { data: tiposData } = await supabase
            .from('tipos_evento')
            .select('*')
            .order('nombre');

        if (tiposData) {
            setTiposEvento(tiposData);
            if (tiposData.length > 0 && !tipoEventoId) {
                setTipoEventoId(tiposData[0].id);
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Build form data
        const formData = {
            titulo,
            modalidad_id: modalidadId,
            fecha,
            hora,
            ubicacion: ubicacion || null,
            ubicacion_url: ubicacionUrl || null,
            imagen_url: imagenUrl || null,
            descripcion: descripcion || null,
            tipo_evento_id: tipoEventoId || null,
        };

        // Validate with Zod
        const validation = eventoCreateSchema.safeParse(formData);

        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.issues.forEach(issue => {
                const field = issue.path[0]?.toString() || 'general';
                fieldErrors[field] = issue.message;
            });
            console.error('❌ Errores de validación Zod:', fieldErrors); // Log para debug
            setErrors(fieldErrors);
            showToast('Por favor corrige los errores del formulario', 'error');
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();

            if (isEditing && initialData?.id) {
                const { error } = await supabase
                    .from('eventos')
                    .update(validation.data)
                    .eq('id', initialData.id);

                if (error) throw error;
                showToast('Evento actualizado correctamente', 'success');
            } else {
                const { error } = await supabase
                    .from('eventos')
                    .insert(validation.data);

                if (error) throw error;
                showToast('Evento creado correctamente', 'success');
            }

            router.push('/admin');
        } catch (err) {
            console.error('Error saving event:', err);
            showToast('Error al guardar el evento', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
                <label htmlFor="titulo">
                    Título del evento <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                    id="titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: 1.ª Fecha Campeonato Nacional"
                    required
                    aria-invalid={!!errors.titulo}
                    aria-describedby={errors.titulo ? 'titulo-error' : undefined}
                />
                {errors.titulo && (
                    <span id="titulo-error" className="field-error">{errors.titulo}</span>
                )}
            </div>

            {modalidades.length === 0 ? (
                <SelectEmptyState entityName="modalidades" createHref="/admin/modalidades" />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label htmlFor="modalidad">
                            Modalidad <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select
                            id="modalidad"
                            value={modalidadId}
                            onChange={(e) => setModalidadId(e.target.value)}
                            required
                            aria-invalid={!!errors.modalidad_id}
                        >
                            {modalidades.map(mod => (
                                <option key={mod.id} value={mod.id}>
                                    {mod.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.modalidad_id && (
                            <span className="field-error">{errors.modalidad_id}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="tipo">
                            Tipo de evento <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select
                            id="tipo"
                            value={tipoEventoId}
                            onChange={(e) => setTipoEventoId(e.target.value)}
                            required
                            aria-invalid={!!errors.tipo_evento_id}
                        >
                            {tiposEvento.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label htmlFor="fecha">
                        Fecha <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                        id="fecha"
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                        aria-invalid={!!errors.fecha}
                    />
                    {errors.fecha && (
                        <span className="field-error">{errors.fecha}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="hora">Hora</label>
                    <input
                        id="hora"
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="ubicacion">Ubicación / Polígono</label>
                <input
                    id="ubicacion"
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ej: Polígono de Tiro 10M - Comité Olímpico Paraguayo"
                    aria-invalid={!!errors.ubicacion}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label htmlFor="ubicacion_url">
                        📍 Link de Ubicación (Google Maps)
                    </label>
                    <input
                        id="ubicacion_url"
                        type="url"
                        value={ubicacionUrl}
                        onChange={(e) => setUbicacionUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        aria-invalid={!!errors.ubicacion_url}
                    />
                    {errors.ubicacion_url && (
                        <span className="field-error">{errors.ubicacion_url}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="imagen_url">
                        🖼️ URL de Imagen (opcional)
                    </label>
                    <input
                        id="imagen_url"
                        type="url"
                        value={imagenUrl}
                        onChange={(e) => setImagenUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        aria-invalid={!!errors.imagen_url}
                    />
                    {errors.imagen_url && (
                        <span className="field-error">{errors.imagen_url}</span>
                    )}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="descripcion">Descripción (opcional)</label>
                <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Información adicional sobre el evento..."
                    rows={3}
                    aria-invalid={!!errors.descripcion}
                />
            </div>

            <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1.5rem'
            }}>
                <Link href="/admin" className="btn btn-secondary">
                    Cancelar
                </Link>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    aria-busy={loading}
                >
                    {loading ? 'Guardando...' : isEditing ? '💾 Guardar Cambios' : '💾 Guardar Evento'}
                </button>
            </div>
        </form>
    );
}
