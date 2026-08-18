'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { Exencion } from '@/lib/types';

export default function ExencionPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const today = new Date();
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const initialFormData = {
        nombre: '',
        apellido: '',
        nroSocio: '',
        profesion: '',
        ci: '',
        fechaNacimiento: '',
        direccion: '',
        telefono: '',
        celular: '',
        email: '',
        ciudad: 'Asunción',
        dia: today.getDate().toString(),
        mes: meses[today.getMonth()],
        anho: today.getFullYear().toString(),
    };

    const [formData, setFormData] = useState(initialFormData);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [exenciones, setExenciones] = useState<Exencion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminUser, setAdminUser] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

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

        setAdminUser(user.email || user.id);
        await loadExenciones();
        setLoading(false);
    }

    async function loadExenciones() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exenciones')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar exenciones:', error);
        } else if (data) {
            setExenciones(data as Exencion[]);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReset = () => {
        setSelectedId(null);
        setFormData({
            ...initialFormData,
            dia: new Date().getDate().toString(),
            mes: meses[new Date().getMonth()],
            anho: new Date().getFullYear().toString(),
        });
    };

    const handleSave = async (andPrint = false) => {
        if (!formData.nombre.trim() || !formData.apellido.trim()) {
            showToast('El nombre y el apellido son obligatorios', 'error');
            return;
        }

        setSaving(true);
        const supabase = createClient();

        const payload = {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            nro_socio: formData.nroSocio.trim() || null,
            profesion: formData.profesion.trim() || null,
            ci: formData.ci.trim() || null,
            fecha_nacimiento: formData.fechaNacimiento.trim() || null,
            direccion: formData.direccion.trim() || null,
            telefono: formData.telefono.trim() || null,
            celular: formData.celular.trim() || null,
            email: formData.email.trim() || null,
            ciudad: formData.ciudad.trim() || 'Asunción',
            dia: formData.dia.trim() || null,
            mes: formData.mes.trim() || null,
            anho: formData.anho.trim() || null,
            admin_user: adminUser,
        };

        try {
            if (selectedId) {
                const { error } = await supabase
                    .from('exenciones')
                    .update(payload)
                    .eq('id', selectedId);

                if (error) throw error;
                showToast('Exención actualizada exitosamente', 'success');
            } else {
                const { data, error } = await supabase
                    .from('exenciones')
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    setSelectedId(data.id);
                }
                showToast('Exención guardada en la base de datos', 'success');
            }

            await loadExenciones();

            if (andPrint) {
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        } catch (error: any) {
            console.error('Error al guardar exención:', error);
            showToast(`Error al guardar: ${error.message || 'Verifica la conexión o la tabla en Supabase'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectExencion = (item: Exencion) => {
        setSelectedId(item.id);
        setFormData({
            nombre: item.nombre || '',
            apellido: item.apellido || '',
            nroSocio: item.nro_socio || '',
            profesion: item.profesion || '',
            ci: item.ci || '',
            fechaNacimiento: item.fecha_nacimiento || '',
            direccion: item.direccion || '',
            telefono: item.telefono || '',
            celular: item.celular || '',
            email: item.email || '',
            ciudad: item.ciudad || 'Asunción',
            dia: item.dia || '',
            mes: item.mes || '',
            anho: item.anho || '',
        });
        setActiveTab('form');
        showToast(`Datos de ${item.nombre} ${item.apellido} cargados en el formulario`, 'info');
    };

    const handleDirectPrint = (item: Exencion) => {
        handleSelectExencion(item);
        setTimeout(() => {
            window.print();
        }, 400);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de que deseas eliminar este registro de exención?')) {
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.from('exenciones').delete().eq('id', id);

        if (error) {
            showToast('Error al eliminar la exención', 'error');
        } else {
            showToast('Registro eliminado', 'success');
            if (selectedId === id) {
                handleReset();
            }
            await loadExenciones();
        }
    };

    const filteredExenciones = useMemo(() => {
        if (!searchTerm.trim()) return exenciones;
        const q = searchTerm.toLowerCase();
        return exenciones.filter(e =>
            e.nombre.toLowerCase().includes(q) ||
            e.apellido.toLowerCase().includes(q) ||
            (e.ci && e.ci.toLowerCase().includes(q)) ||
            (e.nro_socio && e.nro_socio.toLowerCase().includes(q)) ||
            (e.admin_user && e.admin_user.toLowerCase().includes(q))
        );
    }, [exenciones, searchTerm]);

    const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim();

    return (
        <>
            {/* Header y UI visible en pantalla pero oculto al imprimir */}
            <div className="print:hidden">
                <Header />
                <main className="admin-container" id="main-content" style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem 1rem' }}>
                    <Breadcrumbs />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                Exención de Responsabilidad
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                                Carga de datos, guardado histórico en Supabase e impresión oficial.
                            </p>
                        </div>

                        {/* Botones de acción principales */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                Nuevo / Limpiar
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleSave(false)}
                                disabled={saving}
                                className="btn btn-secondary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: 600,
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                {saving ? 'Guardando...' : (selectedId ? 'Actualizar Registro' : 'Solo Guardar')}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                disabled={saving}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                    <rect x="6" y="14" width="12" height="8"></rect>
                                </svg>
                                {saving ? 'Procesando...' : 'Guardar e Imprimir'}
                            </button>
                        </div>
                    </div>

                    {/* Selector de Pestañas: Formulario / Historial */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--border-subtle, #e5e7eb)',
                        marginBottom: '1.5rem',
                        gap: '1rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('form')}
                            style={{
                                padding: '0.6rem 1rem',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                borderBottom: activeTab === 'form' ? '2px solid #dc2626' : '2px solid transparent',
                                color: activeTab === 'form' ? '#dc2626' : 'var(--text-muted)',
                                background: 'none',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Formulario y Vista Previa {selectedId && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>Editando</span>}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '0.6rem 1rem',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                borderBottom: activeTab === 'history' ? '2px solid #dc2626' : '2px solid transparent',
                                color: activeTab === 'history' ? '#dc2626' : 'var(--text-muted)',
                                background: 'none',
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Historial Guardado ({exenciones.length})
                        </button>
                    </div>

                    {/* VISTA 1: FORMULARIO Y VISTA PREVIA */}
                    {activeTab === 'form' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                            gap: '2rem',
                            alignItems: 'start'
                        }}>
                            {/* Formulario */}
                            <div style={{
                                background: 'var(--bg-elevated, #ffffff)',
                                border: '1px solid var(--border-subtle, #e5e7eb)',
                                borderRadius: '0.75rem',
                                padding: '1.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                        Datos del Tirador / Socio
                                    </h2>
                                    {adminUser && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Admin: <strong>{adminUser}</strong>
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleSave(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                                onChange={handleChange}
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
                                                onChange={handleChange}
                                                placeholder="Ej: Pérez"
                                                className="admin-input"
                                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                Nº de Socio
                                            </label>
                                            <input
                                                type="text"
                                                name="nroSocio"
                                                value={formData.nroSocio}
                                                onChange={handleChange}
                                                placeholder="Ej: 1245"
                                                className="admin-input"
                                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                Profesión
                                            </label>
                                            <input
                                                type="text"
                                                name="profesion"
                                                value={formData.profesion}
                                                onChange={handleChange}
                                                placeholder="Ej: Abogado"
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
                                                onChange={handleChange}
                                                placeholder="Ej: 3.456.789"
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
                                                name="fechaNacimiento"
                                                value={formData.fechaNacimiento}
                                                onChange={handleChange}
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
                                            onChange={handleChange}
                                            placeholder="Ej: Av. Santa Teresa 1234 c/ Denis Roa"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                Nº Teléfono (Línea baja)
                                            </label>
                                            <input
                                                type="text"
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                placeholder="Ej: 021 123456"
                                                className="admin-input"
                                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                Celular
                                            </label>
                                            <input
                                                type="text"
                                                name="celular"
                                                value={formData.celular}
                                                onChange={handleChange}
                                                placeholder="Ej: 0981 123456"
                                                className="admin-input"
                                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                            E-Mail
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="Ej: juan.perez@example.com"
                                            className="admin-input"
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                        />
                                    </div>

                                    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle, #e5e7eb)', paddingTop: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                            Lugar y Fecha de Emisión
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 0.8fr', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                name="ciudad"
                                                value={formData.ciudad}
                                                onChange={handleChange}
                                                placeholder="Ciudad"
                                                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                            <input
                                                type="text"
                                                name="dia"
                                                value={formData.dia}
                                                onChange={handleChange}
                                                placeholder="Día"
                                                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                            <input
                                                type="text"
                                                name="mes"
                                                value={formData.mes}
                                                onChange={handleChange}
                                                placeholder="Mes"
                                                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                            <input
                                                type="text"
                                                name="anho"
                                                value={formData.anho}
                                                onChange={handleChange}
                                                placeholder="Año"
                                                style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '0.375rem', border: '1px solid var(--border-subtle, #d1d5db)' }}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Vista previa en pantalla */}
                            <div>
                                <div style={{
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.75rem',
                                    padding: '1rem',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Vista Previa del Documento
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                            Hoja A4 (Formato Impresión)
                                        </span>
                                    </div>

                                    <div style={{
                                        background: '#ffffff',
                                        color: '#000000',
                                        padding: '1.5rem',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        fontSize: '0.75rem',
                                        fontFamily: 'serif',
                                        lineHeight: '1.4'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <img src="/logo CPTP svg.svg" alt="CPTP Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.05em' }}>CLUB PARAGUAYO DE TIRO PRÁCTICO</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>(C.P.T.P.)</div>
                                            </div>
                                            <img src="/logo-long-range.svg" alt="Long Range Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
                                        </div>

                                        <div style={{ textAlign: 'center', fontStyle: 'italic', fontWeight: 'bold', fontSize: '0.85rem', margin: '0.75rem 0' }}>
                                            Exención de Responsabilidad
                                        </div>

                                        <p style={{ textAlign: 'justify', marginBottom: '0.5rem' }}>
                                            No obstante la estricta observancia de las normas de seguridad que rigen al Tiro como actividad deportiva y de esparcimiento, existe la probabilidad de que sus practicantes o terceras personas puedan sufrir accidentes o algún daño físico o material durante su desarrollo.
                                        </p>

                                        <p style={{ textAlign: 'justify', marginBottom: '0.5rem' }}>
                                            Por tal motivo, YO, <strong style={{ textDecoration: 'underline' }}>{nombreCompleto || '__________________________________'}</strong>, en adelante denominado <strong>El Tirador</strong>, siendo mayor de edad y habiendo decidido libre y voluntariamente participar en prácticas y competencias, suscribo el presente Documento de <strong>Exención de Responsabilidad al C. P. T. P.</strong>, afirmando estar plenamente de acuerdo con el texto y contenido de la totalidad de las cláusulas a continuación detalladas:
                                        </p>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                                            <p style={{ margin: 0, textAlign: 'justify' }}><strong>1. Declaración:</strong> El Tirador declara haber recibido en forma satisfactoria suficiente información y orientación de parte de las Autoridades del C. P. T. P. y tener pleno conocimiento de las Reglas de Seguridad de las modalidades de Tiro que opte practicar.-</p>
                                            <p style={{ margin: 0, textAlign: 'justify' }}><strong>2. Riesgos:</strong> El Tirador manifiesta tener cabal conocimiento sobre la naturaleza de las diferentes modalidades del Tiro Deportivo así como de los posibles riesgos durante sus prácticas y que libre y voluntariamente decide asumir dichos riesgos.-</p>
                                            <p style={{ margin: 0, textAlign: 'justify' }}><strong>3. Cláusulas de Exención:</strong> El Tirador, libera al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios, de toda responsabilidad por daños que pudiera sufrir su persona o bienes como resultado de su accionar como Tirador Deportivo.-</p>
                                            <p style={{ margin: 0, textAlign: 'justify' }}><strong>4. Daños a Terceros:</strong> El Tirador se responsabiliza por cualquier daño físico, material, moral de imagen o de cualquier otra índole, que su acción u omisión pudiera causar a terceros. En consecuencia El Tirador exime al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios de cualquier responsabilidad indemnizatoria que pudiera ser planteada por terceros, como consecuencia de sus actos u omisiones.-</p>
                                            <p style={{ margin: 0, textAlign: 'justify' }}><strong>5. Salud:</strong> El Tirador afirma que goza de buen estado general de salud para la práctica de las diversas modalidades de Tiro, liberando de cualquier responsabilidad indemnizatoria al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios de cualquier problema de salud que se le pudiera presentar durante su permanencia dentro del predio del Club o como consecuencia de sus prácticas deportivas.-</p>
                                        </div>

                                        {/* Campos de datos abajo */}
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', lineHeight: '1.6' }}>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ flex: 1 }}><strong>Nombre:</strong> {formData.nombre || '...........................................'}</span>
                                                <span style={{ flex: 1 }}><strong>Apellido:</strong> {formData.apellido || '...........................................'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ flex: 1 }}><strong>Nº de Socio:</strong> {formData.nroSocio || '.....................................'}</span>
                                                <span style={{ flex: 1 }}><strong>Profesión:</strong> {formData.profesion || '.....................................'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ flex: 1 }}><strong>Nº de Cédula:</strong> {formData.ci || '..................................'}</span>
                                                <span style={{ flex: 1 }}><strong>Fecha de nacimiento:</strong> {formData.fechaNacimiento || '..................................'}</span>
                                            </div>
                                            <div>
                                                <span><strong>Dirección:</strong> {formData.direccion || '...................................................................................................................'}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <span style={{ flex: 1 }}><strong>Nº Teléfono:</strong> {formData.telefono || '....................................'}</span>
                                                <span style={{ flex: 1 }}><strong>Celular:</strong> {formData.celular || '....................................'}</span>
                                            </div>
                                            <div>
                                                <span><strong>E-Mail:</strong> {formData.email || '...................................................................................................................'}</span>
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <span>{formData.ciudad || 'Asunción'}, <strong>{formData.dia || '.....'}</strong> de <strong>{formData.mes || '...............'}</strong> de <strong>{formData.anho || '2026'}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VISTA 2: HISTORIAL REGISTRADO EN SUPABASE */}
                    {activeTab === 'history' && (
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
                                <div>
                                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                        Registro Histórico de Exenciones
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                                        Total de registros en base de datos: {exenciones.length}
                                    </p>
                                </div>

                                <div style={{ minWidth: '280px' }}>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por nombre, CI, socio..."
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
                                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando registros...</p>
                            ) : filteredExenciones.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    <svg style={{ width: '48px', height: '48px', margin: '0 auto 0.5rem auto', opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron registros de exenciones</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Completa el formulario y guarda para crear el primer registro histórico.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-subtle, #e5e7eb)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Fecha Registro</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Tirador / Socio</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>C.I.</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Nº Socio</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Contacto</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Cargado por</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredExenciones.map((item) => (
                                                <tr 
                                                    key={item.id} 
                                                    style={{ 
                                                        borderBottom: '1px solid var(--border-subtle, #f3f4f6)',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedId === item.id ? 'rgba(220, 38, 38, 0.05)' : undefined
                                                    }}
                                                    onClick={() => handleSelectExencion(item)}
                                                >
                                                    <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                                        {new Date(item.created_at).toLocaleDateString('es-PY', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                                        {item.nombre} {item.apellido}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        {item.ci || '-'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem' }}>
                                                        {item.nro_socio || '-'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.85rem' }}>
                                                        {item.celular || item.telefono || item.email || '-'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        {item.admin_user || 'Admin'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                            <button
                                                                type="button"
                                                                title="Editar / Ver"
                                                                onClick={(e) => { e.stopPropagation(); handleSelectExencion(item); }}
                                                                style={{
                                                                    background: '#f3f4f6',
                                                                    border: 'none',
                                                                    padding: '0.35rem 0.6rem',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Imprimir"
                                                                onClick={(e) => { e.stopPropagation(); handleDirectPrint(item); }}
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    color: '#dc2626',
                                                                    border: 'none',
                                                                    padding: '0.35rem 0.6rem',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600,
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            >
                                                                Imprimir
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Eliminar"
                                                                onClick={(e) => handleDelete(item.id, e)}
                                                                style={{
                                                                    background: '#fee2e2',
                                                                    color: '#991b1b',
                                                                    border: 'none',
                                                                    padding: '0.35rem 0.6rem',
                                                                    borderRadius: '0.25rem',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.8rem'
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
                    )}
                </main>
            </div>

            {/* SECCIÓN EXCLUSIVA PARA IMPRESIÓN (A4) */}
            <div className="hidden print:block exencion-print-document" style={{
                fontFamily: '"Times New Roman", Times, serif',
                color: '#000000',
                backgroundColor: '#ffffff',
                width: '100%',
                maxWidth: '780px',
                margin: '0 auto',
                padding: '20px 25px',
                boxSizing: 'border-box',
                lineHeight: '1.28',
                fontSize: '12pt'
            }}>
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        @page {
                            size: A4;
                            margin: 15mm 15mm 10mm 15mm;
                        }
                        body {
                            background: #ffffff !important;
                            color: #000000 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .print\\:hidden {
                            display: none !important;
                        }
                        .exencion-print-document {
                            display: block !important;
                            padding: 0 !important;
                            width: 100% !important;
                        }
                    }
                `}} />

                {/* Header con Logos */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                }}>
                    <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-start' }}>
                        <img 
                            src="/logo CPTP svg.svg" 
                            alt="Logo CPTP" 
                            style={{ height: '70px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </div>
                    <div style={{ textAlign: 'center', flex: 1, padding: '0 10px' }}>
                        <h1 style={{ 
                            fontSize: '17pt', 
                            fontWeight: '900', 
                            margin: 0, 
                            letterSpacing: '0.5px',
                            fontFamily: '"Times New Roman", Times, serif',
                            textTransform: 'uppercase'
                        }}>
                            CLUB PARAGUAYO DE TIRO PRÁCTICO
                        </h1>
                        <h2 style={{ 
                            fontSize: '15pt', 
                            fontWeight: '900', 
                            margin: '3px 0 0 0',
                            letterSpacing: '0.5px'
                        }}>
                            (C.P.T.P.)
                        </h2>
                    </div>
                    <div style={{ width: '85px', display: 'flex', justifyContent: 'flex-end' }}>
                        <img 
                            src="/logo-long-range.svg" 
                            alt="Logo Long Range" 
                            style={{ height: '70px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </div>
                </div>

                {/* Título */}
                <div style={{
                    textAlign: 'center',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    fontSize: '13pt',
                    marginTop: '10px',
                    marginBottom: '12px'
                }}>
                    Exención de Responsabilidad
                </div>

                {/* Texto y Cláusulas */}
                <div style={{ fontSize: '10.2pt', textAlign: 'justify' }}>
                    <p style={{ margin: '0 0 8px 0', textIndent: '0px' }}>
                        No obstante la estricta observancia de las normas de seguridad que rigen al Tiro como actividad deportiva y de esparcimiento, existe la probabilidad de que sus practicantes o terceras personas puedan sufrir accidentes o algún daño físico o material durante su desarrollo.
                    </p>

                    <p style={{ margin: '0 0 8px 0' }}>
                        Por tal motivo, YO, <span style={{ fontWeight: 'bold', borderBottom: '1px dotted #000', minWidth: '180px', display: 'inline-block', textAlign: 'center' }}>{nombreCompleto || '\u00A0'}</span>, en adelante denominado <strong>El Tirador</strong>, siendo mayor de edad y habiendo decidido libre y voluntariamente participar en prácticas y competencias, suscribo el presente <strong>Documento de Exención de Responsabilidad al C. P. T. P.</strong>, afirmando estar plenamente de acuerdo con el texto y contenido de la totalidad de las cláusulas a continuación detalladas:
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>1.</span>
                            <div><strong>Declaración: El Tirador</strong> declara haber recibido en forma satisfactoria suficiente información y orientación de parte de las Autoridades del C. P. T. P. y tener pleno conocimiento de las Reglas de Seguridad de las modalidades de Tiro que opte practicar.-</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>2.</span>
                            <div><strong>Riesgos: El Tirador</strong> manifiesta tener cabal conocimiento sobre la naturaleza de las diferentes modalidades del Tiro Deportivo así como de los posibles riesgos durante sus prácticas y que libre y voluntariamente decide asumir dichos riesgos.-</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>3.</span>
                            <div><strong>Cláusulas de Exención: El Tirador</strong>, libera al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios, de toda responsabilidad por daños que pudiera sufrir su persona o bienes como resultado de su accionar como Tirador Deportivo.-</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>4.</span>
                            <div><strong>Daños a Terceros: El Tirador</strong> se responsabiliza por cualquier daño físico, material, moral de imagen o de cualquier otra índole, que su acción u omisión pudiera causar a terceros. En consecuencia <strong>El Tirador</strong> exime al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios de cualquier responsabilidad indemnizatoria que pudiera ser planteada por terceros, como consecuencia de sus actos u omisiones.-</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ marginRight: '4px', whiteSpace: 'nowrap' }}>5.</span>
                            <div><strong>Salud: El Tirador</strong> afirma que goza de buen estado general de salud para la práctica de las diversas modalidades de Tiro, liberando de cualquier responsabilidad indemnizatoria al C. P. T. P., así como a sus Dirigentes, Funcionarios, Representantes y Socios de cualquier problema de salud que se le pudiera presentar durante su permanencia dentro del predio del Club o como consecuencia de sus prácticas deportivas.-</div>
                        </div>
                    </div>
                </div>

                {/* Campos rellenados con formato de puntos idéntico al PDF */}
                <div style={{ marginTop: '16px', fontSize: '10.5pt', lineHeight: '1.7' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline', paddingRight: '10px' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Nombre:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.nombre ? 'bold' : 'normal' }}>
                                {formData.nombre}
                            </span>
                        </div>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Apellido:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.apellido ? 'bold' : 'normal' }}>
                                {formData.apellido}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline', paddingRight: '10px' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Nº de Socio:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.nroSocio ? 'bold' : 'normal' }}>
                                {formData.nroSocio}
                            </span>
                        </div>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Profesión:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.profesion ? 'bold' : 'normal' }}>
                                {formData.profesion}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline', paddingRight: '10px' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Nº de Cédula:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.ci ? 'bold' : 'normal' }}>
                                {formData.ci}
                            </span>
                        </div>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Fecha de nacimiento:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.fechaNacimiento ? 'bold' : 'normal' }}>
                                {formData.fechaNacimiento}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Dirección:</span>
                        <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.direccion ? 'bold' : 'normal' }}>
                            {formData.direccion}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline', paddingRight: '10px' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Nº Teléfono:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.telefono ? 'bold' : 'normal' }}>
                                {formData.telefono}
                            </span>
                        </div>
                        <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>Celular:</span>
                            <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.celular ? 'bold' : 'normal' }}>
                                {formData.celular}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ whiteSpace: 'nowrap', marginRight: '6px' }}>E-Mail:</span>
                        <span style={{ flex: 1, borderBottom: '1px dotted #000', minHeight: '18px', paddingLeft: '4px', fontWeight: formData.email ? 'bold' : 'normal' }}>
                            {formData.email}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '10px' }}>
                        <span>{formData.ciudad || 'Asunción'},</span>
                        <span style={{ display: 'inline-block', minWidth: '40px', borderBottom: '1px dotted #000', textAlign: 'center', margin: '0 4px', fontWeight: 'bold' }}>
                            {formData.dia || '\u00A0'}
                        </span>
                        <span>de</span>
                        <span style={{ display: 'inline-block', minWidth: '90px', borderBottom: '1px dotted #000', textAlign: 'center', margin: '0 4px', fontWeight: 'bold' }}>
                            {formData.mes || '\u00A0'}
                        </span>
                        <span>de</span>
                        <span style={{ display: 'inline-block', minWidth: '50px', borderBottom: '1px dotted #000', textAlign: 'center', margin: '0 4px', fontWeight: 'bold' }}>
                            {formData.anho || '\u00A0'}
                        </span>
                    </div>
                </div>

                {/* Espacio para firma */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '35px' }}>
                    <div style={{ textAlign: 'center', width: '220px' }}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '10pt', fontWeight: 'bold' }}>
                            Firma del Tirador
                        </div>
                        <div style={{ fontSize: '8.5pt', color: '#444' }}>
                            Aclaración / C.I.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
