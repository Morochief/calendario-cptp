'use client';

import { useState } from 'react';
import { MESES, EventoConModalidad } from '@/lib/types';
import EventModal from './EventModal';

interface MonthCardProps {
    mes: typeof MESES[number];
    mesIndex: number;
    eventos: EventoConModalidad[];
}

export default function MonthCard({ mes, mesIndex, eventos }: MonthCardProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventoConModalidad | null>(null);

    const eventosDelMes = eventos.filter(e => {
        const fecha = new Date(e.fecha + 'T12:00:00');
        return fecha.getMonth() === mesIndex;
    }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return (
        <>
            <div className="month-card">
                <div className="month-header">
                    <span className="month-header-name">{mes}</span>
                    <span className="month-header-year">2026</span>
                </div>
                <div className="month-content">
                    {eventosDelMes.length === 0 ? (
                        <div className="month-empty">
                            Sin eventos programados
                        </div>
                    ) : (
                        <div className="month-event-list">
                            {eventosDelMes.map(evento => {
                                const modalityColor = evento.modalidades?.color || '#DC2626';
                                return (
                                    <div
                                        key={evento.id}
                                        className="event-row"
                                        style={{ borderLeftColor: modalityColor, cursor: 'pointer' }}
                                        onClick={() => setSelectedEvent(evento)}
                                    >
                                        <span className="event-row-date">
                                            {new Date(evento.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).replace('.', '')}
                                        </span>
                                        <span className="event-row-title">
                                            {evento.titulo}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedEvent && (
                <EventModal
                    evento={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </>
    );
}
