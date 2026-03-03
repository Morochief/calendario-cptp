'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createClient } from '@/lib/supabase';
import { TipoEvento } from '@/lib/types';

export default function TiposEventoPage() {
    const [tipos, setTipos] = useState<TipoEvento[]>([]);
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

        loadTipos();
    }

    async function loadTipos() {
        const supabase = createClient();
        const { data } = await supabase
            .from('tipos_evento')
            .select('*')
            .order('nombre');

        if (data) {
            setTipos(data);
        }
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const supabase = createClient();

        if (editingId) {
            await supabase
                .from('tipos_evento')
                .update({ nombre, color })
                .eq('id', editingId);
        } else {
            await supabase
                .from('tipos_evento')
                .insert({ nombre, color });
        }

        setNombre('');
        setColor('#DC2626');
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
        loadTipos();
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar este tipo de evento?')) return;

        const supabase = createClient();
        await supabase.from('tipos_evento').delete().eq('id', id);
        loadTipos();
    }

    function handleEdit(tipo: TipoEvento) {
        setEditingId(tipo.id);
        setNombre(tipo.nombre);
        setColor(tipo.color);
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
                        <h2 className="section-title">Tipos de Evento</h2>
                    </div>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            Nuevo Tipo
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="admin-form-section" style={{ marginBottom: '1.5rem' }}>
                        <div className="admin-form-section-header">
                            {editingId ? 'Editar Tipo' : 'Nuevo Tipo de Evento'}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="nombre">Nombre</label>
                                    <input
                                        id="nombre"
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej: Tirada Social"
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
                            <div className="admin-form-actions">
                                <button type="button" onClick={handleCancel} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="admin-form-section">
                    <div className="admin-form-section-header">
                        Tipos ({tipos.length})
                    </div>

                    {tipos.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No hay tipos de evento. Crea el primero.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Color</th>
                                        <th>Nombre</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tipos.map(tipo => (
                                        <tr key={tipo.id}>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '4px',
                                                    background: tipo.color
                                                }} />
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{tipo.nombre}</td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        onClick={() => handleEdit(tipo)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tipo.id)}
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
