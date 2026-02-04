'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase';
import { Inscripcion, Modalidad, Evento, TipoEvento } from '@/lib/types';

export default function InscripcionesPage() {
    const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
    const [modalidades, setModalidades] = useState<Modalidad[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [tiposEvento, setTiposEvento] = useState<TipoEvento[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterModalidad, setFilterModalidad] = useState<string>('');

    // Form state
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [modalidadId, setModalidadId] = useState('');
    const [tipoEventoId, setTipoEventoId] = useState('');
    const [eventoId, setEventoId] = useState('');
    const [notas, setNotas] = useState('');
    const [saving, setSaving] = useState(false);

    const router = useRouter();

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

        await Promise.all([loadInscripciones(), loadModalidades(), loadEventos(), loadTiposEvento()]);
        setLoading(false);
    }

    async function loadInscripciones() {
        const supabase = createClient();
        const { data } = await supabase
            .from('inscripciones')
            .select(`
                *,
                modalidades (*),
                eventos (*),
                tipos_evento (*)
            `)
            .order('created_at', { ascending: false });

        if (data) {
            setInscripciones(data);
        }
    }

    async function loadModalidades() {
        const supabase = createClient();
        const { data } = await supabase.from('modalidades').select('*').order('nombre');
        if (data) {
            setModalidades(data);
            if (data.length > 0 && !modalidadId) {
                setModalidadId(data[0].id);
            }
        }
    }

    async function loadEventos() {
        const supabase = createClient();
        const { data } = await supabase.from('eventos').select('*').order('fecha');
        if (data) {
            setEventos(data);
        }
    }

    async function loadTiposEvento() {
        const supabase = createClient();
        const { data } = await supabase.from('tipos_evento').select('*').order('nombre');
        if (data) {
            setTiposEvento(data);
            if (data.length > 0 && !tipoEventoId) {
                setTipoEventoId(data[0].id);
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const supabase = createClient();

        const inscripcionData = {
            nombre,
            telefono,
            email: email || null,
            modalidad_id: modalidadId,
            tipo_evento_id: tipoEventoId || null,
            evento_id: eventoId || null,
            notas: notas || null,
        };

        if (editingId) {
            await supabase.from('inscripciones').update(inscripcionData).eq('id', editingId);
        } else {
            await supabase.from('inscripciones').insert(inscripcionData);
        }

        resetForm();
        await loadInscripciones();
        setSaving(false);
    }

    function resetForm() {
        setNombre('');
        setTelefono('');
        setEmail('');
        setModalidadId(modalidades[0]?.id || '');
        setTipoEventoId(tiposEvento[0]?.id || '');
        setEventoId('');
        setNotas('');
        setEditingId(null);
        setShowForm(false);
    }

    function handleEdit(insc: Inscripcion & { tipo_evento_id?: string }) {
        setEditingId(insc.id);
        setNombre(insc.nombre);
        setTelefono(insc.telefono);
        setEmail(insc.email || '');
        setModalidadId(insc.modalidad_id);
        setTipoEventoId(insc.tipo_evento_id || tiposEvento[0]?.id || '');
        setEventoId(insc.evento_id || '');
        setNotas(insc.notas || '');
        setShowForm(true);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar esta inscripción?')) return;
        const supabase = createClient();
        await supabase.from('inscripciones').delete().eq('id', id);
        await loadInscripciones();
    }

    const filteredInscripciones = filterModalidad
        ? inscripciones.filter(i => i.modalidad_id === filterModalidad)
        : inscripciones;

    const eventosDeModalidad = eventos.filter(e => e.modalidad_id === modalidadId);

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <div className="loading"><div className="spinner"></div></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h2 className="section-title">Inscripciones</h2>
                        <Link href="/admin" style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            ← Volver al panel
                        </Link>
                    </div>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            ➕ Nueva Inscripción
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>
                            {editingId ? 'Editar Inscripción' : 'Nueva Inscripción'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label htmlFor="nombre">Nombre completo *</label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Juan Pérez"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="telefono">Teléfono *</label>
                                    <input
                                        id="telefono"
                                        type="tel"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        placeholder="0981 123 456"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label htmlFor="email">Email (opcional)</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="modalidad">Modalidad *</label>
                                    <select
                                        id="modalidad"
                                        value={modalidadId}
                                        onChange={(e) => {
                                            setModalidadId(e.target.value);
                                            setEventoId('');
                                        }}
                                        required
                                    >
                                        {modalidades.map(m => (
                                            <option key={m.id} value={m.id}>{m.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label htmlFor="tipoEvento">Tipo de Evento *</label>
                                    <select
                                        id="tipoEvento"
                                        value={tipoEventoId}
                                        onChange={(e) => setTipoEventoId(e.target.value)}
                                        required
                                    >
                                        {tiposEvento.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="evento">Evento específico (opcional)</label>
                                    <select
                                        id="evento"
                                        value={eventoId}
                                        onChange={(e) => setEventoId(e.target.value)}
                                    >
                                        <option value="">-- Inscripción general --</option>
                                        {eventosDeModalidad.map(e => (
                                            <option key={e.id} value={e.id}>
                                                {new Date(e.fecha + 'T12:00:00').toLocaleDateString('es-ES')} - {e.titulo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="notas">Notas (opcional)</label>
                                <textarea
                                    id="notas"
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    placeholder="Observaciones adicionales..."
                                    rows={2}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : '💾 Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Participantes ({filteredInscripciones.length})</h3>
                        <select
                            value={filterModalidad}
                            onChange={(e) => setFilterModalidad(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '6px', border: '2px solid #E5E7EB' }}
                        >
                            <option value="">Todas las modalidades</option>
                            {modalidades.map(m => (
                                <option key={m.id} value={m.id}>{m.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {filteredInscripciones.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                            No hay inscripciones registradas.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Teléfono</th>
                                        <th>Modalidad</th>
                                        <th>Tipo</th>
                                        <th>Evento</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInscripciones.map((insc: Inscripcion & { tipos_evento?: TipoEvento }) => (
                                        <tr key={insc.id}>
                                            <td style={{ fontWeight: 500 }}>{insc.nombre}</td>
                                            <td>
                                                <a
                                                    href={`https://wa.me/595${insc.telefono.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: '#25D366' }}
                                                >
                                                    📱 {insc.telefono}
                                                </a>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    padding: '0.25rem 0.5rem',
                                                    background: `${insc.modalidades?.color}15`,
                                                    color: insc.modalidades?.color,
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    {insc.modalidades?.nombre}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: `${insc.tipos_evento?.color || '#6B7280'}15`,
                                                    color: insc.tipos_evento?.color || '#6B7280',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 500
                                                }}>
                                                    {insc.tipos_evento?.nombre || '-'}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                                {insc.eventos?.titulo || 'General'}
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        onClick={() => handleEdit(insc)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(insc.id)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
