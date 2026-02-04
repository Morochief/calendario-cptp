'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <header className="header">
            <Link href="/" className="header-logo">
                <Image
                    src="/logo.png"
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
                    background: !isAdmin ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                    📅 Calendario
                </Link>
                <Link href="/admin" style={{
                    background: isAdmin ? 'rgba(255,255,255,0.15)' : 'transparent'
                }}>
                    ⚙️ Admin
                </Link>
            </nav>
        </header>
    );
}
