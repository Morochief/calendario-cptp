'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError('Email o contraseña incorrectos');
                return;
            }

            router.push('/admin');
            router.refresh();
        } catch {
            setError('Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/logo.png" alt="CPTP" style={{ height: '80px' }} />
                </div>
                <h1>Panel de Administración</h1>
                <p style={{
                    textAlign: 'center',
                    color: '#6B7280',
                    marginBottom: '2rem',
                    fontSize: '0.875rem'
                }}>
                    Club Paraguayo de Tiro Práctico
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@federacion.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    fontSize: '0.75rem',
                    color: '#9CA3AF'
                }}>
                    Acceso restringido a administradores
                </p>
            </div>
        </div>
    );
}
