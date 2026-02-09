'use client';

import { EventoConModalidad } from '@/lib/types';

// Lucide-style SVG Icons (1.2px stroke)
const ClockIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const MapPinIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const NavigationIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
);

interface EventCardProps {
    evento: EventoConModalidad;
}

export default function EventCard({ evento }: EventCardProps) {
    const fecha = new Date(evento.fecha + 'T12:00:00');
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });

    const tipoNombre = evento.tipos_evento?.nombre || evento.tipo || '';
    const tipoColor = evento.tipos_evento?.color || '#6B7280';
    const hasImage = !!evento.imagen_url;

    return (
        <div
            className={`event-card ${hasImage ? 'has-image' : ''}`}
            style={{
                borderLeftColor: evento.modalidades?.color || '#DC2626',
                overflow: 'hidden'
            }}
        >
            {hasImage && (
                <div
                    className="event-hero-image"
                    style={{
                        backgroundImage: `url(${evento.imagen_url})`,
                        height: '140px',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '100%'
                    }}
                />
            )}

            <div className="event-content" style={{ padding: '1.25rem' }}>
                <div className="event-date">
                    {diaSemana}, {dia} de {mes}
                </div>
                <div className="event-title">{evento.titulo}</div>

                <div className="event-meta">
                    {evento.hora && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <ClockIcon />
                            {evento.hora.slice(0, 5)} hs
                        </span>
                    )}

                    {tipoNombre && (
                        <span
                            style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background: `${tipoColor}20`,
                                color: tipoColor
                            }}
                        >
                            {tipoNombre}
                        </span>
                    )}
                </div>

                {evento.ubicacion && (
                    <div className="event-location-row" style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPinIcon />
                        <span>{evento.ubicacion}</span>
                    </div>
                )}

                {evento.modalidades && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <span
                            className="event-modalidad"
                            style={{
                                background: `${evento.modalidades.color}15`,
                                color: evento.modalidades.color,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 600
                            }}
                        >
                            <span
                                className="dot"
                                style={{
                                    background: evento.modalidades.color,
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                }}
                            />
                            {evento.modalidades.nombre}
                        </span>
                    </div>
                )}

                {evento.descripcion && (
                    <p style={{
                        marginTop: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                    }}>
                        {evento.descripcion}
                    </p>
                )}

                {evento.ubicacion_url && (
                    <a
                        href={evento.ubicacion_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-location-action"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            width: '100%',
                            padding: '0.6rem',
                            background: 'var(--bg-hover)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all var(--transition-normal)'
                        }}
                    >
                        <NavigationIcon />
                        Cómo llegar
                    </a>
                )}
            </div>
        </div>
    );
}
