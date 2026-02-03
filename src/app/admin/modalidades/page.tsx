'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase';
import { Modalidad } from '@/lib/types';

export default function ModalidadesPage() {
    const [modalidades, setModalidades] = useState<Modalidad[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState('#DC2626');
    const [saving, setSaving] = useState(false);
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

        loadModalidades();
    }

    async function loadModalidades() {
        const supabase = createClient();
        const { data } = await supabase
            .from('modalidades')
            .select('*')
            .order('nombre');

        if (data) {
            setModalidades(data);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const supabase = createClient();

        if (editingId) {
            await supabase
                .from('modalidades')
                .update({ nombre, color })
                .eq('id', editingId);
        } else {
            await supabase
                .from('modalidades')
                .insert({ nombre, color });
        }

        setNombre('');
        setColor('#DC2626');
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
        loadModalidades();
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar esta modalidad? Se eliminarán también todos sus eventos.')) return;

        const supabase = createClient();
        await supabase.from('modalidades').delete().eq('id', id);
        loadModalidades();
    }

    function handleEdit(mod: Modalidad) {
        setEditingId(mod.id);
        setNombre(mod.nombre);
        setColor(mod.color);
        setShowForm(true);
    }

    function handleCancel() {
        setEditingId(null);
        setNombre('');
        setColor('#DC2626');
        setShowForm(false);
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container">
                <div className="admin-header">
                    <div>
                        <h2 className="section-title">Gestión de Modalidades</h2>
                        <Link href="/admin" style={{ color: '#6B7280', fontSize: '0.875rem' }}>
                            ← Volver al panel
                        </Link>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn btn-primary"
                        >
                            ➕ Nueva Modalidad
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>
                            {editingId ? 'Editar Modalidad' : 'Nueva Modalidad'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="nombre">Nombre</label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej: Tiro Práctico IPSC"
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="color">Color</label>
                                    <input
                                        id="color"
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        style={{ height: '42px', padding: '4px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : '💾 Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>
                        Modalidades ({modalidades.length})
                    </h3>

                    {modalidades.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                            No hay modalidades. ¡Crea la primera!
                        </p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Color</th>
                                    <th>Nombre</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalidades.map(mod => (
                                    <tr key={mod.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '4px',
                                                background: mod.color
                                            }} />
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{mod.nombre}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button
                                                    onClick={() => handleEdit(mod)}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(mod.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
