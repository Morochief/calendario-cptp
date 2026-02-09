'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

// Lucide-style SVG Icons (1.2px stroke)
const PhoneIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const MapPinIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

interface Contacto {
    id: string;
    nombre: string;
    contacto_nombre: string | null;
    contacto_telefono: string | null;
}

interface ContactoAgrupado {
    nombre: string;
    telefono: string;
    modalidades: string[];
}

export default function Footer() {
    const [contactosAgrupados, setContactosAgrupados] = useState<ContactoAgrupado[]>([]);

    useEffect(() => {
        loadContactos();
    }, []);

    async function loadContactos() {
        const supabase = createClient();
        const { data } = await supabase
            .from('modalidades')
            .select('id, nombre, contacto_nombre, contacto_telefono')
            .not('contacto_nombre', 'is', null)
            .order('nombre');

        if (data) {
            const agrupados: { [key: string]: ContactoAgrupado } = {};

            data.forEach((c: Contacto) => {
                const key = c.contacto_nombre || '';
                if (!agrupados[key]) {
                    agrupados[key] = {
                        nombre: c.contacto_nombre || '',
                        telefono: c.contacto_telefono || '',
                        modalidades: []
                    };
                }
                agrupados[key].modalidades.push(c.nombre);
            });

            setContactosAgrupados(Object.values(agrupados));
        }
    }

    const formatPhone = (phone: string) => {
        return phone.replace(/\D/g, '');
    };

    return (
        <footer className="contact-footer">
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <PhoneIcon />
                Contactos por Modalidad
            </h3>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '1.5rem'
            }}>
                {contactosAgrupados.map((c, idx) => (
                    <a
                        key={idx}
                        href={`https://wa.me/595${formatPhone(c.telefono)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '1rem 1.5rem',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            minWidth: '180px',
                            transition: 'all var(--transition-normal)'
                        }}
                        className="elite-card"
                    >
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            {c.modalidades.join(' • ')}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                            {c.nombre}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#25D366', marginTop: '0.5rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {c.telefono}
                        </span>
                    </a>
                ))}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <a
                    href="https://maps.app.goo.gl/weBjZMXHERaafE858?g_st=aw"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        transition: 'all var(--transition-normal)'
                    }}
                    className="elite-card"
                >
                    <MapPinIcon />
                    Ver ubicación del Club en Google Maps
                </a>
            </div>

            <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                © {new Date().getFullYear()} Club Paraguayo de Tiro Práctico. Todos los derechos reservados.
            </p>
        </footer>
    );
}
