'use client';

import { EventoConModalidad } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface EventModalProps {
    evento: EventoConModalidad | null;
    onClose: () => void;
}

function isValidImageUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export default function EventModal({ evento, onClose }: EventModalProps) {
    const [mounted, setMounted] = useState(false);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        setMounted(true);
        if (evento) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [evento, handleEscape]);

    if (!mounted || !evento) return null;

    const fecha = new Date(evento.fecha + 'T12:00:00');
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'long' });
    const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
    const anio = fecha.getFullYear();

    const tipoNombre = evento.tipos_evento?.nombre || evento.tipo || '';
    const tipoColor = evento.tipos_evento?.color || '#94A3B8';
    const modalityColor = evento.modalidades?.color || '#DC2626';

    const hasValidImage = !!evento.imagen_url && isValidImageUrl(evento.imagen_url);

    return createPortal(
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                animation: 'modalFadeIn 0.2s ease',
            }}
        >
            <div
                style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    width: '100%',
                    maxWidth: '520px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                    position: 'relative',
                    animation: 'modalScaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Cerrar modal"
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        border: '1px solid var(--border-hover)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-hover)';
                    }}
                >
                    {/* X icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Image */}
                {hasValidImage && (
                    <div style={{
                        width: '100%',
                        background: 'var(--bg-elevated)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderRadius: '16px 16px 0 0',
                        overflow: 'hidden',
                    }}>
                        <img
                            src={evento.imagen_url!}
                            alt={evento.titulo}
                            style={{
                                maxWidth: '100%', maxHeight: '300px',
                                objectFit: 'contain', display: 'block',
                            }}
                        />
                    </div>
                )}

                {/* Color accent bar */}
                <div style={{ height: '4px', background: modalityColor, borderRadius: hasValidImage ? '0' : '16px 16px 0 0' }} />

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {evento.modalidades && (
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 600,
                                padding: '0.375rem 0.75rem', borderRadius: '100px',
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                color: modalityColor,
                                background: `${modalityColor}20`,
                                border: `1px solid ${modalityColor}40`,
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: modalityColor }} />
                                {evento.modalidades.nombre}
                            </span>
                        )}
                        {tipoNombre && (
                            <span style={{
                                fontSize: '0.6875rem', fontWeight: 600,
                                padding: '0.25rem 0.625rem', borderRadius: '6px',
                                color: tipoColor,
                                border: `1px solid ${tipoColor}40`,
                                background: `${tipoColor}15`,
                            }}>
                                {tipoNombre}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2
                        id="event-modal-title"
                        style={{
                            fontSize: '1.375rem', fontWeight: 700,
                            color: 'var(--text-primary)', marginBottom: '1.25rem',
                            lineHeight: 1.3, letterSpacing: '-0.02em',
                        }}
                    >
                        {evento.titulo}
                    </h2>

                    {/* Info items */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'var(--bg-elevated)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        {/* Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: `${modalityColor}20`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', textTransform: 'capitalize' }}>
                                {diaSemana}, {dia} de {mes} {anio}
                            </span>
                        </div>

                        {/* Time */}
                        {evento.hora && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: `${modalityColor}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                                    {evento.hora.slice(0, 5)} hs
                                </span>
                            </div>
                        )}

                        {/* Location */}
                        {evento.ubicacion && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: `${modalityColor}20`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                                    {evento.ubicacion}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {evento.descripcion && (
                        <div style={{
                            padding: '1rem',
                            background: 'var(--bg-elevated)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                            marginBottom: '1.5rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            fontSize: '0.9375rem',
                            whiteSpace: 'pre-line',
                        }}>
                            {evento.descripcion}
                        </div>
                    )}

                    {/* Maps button */}
                    {evento.ubicacion_url && (
                        <a
                            href={evento.ubicacion_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem',
                                width: '100%', padding: '0.875rem',
                                borderRadius: '10px',
                                background: `${modalityColor}20`,
                                border: `1px solid ${modalityColor}40`,
                                color: modalityColor,
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                            </svg>
                            Ver ubicación en Google Maps
                        </a>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}
