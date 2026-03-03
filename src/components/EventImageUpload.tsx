'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ImagenEvento } from '@/lib/types';


interface EventImageUploadProps {
    eventoId: string;
}

export default function EventImageUpload({ eventoId }: EventImageUploadProps) {
    const [imagenes, setImagenes] = useState<ImagenEvento[]>([]);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadImagenes();
    }, [eventoId]);

    async function loadImagenes() {
        const supabase = createClient();
        const { data } = await supabase
            .from('imagenes_evento')
            .select('*')
            .eq('evento_id', eventoId)
            .order('orden', { ascending: true });
        setImagenes(data || []);
        setLoading(false);
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const supabase = createClient();

        const files = Array.from(e.target.files);
        const maxOrden = imagenes.length > 0 ? Math.max(...imagenes.map(i => i.orden)) : 0;

        for (let idx = 0; idx < files.length; idx++) {
            const file = files[idx];
            const ext = file.name.split('.').pop();
            const fileName = `gallery_${eventoId}_${Date.now()}_${idx}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(fileName, file);

            if (uploadError) {
                console.error('Error subiendo imagen:', uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(fileName);

            await supabase.from('imagenes_evento').insert({
                evento_id: eventoId,
                url: publicUrl,
                descripcion: null,
                orden: maxOrden + idx + 1,
            });
        }

        await loadImagenes();
        setUploading(false);
        e.target.value = '';
    }

    async function handleDelete(imagen: ImagenEvento) {
        setDeleting(imagen.id);
        const supabase = createClient();

        // Extract file path from URL
        const urlParts = imagen.url.split('/event-images/');
        if (urlParts.length === 2) {
            await supabase.storage.from('event-images').remove([urlParts[1]]);
        }

        await supabase.from('imagenes_evento').delete().eq('id', imagen.id);
        await loadImagenes();
        setDeleting(null);
    }

    async function handleDescripcionChange(id: string, desc: string) {
        const supabase = createClient();
        await supabase.from('imagenes_evento').update({ descripcion: desc }).eq('id', id);
        setImagenes(prev => prev.map(img => img.id === id ? { ...img, descripcion: desc } : img));
    }

    return (
        <div className="event-image-upload">
            <div className="upload-header">
                <h3 className="section-title" style={{ fontSize: '1rem', marginBottom: 0 }}>
                    📸 Galería del Evento
                </h3>
                <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    {uploading ? 'Subiendo...' : '+ Agregar imágenes'}
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cargando...</p>
            ) : imagenes.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '2rem',
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem'
                }}>
                    Sin imágenes. Hacé clic en "Agregar imágenes" para subir fotos del evento.
                </div>
            ) : (
                <div className="gallery-grid">
                    {imagenes.map(img => (
                        <div key={img.id} className="gallery-item">
                            <div className="gallery-img-wrap">
                                <img src={img.url} alt={img.descripcion || 'Foto del evento'} />
                                <button
                                    className="gallery-delete-btn"
                                    onClick={() => handleDelete(img)}
                                    disabled={deleting === img.id}
                                    title="Eliminar imagen"
                                >
                                    {deleting === img.id ? '...' : '×'}
                                </button>
                            </div>
                            <input
                                type="text"
                                className="gallery-caption-input"
                                placeholder="Caption (opcional)"
                                defaultValue={img.descripcion || ''}
                                onBlur={(e) => handleDescripcionChange(img.id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
