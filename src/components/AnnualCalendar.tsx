'use client';

import { useState } from 'react';
import { EventoConModalidad } from '@/lib/types';
import MiniMonth from './MiniMonth';
import EventModal from './EventModal';

const MESES_COMPLETOS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface AnnualCalendarProps {
    eventos: EventoConModalidad[];
    year?: number;
}

export default function AnnualCalendar({ eventos, year = 2026 }: AnnualCalendarProps) {
    const [selectedEvent, setSelectedEvent] = useState<EventoConModalidad | null>(null);

    return (
        <>
            <div className="annual-calendar">
                <div className="annual-grid">
                    {MESES_COMPLETOS.map((mes, index) => (
                        <MiniMonth
                            key={mes}
                            mes={mes}
                            mesIndex={index}
                            year={year}
                            eventos={eventos}
                            onEventClick={setSelectedEvent}
                        />
                    ))}
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
