'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import EmptyState from '@/components/EmptyState';
import Pagination from '@/components/Pagination';
import SystemStatusWidget from '@/components/SystemStatusWidget';
import { TableSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

import { createClient } from '@/lib/supabase';
import { Evento, Modalidad, TipoEvento } from '@/lib/types';

// Lucide-style SVG Icons (1.2px stroke)
const PlusIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const UsersIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const TagIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
);

const ListIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
);

const FileTextIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const EditIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

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
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Cargando eventos...</h3>
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
            <div className="bento-grid" id="main-content">
                {/* Main Admin Card */}
                <div className="bento-cell bento-main">
                    <Breadcrumbs />
                    <div className="admin-header">
                        <h2 className="section-title">Panel de Administración</h2>
                    </div>

                    {/* Toolbar de acciones */}
                    <div className="admin-toolbar" style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '1.5rem'
                    }}>
                        <div className="toolbar-group">
                            <span className="toolbar-label" style={{ color: 'var(--text-muted)' }}>Acciones</span>
                            <div className="toolbar-buttons">
                                <Link href="/admin/eventos/nuevo" className="btn btn-primary" aria-label="Crear nuevo evento">
                                    <PlusIcon />
                                    Nuevo Evento
                                </Link>
                                <Link href="/admin/inscripciones" className="btn btn-success" aria-label="Ver inscripciones">
                                    <UsersIcon />
                                    Inscripciones
                                </Link>
                            </div>
                        </div>
                        <div className="toolbar-divider" style={{ background: 'var(--border-subtle)' }} />
                        <div className="toolbar-group">
                            <span className="toolbar-label" style={{ color: 'var(--text-muted)' }}>Configuración</span>
                            <div className="toolbar-buttons">
                                <Link href="/admin/modalidades" className="btn btn-outline" aria-label="Gestionar modalidades">
                                    <TagIcon />
                                    Modalidades
                                </Link>
                                <Link href="/admin/tipos-evento" className="btn btn-outline" aria-label="Gestionar tipos de evento">
                                    <ListIcon />
                                    Tipos
                                </Link>
                                <Link href="/admin/reglamentos" className="btn btn-outline" aria-label="Gestionar reglamentos">
                                    <FileTextIcon />
                                    Reglamentos
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="admin-card" style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-inner)'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                            Eventos ({eventos.length})
                        </h3>

                        {eventos.length === 0 ? (
                            <EmptyState
                                icon={<CalendarIcon />}
                                title="No hay eventos creados"
                                description="Comienza creando tu primer evento para el calendario."
                                actionLabel="Crear evento"
                                actionHref="/admin/eventos/nuevo"
                            />
                        ) : (
                            <>
                                <div className="admin-table-wrapper">
                                    <table className="admin-table" role="table" aria-label="Lista de eventos">
                                        <thead>
                                            <tr>
                                                <th scope="col" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                                                <th scope="col" style={{ color: 'var(--text-muted)' }}>Título</th>
                                                <th scope="col" style={{ color: 'var(--text-muted)' }}>Modalidad</th>
                                                <th scope="col" style={{ color: 'var(--text-muted)' }}>Tipo</th>
                                                <th scope="col" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedEventos.map(evento => {
                                                const fecha = new Date(evento.fecha + 'T12:00:00');
                                                return (
                                                    <tr key={evento.id}>
                                                        <td data-label="Fecha" style={{ color: 'var(--text-secondary)' }}>
                                                            {fecha.toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </td>
                                                        <td data-label="Título" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{evento.titulo}</td>
                                                        <td data-label="Modalidad">
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
                                                        <td data-label="Tipo">
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
                                                        <td data-label="Acciones">
                                                            <div className="admin-actions">
                                                                <Link
                                                                    href={`/admin/eventos/${evento.id}`}
                                                                    className="btn btn-secondary"
                                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                                    aria-label={`Editar evento ${evento.titulo}`}
                                                                >
                                                                    <EditIcon />
                                                                    Editar
                                                                </Link>
                                                                <button
                                                                    onClick={() => handleDelete(evento.id)}
                                                                    className="btn btn-danger"
                                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                                    aria-label={`Eliminar evento ${evento.titulo}`}
                                                                >
                                                                    <TrashIcon />
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

                {/* System Status Widget */}
                <SystemStatusWidget />
            </div>
        </>
    );
}
