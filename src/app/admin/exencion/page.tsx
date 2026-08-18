'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { Exencion, Evento } from '@/lib/types';

export default function ExencionPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const quickUploadInputRef = useRef<HTMLInputElement>(null);

    const today = new Date();
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const initialFormData = {
        eventoId: '',
        fotoUrl: '',
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [exenciones, setExenciones] = useState<Exencion[]>([]);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingQuick, setUploadingQuick] = useState<string | null>(null);
    const [adminUser, setAdminUser] = useState<string | null>(null);
    
    // Filtros de historial
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEventoId, setFilterEventoId] = useState<string>('todos');
    const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

    // Modal para ver foto firmada
    const [modalPhoto, setModalPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
    const [targetExencionForQuickUpload, setTargetExencionForQuickUpload] = useState<string | null>(null);

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
        await Promise.all([loadExenciones(), loadEventos()]);
        setLoading(false);
    }

    async function loadEventos() {
        const supabase = createClient();
        const { data } = await supabase
            .from('eventos')
            .select(`
                *,
                modalidades (*)
            `)
            .order('fecha', { ascending: false });

        if (data) {
            setEventos(data as Evento[]);
        }
    }

    async function loadExenciones() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('exenciones')
            .select(`
                *,
                eventos (
                    id,
                    titulo,
                    fecha,
                    modalidades (
                        nombre,
                        color
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al cargar exenciones:', error);
        } else if (data) {
            setExenciones(data as Exencion[]);
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLocalPreviewUrl(objectUrl);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
            setLocalPreviewUrl(null);
        }
        setFormData(prev => ({ ...prev, fotoUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleReset = () => {
        setSelectedId(null);
        handleRemoveFile();
        setFormData({
            ...initialFormData,
            dia: new Date().getDate().toString(),
            mes: meses[new Date().getMonth()],
            anho: new Date().getFullYear().toString(),
        });
    };

    // Subir imagen a Supabase Storage bucket 'exenciones'
    async function uploadImageToStorage(file: File, prefix = 'firmada'): Promise<string | null> {
        const supabase = createClient();
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('exenciones')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error al subir a storage exenciones:', uploadError);
            // Intentar con bucket 'event-images' si 'exenciones' no estuviera creado aún
            const { error: fallbackError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (fallbackError) {
                throw new Error(`Error al subir imagen: ${uploadError.message}. Verifica que el bucket 'exenciones' esté creado en Supabase.`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            return publicUrl;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('exenciones')
            .getPublicUrl(filePath);

        return publicUrl;
    }

    const handleSave = async (andPrint = false) => {
        if (!formData.nombre.trim() || !formData.apellido.trim()) {
            showToast('El nombre y el apellido son obligatorios', 'error');
            return;
        }

        setSaving(true);
        const supabase = createClient();

        try {
            let finalFotoUrl = formData.fotoUrl;

            // Si hay un archivo nuevo seleccionado para subir
            if (selectedFile) {
                const uploadedUrl = await uploadImageToStorage(selectedFile, `${formData.nombre}_${formData.apellido}`);
                if (uploadedUrl) {
                    finalFotoUrl = uploadedUrl;
                }
            }

            const payload = {
                evento_id: formData.eventoId ? formData.eventoId : null,
                foto_url: finalFotoUrl || null,
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

            if (selectedId) {
                const { error } = await supabase
                    .from('exenciones')
                    .update(payload)
                    .eq('id', selectedId);

                if (error) throw error;
                showToast('Exención actualizada exitosamente con foto y evento', 'success');
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

            // Actualizar state
            setFormData(prev => ({ ...prev, fotoUrl: finalFotoUrl }));
            setSelectedFile(null);
            await loadExenciones();

            if (andPrint) {
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        } catch (error: any) {
            console.error('Error al guardar exención:', error);
            showToast(`Error: ${error.message || 'Verifica la base de datos'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectExencion = (item: Exencion) => {
        setSelectedId(item.id);
        setSelectedFile(null);
        setLocalPreviewUrl(null);
        setFormData({
            eventoId: item.evento_id || '',
            fotoUrl: item.foto_url || '',
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
        showToast(`Datos de ${item.nombre} ${item.apellido} cargados`, 'info');
    };

    const handleDirectPrint = (item: Exencion) => {
        setSelectedId(item.id);
        setFormData({
            eventoId: item.evento_id || '',
            fotoUrl: item.foto_url || '',
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
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Subida rápida de foto desde la tabla para registros existentes
    const triggerQuickUpload = (exencionId: string) => {
        setTargetExencionForQuickUpload(exencionId);
        if (quickUploadInputRef.current) {
            quickUploadInputRef.current.value = '';
            quickUploadInputRef.current.click();
        }
    };

    const handleQuickFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !targetExencionForQuickUpload) return;
        const file = e.target.files[0];
        const exencionId = targetExencionForQuickUpload;

        setUploadingQuick(exencionId);
        try {
            const exencionItem = exenciones.find(x => x.id === exencionId);
            const prefix = exencionItem ? `${exencionItem.nombre}_${exencionItem.apellido}` : 'exencion';
            const publicUrl = await uploadImageToStorage(file, prefix);

            if (!publicUrl) throw new Error('No se pudo obtener la URL de la imagen');

            const supabase = createClient();
            const { error } = await supabase
                .from('exenciones')
                .update({ foto_url: publicUrl })
                .eq('id', exencionId);

            if (error) throw error;

            showToast('Foto firmada adjuntada correctamente al registro', 'success');
            await loadExenciones();
        } catch (err: any) {
            console.error('Error en subida rápida:', err);
            showToast(`Error al subir: ${err.message}`, 'error');
        } finally {
            setUploadingQuick(null);
            setTargetExencionForQuickUpload(null);
        }
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
        let result = exenciones;

        // Filtro por evento
        if (filterEventoId !== 'todos') {
            if (filterEventoId === 'sin_evento') {
                result = result.filter(e => !e.evento_id);
            } else {
                result = result.filter(e => e.evento_id === filterEventoId);
            }
        }

        // Filtro por texto
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.nombre.toLowerCase().includes(q) ||
                e.apellido.toLowerCase().includes(q) ||
                (e.ci && e.ci.toLowerCase().includes(q)) ||
                (e.nro_socio && e.nro_socio.toLowerCase().includes(q)) ||
                (e.admin_user && e.admin_user.toLowerCase().includes(q)) ||
                (e.eventos?.titulo && e.eventos.titulo.toLowerCase().includes(q))
            );
        }

        return result;
    }, [exenciones, searchTerm, filterEventoId]);

    const nombreCompleto = `${formData.nombre} ${formData.apellido}`.trim();
    const currentEvent = eventos.find(ev => ev.id === formData.eventoId);
    const displayFotoUrl = localPreviewUrl || formData.fotoUrl;

    return (
        <>
            {/* Input oculto para subida rápida desde la tabla */}
            <input
                type="file"
                ref={quickUploadInputRef}
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                onChange={handleQuickFileSelected}
            />

            {/* Header y UI visible en pantalla pero oculto al imprimir */}
            <div className="print:hidden">
                <Header />
                <main className="admin-container" id="main-content" style={{ maxWidth: '1350px', margin: '0 auto', padding: '1.5rem 1rem' }}>
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
                                Exención de Responsabilidad y Auditoría
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                                Carga de tiradores, vinculación a eventos, adjuntos de hojas firmadas e impresión oficial.
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
                                {saving ? 'Guardando...' : (selectedId ? 'Actualizar Registro' : 'Guardar Datos & Foto')}
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
                            Formulario y Adjunto {selectedId && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px' }}>Editando #{selectedId.substring(0, 6)}</span>}
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
                            Historial & Auditoría ({exenciones.length})
                        </button>
                    </div>

                    {/* VISTA 1: FORMULARIO, ADJUNTO DE FOTO Y VISTA PREVIA */}
                    {activeTab === 'form' && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
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
                                        Carga de Exención
                                    </h2>
                                    {adminUser && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Admin: <strong>{adminUser}</strong>
                                        </span>
                                    )}
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); handleSave(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    
                                    {/* SECCIÓN VINCULAR A EVENTO */}
                                    <div style={{
                                        background: '#f8fafc',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '0.5rem',
                                        padding: '0.85rem'
                                    }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
                                            🎯 Vincular a un Evento / Competencia (Opcional)
                                        </label>
                                        <select
                                            name="eventoId"
                                            value={formData.eventoId}
                                            onChange={handleChange}
                                            style={{
                                                width: '100%',
                                                padding: '0.55rem 0.75rem',
                                                borderRadius: '0.375rem',
                                                border: '1px solid #94a3b8',
                                                fontSize: '0.9rem',
                                                backgroundColor: '#ffffff'
                                            }}
                                        >
                                            <option value="">-- Sin evento vinculado (Práctica Libre / General) --</option>
                                            {eventos.map(ev => (
                                                <option key={ev.id} value={ev.id}>
                                                    {ev.fecha} | {ev.titulo} {ev.modalidades?.nombre ? `(${ev.modalidades.nombre})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* SECCIÓN ADJUNTAR FOTO DE LA HOJA FIRMADA */}
                                    <div style={{
                                        background: '#fdf2f2',
                                        border: '1px dashed #f87171',
                                        borderRadius: '0.5rem',
                                        padding: '0.85rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                📷 Foto o Escaneo de la Hoja Firmada (Auditoría)
                                            </label>
                                            {displayFotoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Quitar foto
                                                </button>
                                            )}
                                        </div>

                                        <p style={{ fontSize: '0.75rem', color: '#7f1d1d', margin: '0 0 0.5rem 0' }}>
                                            Sube una foto tomada con el celular o escaneo del documento con la firma del tirador.
                                        </p>

                                        {displayFotoUrl ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #fecaca' }}>
                                                <img 
                                                    src={displayFotoUrl} 
                                                    alt="Vista previa hoja firmada" 
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                                    onClick={() => setModalPhoto({ url: displayFotoUrl, title: `Hoja firmada: ${nombreCompleto || 'Tirador'}` })}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#15803d', display: 'block' }}>
                                                        ✓ Documento adjunto cargado
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModalPhoto({ url: displayFotoUrl, title: `Hoja firmada: ${nombreCompleto || 'Tirador'}` })}
                                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
                                                    >
                                                        Ver foto en grande
                                                    </button>
                                                </div>
                                                <label style={{ cursor: 'pointer', fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.3rem 0.6rem', borderRadius: '0.25rem' }}>
                                                    Cambiar
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="image/*,application/pdf"
                                                        onChange={handleFileChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <label style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: '#ffffff',
                                                border: '1px dashed #cbd5e1',
                                                borderRadius: '0.375rem',
                                                padding: '1rem',
                                                cursor: 'pointer'
                                            }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                    <circle cx="12" cy="13" r="4" />
                                                </svg>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginTop: '0.25rem' }}>
                                                    Seleccionar foto / Tomar foto
                                                </span>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    accept="image/*,application/pdf"
                                                    onChange={handleFileChange}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* DATOS PERSONALES */}
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

                                    {currentEvent && (
                                        <div style={{
                                            marginBottom: '0.75rem',
                                            padding: '0.4rem 0.75rem',
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.8rem',
                                            color: '#1e40af'
                                        }}>
                                            Evento: <strong>{currentEvent.titulo}</strong> ({currentEvent.fecha})
                                        </div>
                                    )}

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

                    {/* VISTA 2: HISTORIAL REGISTRADO EN SUPABASE & AUDITORIA */}
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
                                        Auditoría y Registro Histórico de Exenciones
                                    </h2>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                                        Total de registros: <strong>{exenciones.length}</strong> {filteredExenciones.length !== exenciones.length && `(Filtrados: ${filteredExenciones.length})`}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    {/* Filtro por evento */}
                                    <select
                                        value={filterEventoId}
                                        onChange={(e) => setFilterEventoId(e.target.value)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-subtle, #d1d5db)',
                                            fontSize: '0.85rem',
                                            backgroundColor: 'var(--bg-card)'
                                        }}
                                    >
                                        <option value="todos">Todos los eventos</option>
                                        <option value="sin_evento">Sin evento asignado</option>
                                        {eventos.map(ev => (
                                            <option key={ev.id} value={ev.id}>
                                                {ev.fecha} - {ev.titulo}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Buscador */}
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Buscar por tirador, CI, socio, evento..."
                                        style={{
                                            minWidth: '260px',
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border-subtle, #d1d5db)',
                                            fontSize: '0.85rem'
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
                                    <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron registros</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Prueba cambiando el filtro de evento o el término de búsqueda.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border-subtle, #e5e7eb)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Fecha Registro</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Tirador / Socio</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>C.I.</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Evento Vinculado</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Hoja Firmada (Auditoría)</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>Cargado por</th>
                                                <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', textAlign: 'right' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredExenciones.map((item) => {
                                                const eventInfo = item.eventos;
                                                return (
                                                    <tr 
                                                        key={item.id} 
                                                        style={{ 
                                                            borderBottom: '1px solid var(--border-subtle, #f3f4f6)',
                                                            backgroundColor: selectedId === item.id ? 'rgba(220, 38, 38, 0.05)' : undefined
                                                        }}
                                                    >
                                                        <td style={{ padding: '0.75rem 0.5rem', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                            {new Date(item.created_at).toLocaleDateString('es-PY', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {item.nombre} {item.apellido}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {item.nro_socio ? `Socio #${item.nro_socio}` : 'No socio'} | {item.celular || item.telefono || '-'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                                                            {item.ci || '-'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            {eventInfo ? (
                                                                <div>
                                                                    <span style={{
                                                                        display: 'inline-block',
                                                                        padding: '0.2rem 0.5rem',
                                                                        borderRadius: '0.25rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        backgroundColor: '#eff6ff',
                                                                        color: '#1d4ed8',
                                                                        border: '1px solid #bfdbfe'
                                                                    }}>
                                                                        {eventInfo.titulo}
                                                                    </span>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                        {eventInfo.fecha}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                                    General / Libre
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem' }}>
                                                            {item.foto_url ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setModalPhoto({
                                                                        url: item.foto_url!,
                                                                        title: `Hoja Firmada: ${item.nombre} ${item.apellido}`,
                                                                        subtitle: eventInfo ? `Evento: ${eventInfo.titulo} (${eventInfo.fecha})` : 'Práctica libre'
                                                                    })}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.35rem',
                                                                        padding: '0.3rem 0.6rem',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        backgroundColor: '#ecfdf5',
                                                                        color: '#047857',
                                                                        border: '1px solid #a7f3d0',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                                        <circle cx="12" cy="13" r="4" />
                                                                    </svg>
                                                                    Ver Foto Firmada
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    disabled={uploadingQuick === item.id}
                                                                    onClick={() => triggerQuickUpload(item.id)}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.35rem',
                                                                        padding: '0.3rem 0.6rem',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        backgroundColor: '#fef2f2',
                                                                        color: '#b91c1c',
                                                                        border: '1px dashed #f87171',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                        <polyline points="17 8 12 3 7 8" />
                                                                        <line x1="12" y1="3" x2="12" y2="15" />
                                                                    </svg>
                                                                    {uploadingQuick === item.id ? 'Subiendo...' : '+ Adjuntar Foto'}
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {item.admin_user || 'Admin'}
                                                        </td>
                                                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    type="button"
                                                                    title="Editar / Cargar al Formulario"
                                                                    onClick={() => handleSelectExencion(item)}
                                                                    style={{
                                                                        background: '#f3f4f6',
                                                                        border: 'none',
                                                                        padding: '0.35rem 0.55rem',
                                                                        borderRadius: '0.25rem',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem'
                                                                    }}
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    title="Imprimir formato A4"
                                                                    onClick={() => handleDirectPrint(item)}
                                                                    style={{
                                                                        background: '#fee2e2',
                                                                        color: '#dc2626',
                                                                        border: 'none',
                                                                        padding: '0.35rem 0.55rem',
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
                                                                        padding: '0.35rem 0.55rem',
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* MODAL PARA VER FOTO FIRMADA EN ALTA RESOLUCIÓN */}
            {modalPhoto && (
                <div 
                    className="print:hidden"
                    onClick={() => setModalPhoto(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '0.75rem',
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                                    {modalPhoto.title}
                                </h3>
                                {modalPhoto.subtitle && (
                                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                                        {modalPhoto.subtitle}
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <a 
                                    href={modalPhoto.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn-outline"
                                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                >
                                    Abrir original ↗
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setModalPhoto(null)}
                                    style={{
                                        background: '#f1f5f9',
                                        border: 'none',
                                        borderRadius: '0.375rem',
                                        width: '32px',
                                        height: '32px',
                                        fontSize: '1.2rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                            <img 
                                src={modalPhoto.url} 
                                alt={modalPhoto.title} 
                                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '0.25rem' }} 
                            />
                        </div>
                    </div>
                </div>
            )}

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
                        .print\\:hidden,
                        .toast-container,
                        .toast {
                            display: none !important;
                            visibility: hidden !important;
                            opacity: 0 !important;
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
