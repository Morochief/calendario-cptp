'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase';
import { TableSkeleton } from '@/components/Skeleton';

interface Reglamento {
    id: string;
    titulo: string;
    url: string;
    created_at: string;
}

export default function PublicReglamentosPage() {
    const [reglamentos, setReglamentos] = useState<Reglamento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReglamentos();
    }, []);

    async function loadReglamentos() {
        const supabase = createClient();
        const { data } = await supabase
            .from('reglamentos')
            .select('*')
            .order('titulo');

        if (data) {
            setReglamentos(data);
        }
        setLoading(false);
    }

    return (
        <>
            <Header />
            <main className="main">
                <div className="admin-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                    <div className="admin-header" style={{ marginBottom: '3rem', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
                        <h2 className="section-title" style={{ fontSize: '2.5rem' }}>Reglamentos y Documentos</h2>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                            Accede a la documentación oficial, reglamentos técnicos y normativas vigentes del Club Paraguayo de Tiro Práctico.
                        </p>
                    </div>

                    {loading ? (
                        <div className="calendar-grid">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="admin-card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div className="spinner"></div>
                                </div>
                            ))}
                        </div>
                    ) : reglamentos.length === 0 ? (
                        <div className="admin-card" style={{ textAlign: 'center', padding: '4rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>No hay documentos disponibles</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Disculpa las molestias, vuelve a revisar pronto.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {reglamentos.map(reg => (
                                <div key={reg.id} className="admin-card" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            marginBottom: '1rem',
                                            width: '48px',
                                            height: '48px',
                                            background: 'rgba(220, 38, 38, 0.1)',
                                            color: 'var(--color-primary)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                        }}>
                                            PDF
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                                            {reg.titulo}
                                        </h3>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            Publicado: {new Date(reg.created_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>

                                    <a
                                        href={reg.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        Descargar PDF
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
