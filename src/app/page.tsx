import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CalendarShell from '@/components/CalendarShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// Incremental Static Regeneration (ISR) - revalidates page static cache every 60 seconds
export const revalidate = 60;

export default async function CalendarPage() {
    const supabase = await createServerSupabaseClient();

    // Fetch modalities and events in parallel directly on the server side
    const [modalidadesRes, eventosRes] = await Promise.all([
        supabase
            .from('modalidades')
            .select('*')
            .order('nombre'),
        supabase
            .from('eventos')
            .select(`
                *,
                modalidades (*),
                tipos_evento (*)
            `)
            .order('fecha')
    ]);

    // Handle data loading errors gracefully on the server
    if (modalidadesRes.error || eventosRes.error) {
        console.error('Error loading data on server:', modalidadesRes.error || eventosRes.error);
        return (
            <>
                <Header />
                <main className="main">
                    <div className="bento-cell" style={{ textAlign: 'center', padding: '3rem' }}>
                        <svg className="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-error)', width: '48px', height: '48px', margin: '0 auto' }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h2 style={{ color: 'var(--color-error)', margin: '1rem 0' }}>Error de Conexión</h2>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            No se pudieron cargar los datos del calendario del CPTP.
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Asegúrese de configurar correctamente las credenciales de Supabase en las variables de entorno de producción.
                        </p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const modalidades = modalidadesRes.data || [];
    const eventos = (eventosRes.data || []) as any[];

    return (
        <>
            <Header />
            <main className="bento-grid">
                <CalendarShell initialEventos={eventos} initialModalidades={modalidades} />
            </main>
            <Footer />
        </>
    );
}
