'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createClient } from '@/lib/supabase';

interface Reglamento {
    id: string;
    titulo: string;
    url: string;
    created_at: string;
}

export default function ReglamentosPage() {
    const [reglamentos, setReglamentos] = useState<Reglamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [titulo, setTitulo] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();

    useEffect(() => {
        checkAuthAndLoad();
    }, []);

    async function checkAuthAndLoad() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/admin/login');
            return;
        }

        loadReglamentos();
    }

    async function loadReglamentos() {
        const supabase = createClient();
        const { data } = await supabase
            .from('reglamentos')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setReglamentos(data);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !titulo) return;

        setUploading(true);
        const supabase = createClient();

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('reglamentos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('reglamentos')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('reglamentos')
                .insert({ titulo, url: publicUrl });

            if (dbError) throw dbError;

            resetForm();
            loadReglamentos();
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Error al subir el reglamento. Verifica que el bucket "reglamentos" exista y tenga políticas públicas.');
        } finally {
            setUploading(false);
        }
    }

    function resetForm() {
        setTitulo('');
        setFile(null);
        setShowForm(false);
    }

    async function handleDelete(id: string, url: string) {
        if (!confirm('¿Eliminar este reglamento?')) return;

        const supabase = createClient();
        const fileName = url.split('/').pop();

        if (fileName) {
            await supabase.storage.from('reglamentos').remove([fileName]);
        }

        await supabase.from('reglamentos').delete().eq('id', id);
        loadReglamentos();
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <div className="loading"><div className="spinner"></div></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container">
                <Breadcrumbs />
                <div className="admin-header">
                    <div>
                        <h2 className="section-title">Gestión de Reglamentos</h2>
                    </div>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            Nuevo Reglamento
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="admin-form-section" style={{ marginBottom: '1.5rem' }}>
                        <div className="admin-form-section-header">
                            Subir Nuevo Reglamento
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="titulo">Título del Reglamento <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                                <input
                                    id="titulo"
                                    type="text"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ej: Reglamento Técnico IPSC 2024"
                                    required
                                />
                            </div>

                            <div className="admin-form-upload">
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="file">Archivo PDF <span style={{ color: 'var(--color-primary)' }}>*</span></label>
                                    <input
                                        id="file"
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="admin-form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Subiendo...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-form-section">
                    <div className="admin-form-section-header">
                        Reglamentos Publicados ({reglamentos.length})
                    </div>

                    {reglamentos.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No hay reglamentos cargados.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Fecha Subida</th>
                                        <th>Título</th>
                                        <th>Archivo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reglamentos.map(reg => (
                                        <tr key={reg.id}>
                                            <td>
                                                {new Date(reg.created_at).toLocaleDateString('es-ES')}
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{reg.titulo}</td>
                                            <td>
                                                <a
                                                    href={reg.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ color: 'var(--color-secondary)', textDecoration: 'underline' }}
                                                >
                                                    Ver PDF
                                                </a>
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        onClick={() => handleDelete(reg.id, reg.url)}
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
