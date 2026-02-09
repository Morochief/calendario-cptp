'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import UserDropdown from './UserDropdown';

// Lucide-style SVG Icons (1.2px stroke)
const CalendarIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const FolderIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { showToast } = useToast();
    const [user, setUser] = useState<{ email?: string } | null>(null);
    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }: any) => {
            setUser(data.user);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleLogout() {
        const supabase = createClient();
        await supabase.auth.signOut();
        showToast('Sesión cerrada correctamente', 'info');
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <header className="header">
            <Link href="/" className="header-logo">
                <Image
                    src="/logo.svg"
                    alt="Club Paraguayo de Tiro Práctico"
                    width={60}
                    height={60}
                    style={{ objectFit: 'contain' }}
                />
                <div className="header-title">
                    <h1>CLUB PARAGUAYO DE TIRO PRÁCTICO</h1>
                    <span>CALENDARIO DE ACTIVIDADES {new Date().getFullYear()}</span>
                </div>
            </Link>
            <nav className="header-nav">
                <Link href="/" style={{
                    background: !isAdmin && pathname !== '/reglamentos' ? 'var(--bg-hover)' : 'transparent',
                    borderColor: !isAdmin && pathname !== '/reglamentos' ? 'var(--border-hover)' : 'transparent'
                }}>
                    <CalendarIcon />
                    Calendario
                </Link>
                <Link href="/reglamentos" style={{
                    background: pathname === '/reglamentos' ? 'var(--bg-hover)' : 'transparent',
                    borderColor: pathname === '/reglamentos' ? 'var(--border-hover)' : 'transparent'
                }}>
                    <FolderIcon />
                    Reglamentos
                </Link>
                {user ? (
                    <UserDropdown email={user.email} onLogout={handleLogout} />
                ) : (
                    <Link href="/admin" style={{
                        background: isAdmin ? 'var(--bg-hover)' : 'transparent',
                        borderColor: isAdmin ? 'var(--border-hover)' : 'transparent'
                    }}>
                        <SettingsIcon />
                        Admin
                    </Link>
                )}
            </nav>
        </header>
    );
}
