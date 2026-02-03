'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModalityFilter from '@/components/ModalityFilter';
import MonthCard from '@/components/MonthCard';
import { createClient } from '@/lib/supabase';
import { Modalidad, EventoConModalidad, MESES } from '@/lib/types';

export default function CalendarPage() {
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [eventos, setEventos] = useState<EventoConModalidad[]>([]);
  const [selectedModalidad, setSelectedModalidad] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();

      // Cargar modalidades
      const { data: modalidadesData, error: modError } = await supabase
        .from('modalidades')
        .select('*')
        .order('nombre');

      if (modError) throw modError;
      setModalidades(modalidadesData || []);

      // Cargar eventos con su modalidad
      const { data: eventosData, error: evError } = await supabase
        .from('eventos')
        .select(`
          *,
          modalidades (*)
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

  // Filtrar eventos por modalidad seleccionada
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
          <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ color: '#DC2626', marginBottom: '1rem' }}>⚠️ Error de Configuración</h2>
            <p style={{ marginBottom: '1.5rem' }}>{error}</p>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
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
      <main className="main">
        <h2 className="section-title">Competencias 2026</h2>

        {modalidades.length > 0 && (
          <ModalityFilter
            modalidades={modalidades}
            selected={selectedModalidad}
            onSelect={setSelectedModalidad}
          />
        )}

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
      </main>
      <Footer />
    </>
  );
}
