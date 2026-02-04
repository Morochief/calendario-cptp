'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase';
import { Evento, Modalidad, TipoEvento } from '@/lib/types';

export default function AdminPage() {
    const [eventos, setEventos] = useState<(Evento & { modalidades: Modalidad; tipos_evento?: TipoEvento })[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/admin/login');
            return;
        }

        setUser(user);
        loadEventos();
    }

    async function loadEventos() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('eventos')
            .select(`
        *,
        modalidades (*),
        tipos_evento (*)
      `)
            .order('fecha');

        if (!error && data) {
            setEventos(data);
        }
        setLoading(false);
    }

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/admin/login');
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('eventos')
            .delete()
            .eq('id', id);

        if (!error) {
            setEventos(eventos.filter(e => e.id !== id));
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
                    <div>
                        <h2 className="section-title">Panel de Administración</h2>
                        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            Bienvenido, {user?.email}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href="/admin/eventos/nuevo" className="btn btn-primary">
                            ➕ Nuevo Evento
                        </Link>
                        <Link href="/admin/inscripciones" className="btn btn-primary" style={{ background: '#059669' }}>
                            👥 Inscripciones
                        </Link>
                        <Link href="/admin/modalidades" className="btn btn-secondary">
                            🏷️ Modalidades
                        </Link>
                        <Link href="/admin/tipos-evento" className="btn btn-secondary">
                            📋 Tipos
                        </Link>
                        <button onClick={handleLogout} className="btn btn-secondary">
                            Cerrar sesión
                        </button>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>
                        Eventos ({eventos.length})
                    </h3>

                    {eventos.length === 0 ? (
                        <p style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: '#6B7280'
                        }}>
                            No hay eventos creados. ¡Crea el primero!
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Título</th>
                                        <th>Modalidad</th>
                                        <th>Tipo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventos.map(evento => {
                                        const fecha = new Date(evento.fecha + 'T12:00:00');
                                        return (
                                            <tr key={evento.id}>
                                                <td>
                                                    {fecha.toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{evento.titulo}</td>
                                                <td>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            padding: '0.25rem 0.5rem',
                                                            background: `${evento.modalidades?.color}15`,
                                                            color: evento.modalidades?.color,
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <span style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: evento.modalidades?.color
                                                        }} />
                                                        {evento.modalidades?.nombre}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 500,
                                                        background: `${evento.tipos_evento?.color || '#6B7280'}15`,
                                                        color: evento.tipos_evento?.color || '#6B7280'
                                                    }}>
                                                        {evento.tipos_evento?.nombre || evento.tipo}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <Link
                                                            href={`/admin/eventos/${evento.id}`}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                        >
                                                            ✏️ Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(evento.id)}
                                                            className="btn btn-danger"
                                                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
