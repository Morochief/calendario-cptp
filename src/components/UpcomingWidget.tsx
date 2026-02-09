'use client';

import { EventoConModalidad } from '@/lib/types';

// Lucide-style SVG Icons
const CalendarClockIcon = () => (
    <svg className="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h5" />
        <circle cx="18" cy="18" r="5" />
        <path d="M18 15.5v3l1.5 1.5" />
    </svg>
);

interface UpcomingWidgetProps {
    eventos: EventoConModalidad[];
}

export default function UpcomingWidget({ eventos }: UpcomingWidgetProps) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const proximosEventos = eventos
        .filter(e => new Date(e.fecha) >= now)
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .slice(0, 5);

    const formatDate = (fecha: string) => {
        const date = new Date(fecha + 'T12:00:00');
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const getDaysUntil = (fecha: string) => {
        const eventDate = new Date(fecha + 'T12:00:00');
        const diffTime = eventDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        return `${diffDays} días`;
    };

    return (
        <div className="bento-cell bento-side">
            <div className="widget-header">
                <CalendarClockIcon />
                <span className="widget-title">Próximos Eventos</span>
            </div>

            {proximosEventos.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic'
                }}>
                    No hay eventos próximos
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {proximosEventos.map((evento, idx) => (
                        <div
                            key={evento.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                transition: 'all var(--transition-fast)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '0.5rem',
                                background: `${evento.modalidades?.color || 'var(--color-primary)'}15`,
                                borderRadius: 'var(--radius-sm)',
                                minWidth: '50px'
                            }}>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: evento.modalidades?.color || 'var(--color-primary)',
                                    textTransform: 'uppercase',
                                    fontWeight: 600
                                }}>
                                    {getDaysUntil(evento.fecha)}
                                </span>
                                <span style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)'
                                }}>
                                    {formatDate(evento.fecha)}
                                </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {evento.titulo}
                                </div>
                                {evento.modalidades && (
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: evento.modalidades.color,
                                        marginTop: '0.25rem'
                                    }}>
                                        {evento.modalidades.nombre}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
