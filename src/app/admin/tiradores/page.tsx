'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { Tirador } from '@/lib/types';

export default function TiradoresAdminPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [tiradores, setTiradores] = useState<Tirador[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        ci: '',
        nro_socio: '',
        profesion: '',
        fecha_nacimiento: '',
        direccion: '',
        celular: '',
        telefono: '',
        email: '',
    });

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

        await loadTiradores();
        setLoading(false);
    }

    async function loadTiradores() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('tiradores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar tiradores:', error);
            showToast('Error al conectar con la tabla de tiradores', 'error');
        } else if (data) {
            setTiradores(data as Tirador[]);
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            nombre: '',
            apellido: '',
            ci: '',
            nro_socio: '',
            profesion: '',
            fecha_nacimiento: '',
            direccion: '',
            celular: '',
            telefono: '',
            email: '',
        });
        setShowForm(true);
    };

    const handleOpenEdit = (item: Tirador) => {
        setEditingId(item.id);
        setFormData({
            nombre: item.nombre || '',
            apellido: item.apellido || '',
            ci: item.ci || '',
            nro_socio: item.nro_socio || '',
            profesion: item.profesion || '',
            fecha_nacimiento: item.fecha_nacimiento || '',
            direccion: item.direccion || '',
            celular: item.celular || '',
            telefono: item.telefono || '',
            email: item.email || '',
        });
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim() || !formData.apellido.trim()) {
            showToast('Nombre y Apellido son obligatorios', 'error');
            return;
        }

        setSaving(true);
        const supabase = createClient();

        const payload = {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            ci: formData.ci.trim() || null,
            nro_socio: formData.nro_socio.trim() || null,
            profesion: formData.profesion.trim() || null,
            fecha_nacimiento: formData.fecha_nacimiento.trim() || null,
            direccion: formData.direccion.trim() || null,
            celular: formData.celular.trim() || null,
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
            updated_at: new Date().toISOString(),
        };

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('tiradores')
                    .update(payload)
                    .eq('id', editingId);

                if (error) throw error;
                showToast(`Datos de ${payload.nombre} ${payload.apellido} actualizados`, 'success');
            } else {
                const { error } = await supabase
                    .from('tiradores')
                    .insert([payload]);

                if (error) throw error;
                showToast(`Tirador ${payload.nombre} ${payload.apellido} registrado exitosamente`, 'success');
            }

            handleCloseForm();
            await loadTiradores();
        } catch (error: any) {
            console.error('Error al guardar tirador:', error);
            showToast(`Error: ${error.message || 'No se pudo guardar'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, nombreCompleto: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${nombreCompleto}" del padrón de tiradores?`)) {
            return;
        }

        const supabase = createClient();
        const { error } = await supabase
            .from('tiradores')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar tirador:', error);
            showToast(`Error al eliminar: ${error.message}`, 'error');
        } else {
            showToast(`"${nombreCompleto}" ha sido eliminado del padrón`, 'success');
            await loadTiradores();
        }
    };

    const handleCopyPublicLink = () => {
        const link = typeof window !== 'undefined' ? `${window.location.origin}/registro` : '/registro';
        navigator.clipboard.writeText(link);
        showToast(`Link de auto-registro copiado: ${link}`, 'success');
    };

    const filteredTiradores = useMemo(() => {
        if (!searchTerm.trim()) return tiradores;
        const q = searchTerm.toLowerCase();
        return tiradores.filter(t =>
            t.nombre.toLowerCase().includes(q) ||
            t.apellido.toLowerCase().includes(q) ||
            (t.ci && t.ci.toLowerCase().includes(q)) ||
            (t.nro_socio && t.nro_socio.toLowerCase().includes(q)) ||
            (t.celular && t.celular.toLowerCase().includes(q)) ||
            (t.email && t.email.toLowerCase().includes(q))
        );
    }, [tiradores, searchTerm]);

    return (
        <>
            <Header />
            <main className="admin-container" id="main-content" style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                <Breadcrumbs />

                {/* Título y Acciones Superiores */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                            Padrón de Tiradores y Socios
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                            Base de datos maestra de tiradores para exenciones, inscripciones y futuras competencias.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={handleCopyPublicLink}
                            className="btn btn-outline"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: '#16a34a',
                                borderColor: '#86efac'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Copiar Link Público (/registro)
                        </button>

                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: '#dc2626',
                                color: '#ffffff',
                                fontWeight: 600,
                                padding: '0.5rem 1.25rem',
                                borderRadius: '0.5rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            + Nuevo Tirador
                        </button>
                    </div>
                </div>

                {/* Tarjeta Principal de la Tabla */}
                <div style={{
                    background: 'var(--bg-elevated, #ffffff)',
                    border: '1px solid var(--border-subtle, #e5e7eb)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Tiradores Registrados ({tiradores.length})
                            </h2>
                            {filteredTiradores.length !== tiradores.length && (
                                <span style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                    Filtrados: {filteredTiradores.length}
                                </span>
                            )}
                        </div>

                        <div style={{ minWidth: '280px' }}>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por nombre, C.I., socio, celular..."
                                style={{
                                    width: '100%',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid var(--border-subtle, #d1d5db)',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando padrón de tiradores...</p>
                    ) : filteredTiradores.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem auto', opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron tiradores</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                Puedes agregar tiradores manualmente con el botón "+ Nuevo Tirador" o compartir el link público de registro.
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-subtle, #e5e7eb)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Tirador / Socio</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>C.I.</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Nº Socio</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Profesión</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Contacto</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Dirección</th>
                                        <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTiradores.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle, #f3f4f6)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {item.nombre} {item.apellido}
                                                </div>
                                                {item.fecha_nacimiento && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        Nac: {item.fecha_nacimiento}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                                {item.ci || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                {item.nro_socio ? (
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        backgroundColor: '#fef3c7',
                                                        color: '#92400e',
                                                        border: '1px solid #fde68a'
                                                    }}>
                                                        #{item.nro_socio}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No socio</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                {item.profesion || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.82rem' }}>
                                                <div>{item.celular || item.telefono || '-'}</div>
                                                {item.email && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.email}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                                                {item.direccion || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                    <Link
                                                        href={`/admin/exencion`}
                                                        title="Hacer Exención de Responsabilidad"
                                                        style={{
                                                            background: '#eff6ff',
                                                            color: '#1d4ed8',
                                                            border: '1px solid #bfdbfe',
                                                            padding: '0.35rem 0.6rem',
                                                            borderRadius: '0.25rem',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            textDecoration: 'none',
                                                            display: 'inline-flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        Exención
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        title="Editar datos del tirador"
                                                        onClick={() => handleOpenEdit(item)}
                                                        style={{
                                                            background: '#f3f4f6',
                                                            border: 'none',
                                                            padding: '0.35rem 0.6rem',
                                                            borderRadius: '0.25rem',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        title="Eliminar del padrón"
                                                        onClick={() => handleDelete(item.id, `${item.nombre} ${item.apellido}`)}
                                                        style={{
                                                            background: '#fee2e2',
                                                            color: '#991b1b',
                                                            border: 'none',
                                                            padding: '0.35rem 0.6rem',
                                                            borderRadius: '0.25rem',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        ✕
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

                {/* MODAL PARA CREAR O EDITAR TIRADOR */}
                {showForm && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}>
                        <div style={{
                            backgroundColor: 'var(--bg-elevated, #ffffff)',
                            borderRadius: '0.75rem',
                            maxWidth: '650px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
                            border: '1px solid var(--border-subtle, #e5e7eb)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    {editingId ? '✏️ Modificar Tirador / Socio' : '✨ Nuevo Tirador / Socio'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            required
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Juan"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Apellido *
                                        </label>
                                        <input
                                            type="text"
                                            name="apellido"
                                            required
                                            value={formData.apellido}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Pérez"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Nº de Cédula
                                        </label>
                                        <input
                                            type="text"
                                            name="ci"
                                            value={formData.ci}
                                            onChange={handleInputChange}
                                            placeholder="Ej: 3.456.789"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Nº de Socio (opcional)
                                        </label>
                                        <input
                                            type="text"
                                            name="nro_socio"
                                            value={formData.nro_socio}
                                            onChange={handleInputChange}
                                            placeholder="Ej: 1245"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Profesión
                                        </label>
                                        <input
                                            type="text"
                                            name="profesion"
                                            value={formData.profesion}
                                            onChange={handleInputChange}
                                            placeholder="Ej: Abogado"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Fecha de Nacimiento
                                        </label>
                                        <input
                                            type="text"
                                            name="fecha_nacimiento"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleInputChange}
                                            placeholder="Ej: 15/04/1985"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleInputChange}
                                        placeholder="Ej: Av. Santa Teresa 1234 c/ Denis Roa"
                                        className="admin-input"
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Celular (WhatsApp)
                                        </label>
                                        <input
                                            type="text"
                                            name="celular"
                                            value={formData.celular}
                                            onChange={handleInputChange}
                                            placeholder="Ej: 0981 123456"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            Nº Teléfono (Línea baja)
                                        </label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                            placeholder="Ej: 021 123456"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                        Correo Electrónico (E-Mail)
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Ej: juan.perez@example.com"
                                        className="admin-input"
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleCloseForm}
                                        className="btn btn-outline"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary"
                                        style={{ backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 600 }}
                                    >
                                        {saving ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Registrar Tirador')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
