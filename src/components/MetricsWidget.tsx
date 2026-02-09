'use client';

import { EventoConModalidad, Modalidad } from '@/lib/types';

// Lucide-style SVG Icons
const BarChartIcon = () => (
    <svg className="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
);

interface MetricsWidgetProps {
    eventos: EventoConModalidad[];
    modalidades: Modalidad[];
}

export default function MetricsWidget({ eventos, modalidades }: MetricsWidgetProps) {
    // Calculate metrics
    const totalEventos = eventos.length;
    const eventosEsteMes = eventos.filter(e => {
        const eventoDate = new Date(e.fecha);
        const now = new Date();
        return eventoDate.getMonth() === now.getMonth() && eventoDate.getFullYear() === now.getFullYear();
    }).length;

    // Count by modalidad
    const eventosPorModalidad = modalidades.map(m => ({
        nombre: m.nombre,
        color: m.color,
        count: eventos.filter(e => e.modalidad_id === m.id).length
    })).filter(m => m.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

    return (
        <div className="bento-cell bento-side">
            <div className="widget-header">
                <BarChartIcon />
                <span className="widget-title">Métricas</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                    background: 'var(--bg-elevated)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {totalEventos}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Total Eventos
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-elevated)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        {eventosEsteMes}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Este Mes
                    </div>
                </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Por Modalidad
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {eventosPorModalidad.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: m.color,
                            flexShrink: 0
                        }} />
                        <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {m.nombre}
                        </span>
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            background: 'var(--bg-hover)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-sm)'
                        }}>
                            {m.count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
