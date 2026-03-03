'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

const ROUTES: Record<string, BreadcrumbItem> = {
    '/admin': { label: 'Panel', href: '/admin' },
    '/admin/eventos': { label: 'Eventos' },
    '/admin/eventos/nuevo': { label: 'Nuevo Evento' },
    '/admin/modalidades': { label: 'Modalidades' },
    '/admin/tipos-evento': { label: 'Tipos de Evento' },
    '/admin/inscripciones': { label: 'Inscripciones' },
    '/admin/reglamentos': { label: 'Reglamentos' },
};

export default function Breadcrumbs() {
    const pathname = usePathname();

    // Generate breadcrumb items from current path
    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const items: BreadcrumbItem[] = [{ label: 'Inicio', href: '/' }];

        if (!pathname.startsWith('/admin')) {
            return items;
        }

        // Add admin root
        items.push({ label: 'Admin', href: '/admin' });

        // Check for known routes
        const route = ROUTES[pathname];
        if (route && pathname !== '/admin') {
            items.push({ label: route.label });
        } else if (pathname.startsWith('/admin/eventos/') && pathname !== '/admin/eventos/nuevo') {
            // Dynamic event edit page
            items.push({ label: 'Editar Evento' });
        }

        return items;
    };

    const breadcrumbs = getBreadcrumbs();

    if (breadcrumbs.length <= 1) {
        return null;
    }

    return (
        <nav className="breadcrumbs" aria-label="Navegación de migas de pan">
            <ol className="breadcrumb-list">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <li key={index} className="breadcrumb-item">
                            {!isLast && item.href ? (
                                <>
                                    <Link
                                        href={item.href}
                                        className="breadcrumb-link"
                                        aria-current={undefined}
                                    >
                                        {item.label}
                                    </Link>
                                    <span className="breadcrumb-separator" aria-hidden="true">/</span>
                                </>
                            ) : (
                                <span
                                    className="breadcrumb-current"
                                    aria-current="page"
                                >
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
