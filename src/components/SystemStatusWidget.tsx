'use client';

import { useState, useEffect } from 'react';

// Lucide-style SVG Icons
const ActivityIcon = () => (
    <svg className="widget-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const RefreshIcon = () => (
    <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

interface StatusItem {
    label: string;
    status: 'online' | 'offline' | 'syncing';
    detail: string;
}

export default function SystemStatusWidget() {
    const [lastSync, setLastSync] = useState<Date>(new Date());
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Update online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const statusItems: StatusItem[] = [
        {
            label: 'Conexión',
            status: isOnline ? 'online' : 'offline',
            detail: isOnline ? 'Conectado' : 'Sin conexión'
        },
        {
            label: 'Base de datos',
            status: 'online',
            detail: 'Supabase activo'
        },
        {
            label: 'Última sincronización',
            status: 'online',
            detail: lastSync.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        }
    ];

    const getStatusColor = (status: StatusItem['status']) => {
        switch (status) {
            case 'online': return 'var(--color-success)';
            case 'offline': return 'var(--color-error)';
            case 'syncing': return 'var(--color-warning)';
        }
    };

    return (
        <div className="bento-cell bento-side">
            <div className="widget-header">
                <ActivityIcon />
                <span className="widget-title">Estado del Sistema</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {statusItems.map((item, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: getStatusColor(item.status),
                                boxShadow: `0 0 8px ${getStatusColor(item.status)}`
                            }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {item.label}
                            </span>
                        </div>
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: getStatusColor(item.status)
                        }}>
                            {item.detail}
                        </span>
                    </div>
                ))}
            </div>

            <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.75rem'
            }}>
                <CheckCircleIcon />
                <span>Todos los sistemas operativos</span>
            </div>
        </div>
    );
}
