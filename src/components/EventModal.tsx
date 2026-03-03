'use client';

import { EventoConModalidad, ImagenEvento } from '@/lib/types';
import { useEffect, useState, useCallback, useRef } from 'react';
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
    const [showGallery, setShowGallery] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

    // Refs to avoid stale closures in keyboard handler
    const showGalleryRef = useRef(showGallery);
    const lightboxIndexRef = useRef(lightboxIndex);
    const imagenesRef = useRef(imagenes);
    const currentSlideRef = useRef(currentSlide);

    showGalleryRef.current = showGallery;
    lightboxIndexRef.current = lightboxIndex;
    imagenesRef.current = imagenes;
    currentSlideRef.current = currentSlide;

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (lightboxIndexRef.current !== null) { setLightboxIndex(null); return; }
            if (showGalleryRef.current) { setShowGallery(false); return; }
            onClose();
        }
        if (e.key === 'ArrowRight') {
            if (lightboxIndexRef.current !== null) {
                setSlideDirection('right');
                setLightboxIndex((i: number | null) => i !== null ? Math.min(i + 1, imagenesRef.current.length - 1) : null);
            } else if (showGalleryRef.current) {
                setCurrentSlide((s: number) => Math.min(s + 1, imagenesRef.current.length - 1));
            }
        }
        if (e.key === 'ArrowLeft') {
            if (lightboxIndexRef.current !== null) {
                setSlideDirection('left');
                setLightboxIndex((i: number | null) => i !== null ? Math.max(i - 1, 0) : null);
            } else if (showGalleryRef.current) {
                setCurrentSlide((s: number) => Math.max(s - 1, 0));
            }
        }
    }, [onClose]);

    // Load gallery images — only when evento changes
    useEffect(() => {
        setMounted(true);
        if (evento) {
            document.body.style.overflow = 'hidden';
            const supabase = createClient();
            supabase
                .from('imagenes_evento')
                .select('*')
                .eq('evento_id', evento.id)
                .order('orden', { ascending: true })
                .then(({ data }: { data: ImagenEvento[] | null }) => {
                    setImagenes(data || []);
                    setCurrentSlide(0);
                    setShowGallery(false);
                    setLightboxIndex(null);
                });
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [evento]);

    // Keyboard handler — separate effect so it doesn't re-fetch
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

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

    const prevSlide = () => setCurrentSlide((s: number) => Math.max(s - 1, 0));
    const nextSlide = () => setCurrentSlide((s: number) => Math.min(s + 1, imagenes.length - 1));

    const lightboxPrev = () => { setSlideDirection('left'); setLightboxIndex((i: number | null) => i !== null ? Math.max(i - 1, 0) : null); };
    const lightboxNext = () => { setSlideDirection('right'); setLightboxIndex((i: number | null) => i !== null ? Math.min(i + 1, imagenes.length - 1) : null); };

    return createPortal(
        <>
            <div
                onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}
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
                    {/* Close */}
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
                            cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'rgba(220,38,38,0.15)';
                            e.currentTarget.style.color = 'var(--color-primary)';
                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.background = 'var(--bg-elevated)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-hover)';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {/* Main Image — always visible */}
                    {hasValidImage && (
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

                    {/* Color bar */}
                    <div style={{ height: '4px', background: modalityColor, borderRadius: (!hasValidImage) ? '16px 16px 0 0' : '0' }} />

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

                        <h2 id="event-modal-title" style={{
                            fontSize: '1.375rem', fontWeight: 700,
                            color: 'var(--text-primary)', marginBottom: '1.25rem',
                            lineHeight: 1.3, letterSpacing: '-0.02em',
                        }}>
                            {evento.titulo}
                        </h2>

                        {/* Info */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            marginBottom: '1.5rem', padding: '1rem',
                            background: 'var(--bg-elevated)', borderRadius: '10px',
                            border: '1px solid var(--border-subtle)',
                        }}>
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

                        {evento.descripcion && (
                            <div style={{
                                padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '10px',
                                border: '1px solid var(--border-subtle)', marginBottom: '1.5rem',
                                color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9375rem', whiteSpace: 'pre-line' as const,
                            }}>
                                {evento.descripcion}
                            </div>
                        )}

                        {evento.ubicacion_url && (
                            <a href={evento.ubicacion_url} target="_blank" rel="noopener noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    width: '100%', padding: '0.875rem', borderRadius: '10px',
                                    background: `${modalityColor}20`, border: `1px solid ${modalityColor}40`,
                                    color: modalityColor, textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                                    transition: 'all 0.2s', marginBottom: hasGallery ? '1rem' : '0',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                </svg>
                                Ver ubicación en Google Maps
                            </a>
                        )}

                        {/* GALLERY TOGGLE */}
                        {hasGallery && !showGallery && (
                            <button
                                onClick={() => setShowGallery(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    width: '100%', padding: '0.875rem', borderRadius: '10px',
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.currentTarget.style.borderColor = modalityColor;
                                    e.currentTarget.style.background = `${modalityColor}10`;
                                }}
                                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                                    e.currentTarget.style.background = 'var(--bg-elevated)';
                                }}
                            >
                                📸 Ver galería ({imagenes.length} {imagenes.length === 1 ? 'foto' : 'fotos'})
                            </button>
                        )}

                        {/* CAROUSEL */}
                        {hasGallery && showGallery && (
                            <div style={{ animation: 'carouselFadeIn 0.3s ease' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                                        📸 Galería ({imagenes.length})
                                    </span>
                                    <button onClick={() => setShowGallery(false)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: '0.25rem 0.5rem' }}>
                                        ▲ Ocultar
                                    </button>
                                </div>

                                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                                    <div
                                        style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#000', cursor: 'zoom-in' }}
                                        onClick={() => { setLightboxIndex(currentSlide); setSlideDirection(null); }}
                                    >
                                        <img
                                            key={currentSlide}
                                            src={imagenes[currentSlide].url}
                                            alt={imagenes[currentSlide].descripcion || `Foto ${currentSlide + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', animation: 'carouselFadeIn 0.3s ease' }}
                                        />

                                        {imagenes.length > 1 && (<>
                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); prevSlide(); }} disabled={currentSlide === 0} aria-label="Anterior"
                                                style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: currentSlide === 0 ? 'not-allowed' : 'pointer', opacity: currentSlide === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 2 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                            </button>
                                            <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); nextSlide(); }} disabled={currentSlide === imagenes.length - 1} aria-label="Siguiente"
                                                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: currentSlide === imagenes.length - 1 ? 'not-allowed' : 'pointer', opacity: currentSlide === imagenes.length - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 2 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                                            </button>
                                            <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                {currentSlide + 1} / {imagenes.length}
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.6875rem', fontWeight: 500, padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                                                Ampliar
                                            </div>
                                        </>)}
                                    </div>

                                    {imagenes[currentSlide].descripcion && (
                                        <div style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)' }}>
                                            {imagenes[currentSlide].descripcion}
                                        </div>
                                    )}

                                    {imagenes.length > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                                            {imagenes.map((_: ImagenEvento, idx: number) => (
                                                <button key={idx} onClick={() => setCurrentSlide(idx)} aria-label={`Foto ${idx + 1}`}
                                                    style={{ width: idx === currentSlide ? '20px' : '8px', height: '8px', borderRadius: '100px', background: idx === currentSlide ? modalityColor : 'var(--border-hover)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {imagenes.length > 1 && (
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {imagenes.map((img: ImagenEvento, idx: number) => (
                                            <button key={img.id} onClick={() => setCurrentSlide(idx)}
                                                style={{ flexShrink: 0, width: '56px', height: '44px', border: `2px solid ${idx === currentSlide ? modalityColor : 'var(--border-subtle)'}`, borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'var(--bg-elevated)', transition: 'all 0.2s', opacity: idx === currentSlide ? 1 : 0.6 }}>
                                                <img src={img.url} alt={`Mini ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== LIGHTBOX FULLSCREEN WITH 3D CAROUSEL ===== */}
            {lightboxIndex !== null && (
                <div
                    onClick={() => setLightboxIndex(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10001,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.95)',
                        animation: 'modalFadeIn 0.2s ease',
                        perspective: '1200px',
                    }}
                >
                    {/* Main image with 3D transition */}
                    <div
                        key={lightboxIndex}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw', maxHeight: '85vh',
                            animation: slideDirection === 'right'
                                ? 'lightboxSlideFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                : slideDirection === 'left'
                                    ? 'lightboxSlideFromLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                    : 'lightboxZoomIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        <img
                            src={imagenes[lightboxIndex].url}
                            alt="Imagen ampliada"
                            style={{
                                maxWidth: '90vw', maxHeight: '85vh',
                                objectFit: 'contain', borderRadius: '8px',
                                boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(0,0,0,0.3)',
                                display: 'block',
                            }}
                        />
                    </div>

                    {/* Nav arrows */}
                    {imagenes.length > 1 && (<>
                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); lightboxPrev(); }}
                            disabled={lightboxIndex === 0}
                            style={{
                                position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)',
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white', cursor: lightboxIndex === 0 ? 'not-allowed' : 'pointer',
                                opacity: lightboxIndex === 0 ? 0.2 : 0.8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s', backdropFilter: 'blur(8px)',
                            }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>
                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); lightboxNext(); }}
                            disabled={lightboxIndex === imagenes.length - 1}
                            style={{
                                position: 'absolute', right: '1.5rem', top: '50%', transform: 'translateY(-50%)',
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white', cursor: lightboxIndex === imagenes.length - 1 ? 'not-allowed' : 'pointer',
                                opacity: lightboxIndex === imagenes.length - 1 ? 0.2 : 0.8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.3s', backdropFilter: 'blur(8px)',
                            }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </>)}

                    {/* Close */}
                    <button onClick={() => setLightboxIndex(null)}
                        style={{
                            position: 'absolute', top: '1.5rem', right: '1.5rem',
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', fontSize: '1.5rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                        }}>
                        ×
                    </button>

                    {/* Counter + caption */}
                    <div style={{
                        position: 'absolute', bottom: '1.5rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <div style={{
                            background: 'rgba(0,0,0,0.6)', color: 'white',
                            fontSize: '0.875rem', fontWeight: 600,
                            padding: '0.375rem 1rem', borderRadius: '100px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(8px)',
                        }}>
                            {lightboxIndex + 1} / {imagenes.length}
                        </div>
                        {imagenes[lightboxIndex].descripcion && (
                            <div style={{
                                color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem',
                                fontStyle: 'italic', textAlign: 'center', maxWidth: '400px',
                            }}>
                                {imagenes[lightboxIndex].descripcion}
                            </div>
                        )}
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                            ← → para navegar · Esc para cerrar
                        </div>
                    </div>

                    {/* Thumbnail strip */}
                    {imagenes.length > 1 && (
                        <div style={{
                            position: 'absolute', bottom: '5.5rem',
                            display: 'flex', gap: '6px', justifyContent: 'center',
                        }}>
                            {imagenes.map((img: ImagenEvento, idx: number) => (
                                <button key={img.id}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setSlideDirection(idx > lightboxIndex! ? 'right' : 'left');
                                        setLightboxIndex(idx);
                                    }}
                                    style={{
                                        width: '48px', height: '36px', borderRadius: '6px',
                                        overflow: 'hidden', padding: 0, cursor: 'pointer',
                                        border: `2px solid ${idx === lightboxIndex ? 'white' : 'rgba(255,255,255,0.2)'}`,
                                        opacity: idx === lightboxIndex ? 1 : 0.5,
                                        transition: 'all 0.3s', background: '#000',
                                        transform: idx === lightboxIndex ? 'scale(1.1)' : 'scale(1)',
                                    }}>
                                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes carouselFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes lightboxZoomIn {
                    from { opacity: 0; transform: scale(0.7) rotateY(15deg); }
                    to { opacity: 1; transform: scale(1) rotateY(0deg); }
                }
                @keyframes lightboxSlideFromRight {
                    from { opacity: 0; transform: translateX(100px) rotateY(-12deg) scale(0.9); }
                    to { opacity: 1; transform: translateX(0) rotateY(0deg) scale(1); }
                }
                @keyframes lightboxSlideFromLeft {
                    from { opacity: 0; transform: translateX(-100px) rotateY(12deg) scale(0.9); }
                    to { opacity: 1; transform: translateX(0) rotateY(0deg) scale(1); }
                }
            `}</style>
        </>,
        document.body
    );
}
