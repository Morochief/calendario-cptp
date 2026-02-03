'use client';

import { EventoConModalidad } from '@/lib/types';

interface EventCardProps {
    evento: EventoConModalidad;
}

export default function EventCard({ evento }: EventCardProps) {
    const fecha = new Date(evento.fecha + 'T12:00:00');
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });

    // Usar tipos_evento si existe, sino fallback al campo tipo
    const tipoNombre = evento.tipos_evento?.nombre || evento.tipo || '';
    const tipoColor = evento.tipos_evento?.color || '#6B7280';

    return (
        <div
            className="event-card"
            style={{ borderLeftColor: evento.modalidades?.color || '#DC2626' }}
        >
            <div className="event-date">
                {diaSemana}, {dia} de {mes}
            </div>
            <div className="event-title">{evento.titulo}</div>
            <div className="event-meta">
                {evento.hora && (
                    <span>🕐 {evento.hora.slice(0, 5)} hs</span>
                )}
                {evento.ubicacion && (
                    <span>📍 {evento.ubicacion}</span>
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
            {evento.modalidades && (
                <div style={{ marginTop: '0.5rem' }}>
                    <span
                        className="event-modalidad"
                        style={{
                            background: `${evento.modalidades.color}15`,
                            color: evento.modalidades.color
                        }}
                    >
                        <span
                            className="dot"
                            style={{
                                background: evento.modalidades.color,
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                display: 'inline-block'
                            }}
                        />
                        {evento.modalidades.nombre}
                    </span>
                </div>
            )}
            {evento.descripcion && (
                <p style={{
                    marginTop: '0.5rem',
                    fontSize: '0.8rem',
                    color: '#6B7280'
                }}>
                    {evento.descripcion}
                </p>
            )}
        </div>
    );
}
