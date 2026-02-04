'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

import { createClient } from '@/lib/supabase';
import { Evento, Modalidad, TipoEvento } from '@/lib/types';

const ITEMS_PER_PAGE = 10;

export default function AdminPage() {
    const [eventos, setEventos] = useState<(Evento & { modalidades: Modalidad; tipos_evento?: TipoEvento })[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();
    const { showToast } = useToast();

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



    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('eventos')
            .delete()
            .eq('id', id);

        if (!error) {
            setEventos(eventos.filter(e => e.id !== id));
            showToast('Evento eliminado correctamente', 'success');
        } else {
            showToast('Error al eliminar el evento', 'error');
        }
    }

    // Pagination
    const totalPages = Math.ceil(eventos.length / ITEMS_PER_PAGE);
    const paginatedEventos = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return eventos.slice(start, start + ITEMS_PER_PAGE);
    }, [eventos, currentPage]);

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <Breadcrumbs />
                    <div className="admin-card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Cargando eventos...</h3>
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
                                <TableSkeleton rows={5} columns={5} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container" id="main-content">
                <Breadcrumbs />
                <div className="admin-header">
                    <h2 className="section-title">Panel de Administración</h2>
                </div>

                {/* Toolbar de acciones */}
                <div className="admin-toolbar">
                    <div className="toolbar-group">
                        <span className="toolbar-label">Acciones</span>
                        <div className="toolbar-buttons">
                            <Link href="/admin/eventos/nuevo" className="btn btn-primary" aria-label="Crear nuevo evento">
                                ➕ Nuevo Evento
                            </Link>
                            <Link href="/admin/inscripciones" className="btn btn-success" aria-label="Ver inscripciones">
                                👥 Inscripciones
                            </Link>
                        </div>
                    </div>
                    <div className="toolbar-divider" />
                    <div className="toolbar-group">
                        <span className="toolbar-label">Configuración</span>
                        <div className="toolbar-buttons">
                            <Link href="/admin/modalidades" className="btn btn-outline" aria-label="Gestionar modalidades">
                                🏷️ Modalidades
                            </Link>
                            <Link href="/admin/tipos-evento" className="btn btn-outline" aria-label="Gestionar tipos de evento">
                                📋 Tipos
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>
                        Eventos ({eventos.length})
                    </h3>

                    {eventos.length === 0 ? (
                        <EmptyState
                            icon="📅"
                            title="No hay eventos creados"
                            description="Comienza creando tu primer evento para el calendario."
                            actionLabel="➕ Crear evento"
                            actionHref="/admin/eventos/nuevo"
                        />
                    ) : (
                        <>
                            <div className="admin-table-wrapper">
                                <table className="admin-table" role="table" aria-label="Lista de eventos">
                                    <thead>
                                        <tr>
                                            <th scope="col">Fecha</th>
                                            <th scope="col">Título</th>
                                            <th scope="col">Modalidad</th>
                                            <th scope="col">Tipo</th>
                                            <th scope="col">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEventos.map(evento => {
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
                                                            }} aria-hidden="true" />
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
                                                            {evento.tipos_evento?.nombre || evento.tipo || '-'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <Link
                                                                href={`/admin/eventos/${evento.id}`}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                                aria-label={`Editar evento ${evento.titulo}`}
                                                            >
                                                                ✏️ Editar
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(evento.id)}
                                                                className="btn btn-danger"
                                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                                aria-label={`Eliminar evento ${evento.titulo}`}
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
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={eventos.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
