'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import EventForm from '@/components/EventForm';
import EventImageUpload from '@/components/EventImageUpload';
import { FormSkeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { createClient } from '@/lib/supabase';
import { EventoInput } from '@/lib/schemas';

interface EventoData extends Partial<EventoInput> {
    id: string;
}

export default function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [evento, setEvento] = useState<EventoData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthAndLoad();
    }, [id]);

    async function checkAuthAndLoad() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/admin/login');
            return;
        }

        const { data: eventoData, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !eventoData) {
            setNotFound(true);
        } else {
            setEvento({
                id: eventoData.id,
                titulo: eventoData.titulo,
                modalidad_id: eventoData.modalidad_id,
                fecha: eventoData.fecha,
                hora: eventoData.hora || '08:30',
                ubicacion: eventoData.ubicacion || '',
                descripcion: eventoData.descripcion || '',
                tipo_evento_id: eventoData.tipo_evento_id || '',
            });
        }

        setLoading(false);
    }

    if (loading) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <Breadcrumbs />
                    <div className="admin-card">
                        <h3 style={{ marginBottom: '1.5rem' }}>Cargando evento...</h3>
                        <FormSkeleton />
                    </div>
                </div>
            </>
        );
    }

    if (notFound) {
        return (
            <>
                <Header />
                <div className="admin-container">
                    <Breadcrumbs />
                    <EmptyState
                        icon="🔍"
                        title="Evento no encontrado"
                        description="El evento que buscas no existe o fue eliminado."
                        actionLabel="← Volver al panel"
                        actionHref="/admin"
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="admin-container" id="main-content">
                <Breadcrumbs />
                <div className="admin-header">
                    <h2 className="section-title">Editar Evento</h2>
                    <Link href="/admin" className="btn btn-secondary" aria-label="Volver al panel">
                        ← Volver
                    </Link>
                </div>

                <div className="admin-card">
                    <EventForm initialData={evento!} isEditing />
                </div>

                {/* Gallery Section */}
                <div className="admin-card" style={{ marginTop: '1.5rem' }}>
                    <EventImageUpload eventoId={id} />
                </div>
            </div>
        </>
    );
}
