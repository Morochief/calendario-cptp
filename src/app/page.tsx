'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModalityFilter from '@/components/ModalityFilter';
import MonthCard from '@/components/MonthCard';
import AnnualCalendar from '@/components/AnnualCalendar';
import MetricsWidget from '@/components/MetricsWidget';
import UpcomingWidget from '@/components/UpcomingWidget';
import SystemStatusWidget from '@/components/SystemStatusWidget';
import { createClient } from '@/lib/supabase';
import { Modalidad, EventoConModalidad, MESES } from '@/lib/types';

// Lucide-style SVG Icons (1.2px stroke)
const CalendarIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const GridIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg className="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

type ViewType = 'mensual' | 'anual';

export default function CalendarPage() {
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [eventos, setEventos] = useState<EventoConModalidad[]>([]);
  const [selectedModalidad, setSelectedModalidad] = useState<string | null>(null);
  const [vista, setVista] = useState<ViewType>('mensual');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();

      const { data: modalidadesData, error: modError } = await supabase
        .from('modalidades')
        .select('*')
        .order('nombre');

      if (modError) throw modError;
      setModalidades(modalidadesData || []);

      const { data: eventosData, error: evError } = await supabase
        .from('eventos')
        .select(`
                    *,
                    modalidades (*),
                    tipos_evento (*)
                `)
        .order('fecha');

      if (evError) throw evError;
      setEventos(eventosData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifica la configuración de Supabase.');
    } finally {
      setLoading(false);
    }
  }

  const eventosFiltrados = selectedModalidad
    ? eventos.filter(e => e.modalidad_id === selectedModalidad)
    : eventos;

  if (loading) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="main">
          <div className="bento-cell" style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertCircleIcon />
            <h2 style={{ color: 'var(--color-error)', margin: '1rem 0' }}>Error de Configuración</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{error}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Asegúrate de configurar las variables de entorno NEXT_PUBLIC_SUPABASE_URL y
              NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bento-grid">
        {/* Main Calendar Cell */}
        <div className="bento-cell bento-main">
          <div className="calendar-header">
            <h2 className="section-title">Competencias 2026</h2>

            <div className="view-toggle">
              <button
                className={`view-btn ${vista === 'mensual' ? 'active' : ''}`}
                onClick={() => setVista('mensual')}
              >
                <CalendarIcon />
                Mensual
              </button>
              <button
                className={`view-btn ${vista === 'anual' ? 'active' : ''}`}
                onClick={() => setVista('anual')}
              >
                <GridIcon />
                Anual
              </button>
            </div>
          </div>

          {modalidades.length > 0 && (
            <ModalityFilter
              modalidades={modalidades}
              selected={selectedModalidad}
              onSelect={setSelectedModalidad}
            />
          )}

          {vista === 'mensual' ? (
            <div className="calendar-grid">
              {MESES.map((mes, index) => (
                <MonthCard
                  key={mes}
                  mes={mes}
                  mesIndex={index}
                  eventos={eventosFiltrados}
                />
              ))}
            </div>
          ) : (
            <AnnualCalendar eventos={eventosFiltrados} year={2026} />
          )}
        </div>

        {/* Side Widgets */}
        <MetricsWidget eventos={eventos} modalidades={modalidades} />
        <UpcomingWidget eventos={eventos} />
        <SystemStatusWidget />
      </main>
      <Footer />
    </>
  );
}
