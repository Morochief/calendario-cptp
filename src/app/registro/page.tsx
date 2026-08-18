'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export default function PublicRegistroTiradorPage() {
    const { showToast } = useToast();
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        ci: '',
        nroSocio: '',
        profesion: '',
        fechaNacimiento: '',
        direccion: '',
        celular: '',
        telefono: '',
        email: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<typeof formData | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.ci.trim() || !formData.celular.trim()) {
            showToast('Por favor completa Nombre, Apellido, Cédula y Celular', 'error');
            return;
        }

        setSubmitting(true);
        const supabase = createClient();

        const payload = {
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            ci: formData.ci.trim(),
            nro_socio: formData.nroSocio.trim() || null,
            profesion: formData.profesion.trim() || null,
            fecha_nacimiento: formData.fechaNacimiento.trim() || null,
            direccion: formData.direccion.trim() || null,
            celular: formData.celular.trim(),
            telefono: formData.telefono.trim() || null,
            email: formData.email.trim() || null,
            updated_at: new Date().toISOString(),
        };

        try {
            // Verificar si ya existe por CI
            const { data: existing } = await supabase
                .from('tiradores')
                .select('id')
                .eq('ci', payload.ci)
                .maybeSingle();

            if (existing) {
                const { error: updateError } = await supabase
                    .from('tiradores')
                    .update(payload)
                    .eq('id', existing.id);

                if (updateError) throw updateError;
                showToast('Tus datos fueron actualizados correctamente en el sistema', 'success');
            } else {
                const { error: insertError } = await supabase
                    .from('tiradores')
                    .insert([payload]);

                if (insertError) throw insertError;
                showToast('¡Registro completado con éxito!', 'success');
            }

            setSubmittedData({ ...formData });
        } catch (error: any) {
            console.error('Error al registrar tirador:', error);
            showToast(`Error al guardar datos: ${error.message || 'Verifica la conexión'}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNewRegistration = () => {
        setSubmittedData(null);
        setFormData({
            nombre: '',
            apellido: '',
            ci: '',
            nroSocio: '',
            profesion: '',
            fechaNacimiento: '',
            direccion: '',
            celular: '',
            telefono: '',
            email: '',
        });
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            backgroundImage: 'radial-gradient(at 0% 0%, rgba(220, 38, 38, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(30, 58, 138, 0.2) 0px, transparent 50%)',
            color: '#f8fafc',
            fontFamily: "'Inter', sans-serif",
            padding: '2rem 1rem'
        }}>
            <div style={{ maxWidth: '640px', margin: '0 auto' }}>
                
                {/* Header con Logos */}
                <div style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <img 
                            src="/logo CPTP svg.svg" 
                            alt="Logo CPTP" 
                            style={{ height: '56px', width: 'auto', objectFit: 'contain' }} 
                        />
                        <img 
                            src="/logo-long-range.svg" 
                            alt="Logo Long Range" 
                            style={{ height: '56px', width: 'auto', objectFit: 'contain' }} 
                        />
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.03em', margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>
                        Club Paraguayo de Tiro Práctico
                    </h1>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: '0.35rem 0 0 0', fontWeight: 500 }}>
                        Ficha de Registro de Tirador / Socio
                    </p>
                </div>

                {/* Si ya fue enviado, mostrar Pantalla de Éxito */}
                {submittedData ? (
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid #22c55e',
                        borderRadius: '1rem',
                        padding: '2rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem auto',
                            fontSize: '2rem'
                        }}>
                            ✓
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                            ¡Datos Registrados con Éxito!
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0.75rem 0 1.5rem 0', lineHeight: 1.5 }}>
                            Tus datos han quedado guardados en el sistema del <strong>CPTP</strong>. Al momento de participar en prácticas o competencias, la administración podrá cargar tu documento de exención de forma automática e inmediata.
                        </p>

                        <div style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '0.5rem',
                            padding: '1.25rem',
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            marginBottom: '1.75rem',
                            lineHeight: 1.6
                        }}>
                            <div><strong style={{ color: '#94a3b8' }}>Tirador:</strong> {submittedData.nombre} {submittedData.apellido}</div>
                            <div><strong style={{ color: '#94a3b8' }}>Cédula:</strong> {submittedData.ci}</div>
                            {submittedData.nroSocio && <div><strong style={{ color: '#94a3b8' }}>Nº Socio:</strong> #{submittedData.nroSocio}</div>}
                            <div><strong style={{ color: '#94a3b8' }}>Celular:</strong> {submittedData.celular}</div>
                            {submittedData.email && <div><strong style={{ color: '#94a3b8' }}>E-Mail:</strong> {submittedData.email}</div>}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                onClick={handleNewRegistration}
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem'
                                }}
                            >
                                Registrar a otra persona
                            </button>
                            <Link
                                href="/"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#94a3b8',
                                    fontWeight: 600,
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem 1.25rem',
                                    textDecoration: 'none',
                                    fontSize: '0.95rem',
                                    display: 'inline-block'
                                }}
                            >
                                Ver Calendario CPTP
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Formulario de Carga */
                    <div style={{
                        backgroundColor: 'rgba(30, 41, 59, 0.85)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '1rem',
                        padding: '1.75rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div style={{
                            backgroundColor: 'rgba(220, 38, 38, 0.12)',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem',
                            color: '#fca5a5',
                            lineHeight: 1.45
                        }}>
                            ℹ️ Completa tus datos una sola vez. Esta información se utilizará para generar tu documento de Exención de Responsabilidad y gestionar tus inscripciones en el Club.
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        required
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Juan"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Apellido *
                                    </label>
                                    <input
                                        type="text"
                                        name="apellido"
                                        required
                                        value={formData.apellido}
                                        onChange={handleChange}
                                        placeholder="Ej: Pérez"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Nº de Cédula *
                                    </label>
                                    <input
                                        type="text"
                                        name="ci"
                                        required
                                        value={formData.ci}
                                        onChange={handleChange}
                                        placeholder="Ej: 3.456.789"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Nº de Socio (si aplica)
                                    </label>
                                    <input
                                        type="text"
                                        name="nroSocio"
                                        value={formData.nroSocio}
                                        onChange={handleChange}
                                        placeholder="Ej: 1245"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Profesión
                                    </label>
                                    <input
                                        type="text"
                                        name="profesion"
                                        value={formData.profesion}
                                        onChange={handleChange}
                                        placeholder="Ej: Abogado"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Fecha de Nacimiento
                                    </label>
                                    <input
                                        type="text"
                                        name="fechaNacimiento"
                                        value={formData.fechaNacimiento}
                                        onChange={handleChange}
                                        placeholder="Ej: 15/04/1985"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    Dirección Particular / Laboral
                                </label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleChange}
                                    placeholder="Ej: Av. Santa Teresa 1234 c/ Denis Roa"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        backgroundColor: '#0f172a',
                                        color: '#ffffff',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Celular (WhatsApp) *
                                    </label>
                                    <input
                                        type="text"
                                        name="celular"
                                        required
                                        value={formData.celular}
                                        onChange={handleChange}
                                        placeholder="Ej: 0981 123456"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                        Nº Teléfono (Línea baja)
                                    </label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="Ej: 021 123456"
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            backgroundColor: '#0f172a',
                                            color: '#ffffff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                                    Correo Electrónico (E-Mail)
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Ej: juan.perez@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        backgroundColor: '#0f172a',
                                        color: '#ffffff',
                                        fontSize: '0.95rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginTop: '0.75rem' }}>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1.5rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: '#dc2626',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        border: 'none',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {submitting ? 'Enviando datos...' : 'Enviar Registro de Tirador'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
