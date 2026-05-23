'use client';

import { useState } from 'react';
import ModalityFilter from '@/components/ModalityFilter';
import MonthCard from '@/components/MonthCard';
import AnnualCalendar from '@/components/AnnualCalendar';
import MetricsWidget from '@/components/MetricsWidget';
import UpcomingWidget from '@/components/UpcomingWidget';
import { Modalidad, EventoConModalidad, MESES } from '@/lib/types';

// Lucide-style SVG Icons (1.2px stroke)
const CalendarIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const GridIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

type ViewType = 'mensual' | 'anual';

interface CalendarShellProps {
    initialEventos: EventoConModalidad[];
    initialModalidades: Modalidad[];
}

export default function CalendarShell({ initialEventos, initialModalidades }: CalendarShellProps) {
    const [selectedModalidad, setSelectedModalidad] = useState<string | null>(null);
    const [vista, setVista] = useState<ViewType>('mensual');

    const eventosFiltrados = selectedModalidad
        ? initialEventos.filter(e => e.modalidad_id === selectedModalidad)
        : initialEventos;

    return (
        <>
            {/* Main Calendar Cell */}
            <div className="bento-cell bento-main">
                <div className="calendar-header">
                    <h2 className="section-title">Competencias 2026</h2>

                    <div className="view-toggle">
                        <button
                            className={`view-btn ${vista === 'mensual' ? 'active' : ''}`}
                            onClick={() => setVista('mensual')}
                        >
                            <CalendarIcon />
                            Mensual
                        </button>
                        <button
                            className={`view-btn ${vista === 'anual' ? 'active' : ''}`}
                            onClick={() => setVista('anual')}
                        >
                            <GridIcon />
                            Anual
                        </button>
                    </div>
                </div>

                {initialModalidades.length > 0 && (
                    <ModalityFilter
                        modalidades={initialModalidades}
                        selected={selectedModalidad}
                        onSelect={setSelectedModalidad}
                    />
                )}

                {vista === 'mensual' ? (
                    <div className="calendar-grid">
                        {MESES.map((mes, index) => (
                            <MonthCard
                                key={mes}
                                mes={mes}
                                mesIndex={index}
                                eventos={eventosFiltrados}
                            />
                        ))}
                    </div>
                ) : (
                    <AnnualCalendar eventos={eventosFiltrados} year={2026} />
                )}
            </div>

            {/* Side Widgets */}
            <MetricsWidget eventos={initialEventos} modalidades={initialModalidades} />
            <UpcomingWidget eventos={initialEventos} />
        </>
    );
}
