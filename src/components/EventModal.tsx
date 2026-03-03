'use client';

import { EventoConModalidad, ImagenEvento } from '@/lib/types';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase';

interface EventModalProps {
    evento: EventoConModalidad | null;
    onClose: () => void;
}

function isValidImageUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        try { new URL(url, 'http://x'); return true; } catch { return false; }
    }
}

export default function EventModal({ evento, onClose }: EventModalProps) {
    const [mounted, setMounted] = useState(false);
    const [imagenes, setImagenes] = useState<ImagenEvento[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') setCurrentSlide(s => Math.min(s + 1, imagenes.length - 1));
        if (e.key === 'ArrowLeft') setCurrentSlide(s => Math.max(s - 1, 0));
    }, [onClose, imagenes.length]);

    useEffect(() => {
        setMounted(true);
        if (evento) {
            document.body.style.overflow = 'hidden';
            document.addEventListener('keydown', handleEscape);
            // Load gallery images
            const supabase = createClient();
            supabase
                .from('imagenes_evento')
                .select('*')
                .eq('evento_id', evento.id)
                .order('orden', { ascending: true })
                .then(({ data }) => {
                    setImagenes(data || []);
                    setCurrentSlide(0);
                });
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
    const hasGallery = imagenes.length > 0;

    const prevSlide = () => setCurrentSlide(s => Math.max(s - 1, 0));
    const nextSlide = () => setCurrentSlide(s => Math.min(s + 1, imagenes.length - 1));

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
                background: 'rgba(0, 0, 0, 0.75)',
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
                    maxWidth: '560px',
                    maxHeight: '92vh',
                    overflowY: 'auto',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
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
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Main Event Image */}
                {hasValidImage && !hasGallery && (
                    <div style={{
                        width: '100%', background: 'var(--bg-elevated)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderRadius: '16px 16px 0 0', overflow: 'hidden',
                    }}>
                        <img src={evento.imagen_url!} alt={evento.titulo}
                            style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} />
                    </div>
                )}

                {/* Color accent bar */}
                <div style={{ height: '4px', background: modalityColor, borderRadius: (hasValidImage && !hasGallery) ? '0' : '16px 16px 0 0' }} />

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        {evento.modalidades && (
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 600,
                                padding: '0.375rem 0.75rem', borderRadius: '100px',
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                color: modalityColor, background: `${modalityColor}20`, border: `1px solid ${modalityColor}40`,
                            }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: modalityColor }} />
                                {evento.modalidades.nombre}
                            </span>
                        )}
                        {tipoNombre && (
                            <span style={{
                                fontSize: '0.6875rem', fontWeight: 600,
                                padding: '0.25rem 0.625rem', borderRadius: '6px',
                                color: tipoColor, border: `1px solid ${tipoColor}40`, background: `${tipoColor}15`,
                            }}>
                                {tipoNombre}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h2 id="event-modal-title" style={{
                        fontSize: '1.375rem', fontWeight: 700,
                        color: 'var(--text-primary)', marginBottom: '1.25rem',
                        lineHeight: 1.3, letterSpacing: '-0.02em',
                    }}>
                        {evento.titulo}
                    </h2>

                    {/* Info items */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                        marginBottom: '1.5rem', padding: '1rem',
                        background: 'var(--bg-elevated)', borderRadius: '10px',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        {/* Date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${modalityColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', textTransform: 'capitalize' }}>
                                {diaSemana}, {dia} de {mes} {anio}
                            </span>
                        </div>
                        {evento.hora && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${modalityColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{evento.hora.slice(0, 5)} hs</span>
                            </div>
                        )}
                        {evento.ubicacion && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${modalityColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{evento.ubicacion}</span>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {evento.descripcion && (
                        <div style={{
                            padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '10px',
                            border: '1px solid var(--border-subtle)', marginBottom: '1.5rem',
                            color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem', whiteSpace: 'pre-line',
                        }}>
                            {evento.descripcion}
                        </div>
                    )}

                    {/* Maps button */}
                    {evento.ubicacion_url && (
                        <a href={evento.ubicacion_url} target="_blank" rel="noopener noreferrer"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                width: '100%', padding: '0.875rem', borderRadius: '10px',
                                background: `${modalityColor}20`, border: `1px solid ${modalityColor}40`,
                                color: modalityColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                transition: 'all 0.2s', marginBottom: hasGallery ? '1.5rem' : '0',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="3 11 22 2 13 21 11 13 3 11" />
                            </svg>
                            Ver ubicación en Google Maps
                        </a>
                    )}

                    {/* ===== CAROUSEL GALLERY ===== */}
                    {hasGallery && (
                        <div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={modalityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                </svg>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Galería ({imagenes.length} {imagenes.length === 1 ? 'foto' : 'fotos'})
                                </span>
                            </div>

                            {/* Carousel */}
                            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                                {/* Main image */}
                                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                                    <img
                                        key={currentSlide}
                                        src={imagenes[currentSlide].url}
                                        alt={imagenes[currentSlide].descripcion || `Foto ${currentSlide + 1}`}
                                        style={{
                                            width: '100%', height: '100%', objectFit: 'contain',
                                            display: 'block', animation: 'carouselFadeIn 0.3s ease',
                                        }}
                                    />

                                    {/* Nav arrows */}
                                    {imagenes.length > 1 && (<>
                                        <button onClick={prevSlide} disabled={currentSlide === 0}
                                            aria-label="Foto anterior"
                                            style={{
                                                position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'white', cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                                                opacity: currentSlide === 0 ? 0.3 : 1,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s', zIndex: 2,
                                            }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>
                                        <button onClick={nextSlide} disabled={currentSlide === imagenes.length - 1}
                                            aria-label="Siguiente foto"
                                            style={{
                                                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'white', cursor: currentSlide === imagenes.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: currentSlide === imagenes.length - 1 ? 0.3 : 1,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.2s', zIndex: 2,
                                            }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>

                                        {/* Slide counter */}
                                        <div style={{
                                            position: 'absolute', bottom: '0.75rem', right: '0.75rem',
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            fontSize: '0.75rem', fontWeight: 600,
                                            padding: '0.25rem 0.625rem', borderRadius: '100px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                        }}>
                                            {currentSlide + 1} / {imagenes.length}
                                        </div>
                                    </>)}
                                </div>

                                {/* Caption */}
                                {imagenes[currentSlide].descripcion && (
                                    <div style={{
                                        padding: '0.625rem 1rem',
                                        fontSize: '0.8125rem', color: 'var(--text-secondary)',
                                        fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)',
                                    }}>
                                        {imagenes[currentSlide].descripcion}
                                    </div>
                                )}

                                {/* Dot indicators */}
                                {imagenes.length > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                                        {imagenes.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentSlide(idx)}
                                                aria-label={`Ir a foto ${idx + 1}`}
                                                style={{
                                                    width: idx === currentSlide ? '20px' : '8px',
                                                    height: '8px', borderRadius: '100px',
                                                    background: idx === currentSlide ? modalityColor : 'var(--border-hover)',
                                                    border: 'none', cursor: 'pointer',
                                                    transition: 'all 0.3s ease', padding: 0,
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails strip */}
                            {imagenes.length > 1 && (
                                <div style={{
                                    display: 'flex', gap: '6px', marginTop: '8px',
                                    overflowX: 'auto', paddingBottom: '4px',
                                }}>
                                    {imagenes.map((img, idx) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setCurrentSlide(idx)}
                                            style={{
                                                flexShrink: 0, width: '56px', height: '44px',
                                                border: `2px solid ${idx === currentSlide ? modalityColor : 'var(--border-subtle)'}`,
                                                borderRadius: '6px', overflow: 'hidden',
                                                cursor: 'pointer', padding: 0, background: 'var(--bg-elevated)',
                                                transition: 'all 0.2s', opacity: idx === currentSlide ? 1 : 0.6,
                                            }}
                                        >
                                            <img src={img.url} alt={`Miniatura ${idx + 1}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes carouselFadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>,
        document.body
    );
}
