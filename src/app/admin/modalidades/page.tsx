'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { createClient } from '@/lib/supabase';

interface ModalidadConContacto {
    id: string;
    nombre: string;
    color: string;
    contacto_nombre: string | null;
    contacto_telefono: string | null;
}

export default function ModalidadesPage() {
    const [modalidades, setModalidades] = useState<ModalidadConContacto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');
    const [color, setColor] = useState('#DC2626');
    const [contactoNombre, setContactoNombre] = useState('');
    const [contactoTelefono, setContactoTelefono] = useState('');
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

        const modalidadData = {
            nombre,
            color,
            contacto_nombre: contactoNombre || null,
            contacto_telefono: contactoTelefono || null,
        };

        if (editingId) {
            await supabase.from('modalidades').update(modalidadData).eq('id', editingId);
        } else {
            await supabase.from('modalidades').insert(modalidadData);
        }

        resetForm();
        loadModalidades();
    }

    function resetForm() {
        setNombre('');
        setColor('#DC2626');
        setContactoNombre('');
        setContactoTelefono('');
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Eliminar esta modalidad? Se eliminarán también todos sus eventos.')) return;
        const supabase = createClient();
        await supabase.from('modalidades').delete().eq('id', id);
        loadModalidades();
    }

    function handleEdit(mod: ModalidadConContacto) {
        setEditingId(mod.id);
        setNombre(mod.nombre);
        setColor(mod.color);
        setContactoNombre(mod.contacto_nombre || '');
        setContactoTelefono(mod.contacto_telefono || '');
        setShowForm(true);
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
                        <h2 className="section-title">Gestión de Modalidades</h2>
                    </div>
                    {!showForm && (
                        <button onClick={() => setShowForm(true)} className="btn btn-primary">
                            Nueva Modalidad
                        </button>
                    )}
                </div>

                {showForm && (
                    <div className="admin-form-section" style={{ marginBottom: '1.5rem' }}>
                        <div className="admin-form-section-header">
                            {editingId ? 'Editar Modalidad' : 'Nueva Modalidad'}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="admin-form-row" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="nombre">Nombre de la modalidad *</label>
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

                            <div className="admin-form-row" style={{ marginTop: '1rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="contactoNombre">Contacto / Responsable</label>
                                    <input
                                        id="contactoNombre"
                                        type="text"
                                        value={contactoNombre}
                                        onChange={(e) => setContactoNombre(e.target.value)}
                                        placeholder="Ej: Alberto Ruiz"
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label htmlFor="contactoTelefono">Teléfono de contacto</label>
                                    <input
                                        id="contactoTelefono"
                                        type="tel"
                                        value={contactoTelefono}
                                        onChange={(e) => setContactoTelefono(e.target.value)}
                                        placeholder="Ej: 0971 151 500"
                                    />
                                </div>
                            </div>

                            <div className="admin-form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-secondary">
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
                        Modalidades ({modalidades.length})
                    </div>

                    {modalidades.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No hay modalidades. Crea la primera.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Color</th>
                                        <th>Nombre</th>
                                        <th>Contacto</th>
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
                                                {mod.contacto_nombre ? (
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{mod.contacto_nombre}</div>
                                                        {mod.contacto_telefono && (
                                                            <a
                                                                href={`https://wa.me/595${mod.contacto_telefono.replace(/\D/g, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#25D366', fontSize: '0.85rem' }}
                                                            >
                                                                {mod.contacto_telefono}
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)' }}>Sin contacto</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        onClick={() => handleEdit(mod)}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(mod.id)}
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
