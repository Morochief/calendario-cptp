'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase';
import { Modalidad, TipoEvento } from '@/lib/types';

export default function NuevoEventoPage() {
    const [modalidades, setModalidades] = useState<Modalidad[]>([]);
    const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
    const [loading, setLoading] = useState(false);
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
    }, []);

    async function checkAuthAndLoad() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/admin/login');
            return;
        }

        // Load modalidades
        const { data: modalidadesData } = await supabase
            .from('modalidades')
            .select('*')
            .order('nombre');

        if (modalidadesData) {
            setModalidades(modalidadesData);
            if (modalidadesData.length > 0) {
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
            if (tiposData.length > 0) {
                setTipoEventoId(tiposData[0].id);
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();

            const { error: insertError } = await supabase
                .from('eventos')
                .insert({
                    titulo,
                    modalidad_id: modalidadId,
                    fecha,
                    hora,
                    ubicacion: ubicacion || null,
                    descripcion: descripcion || null,
                    tipo_evento_id: tipoEventoId,
                });

            if (insertError) throw insertError;

            router.push('/admin');
        } catch (err) {
            console.error('Error creating event:', err);
            setError('Error al crear el evento');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Header />
            <div className="admin-container">
                <div className="admin-header">
                    <h2 className="section-title">Nuevo Evento</h2>
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
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : '💾 Guardar Evento'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
