'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase';
import { Modalidad, TipoEvento } from '@/lib/types';

export default function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [modalidades, setModalidades] = useState<Modalidad[]>([]);
    const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Form state
    const [titulo, setTitulo] = useState('');
    const [modalidadId, setModalidadId] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('08:30');
    const [ubicacion, setUbicacion] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipoEventoId, setTipoEventoId] = useState('');

    useEffect(() => {
        checkAuthAndLoad();
    }, [id]);

    async function checkAuthAndLoad() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/admin/login');
            return;
        }

        // Load modalidades
        const { data: mods } = await supabase
            .from('modalidades')
            .select('*')
            .order('nombre');

        if (mods) {
            setModalidades(mods);
        }

        // Load tipos de evento
        const { data: tipos } = await supabase
            .from('tipos_evento')
            .select('*')
            .order('nombre');

        if (tipos) {
            setTiposEvento(tipos);
        }

        // Load evento
        const { data: evento } = await supabase
            .from('eventos')
            .select('*')
            .eq('id', id)
            .single();

        if (evento) {
            setTitulo(evento.titulo);
            setModalidadId(evento.modalidad_id);
            setFecha(evento.fecha);
            setHora(evento.hora || '08:30');
            setUbicacion(evento.ubicacion || '');
            setDescripcion(evento.descripcion || '');
            setTipoEventoId(evento.tipo_evento_id || (tipos && tipos.length > 0 ? tipos[0].id : ''));
        }

        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: updateError } = await supabase
                .from('eventos')
                .update({
                    titulo,
                    modalidad_id: modalidadId,
                    fecha,
                    hora,
                    ubicacion: ubicacion || null,
                    descripcion: descripcion || null,
                    tipo_evento_id: tipoEventoId,
                })
                .eq('id', id);

            if (updateError) throw updateError;

            router.push('/admin');
        } catch (err) {
            console.error('Error updating event:', err);
            setError('Error al actualizar el evento');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container">
                <div className="admin-header">
                    <h2 className="section-title">Editar Evento</h2>
                    <Link href="/admin" className="btn btn-secondary">
                        ← Volver
                    </Link>
                </div>

                <div className="admin-card">
                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="titulo">Título del evento *</label>
                            <input
                                id="titulo"
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                placeholder="Ej: 1.ª Fecha Campeonato Nacional"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label htmlFor="modalidad">Modalidad *</label>
                                <select
                                    id="modalidad"
                                    value={modalidadId}
                                    onChange={(e) => setModalidadId(e.target.value)}
                                    required
                                >
                                    {modalidades.map(mod => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="tipo">Tipo de evento *</label>
                                <select
                                    id="tipo"
                                    value={tipoEventoId}
                                    onChange={(e) => setTipoEventoId(e.target.value)}
                                    required
                                >
                                    {tiposEvento.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label htmlFor="fecha">Fecha *</label>
                                <input
                                    id="fecha"
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    min="2026-01-01"
                                    max="2026-11-30"
                                    required
                                />
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
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="descripcion">Descripción (opcional)</label>
                            <textarea
                                id="descripcion"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Información adicional sobre el evento..."
                                rows={3}
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
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
