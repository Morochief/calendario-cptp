'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

// Lucide-style SVG Icons (1.2px stroke)
const InboxIcon = () => (
    <svg className="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
);

const AlertTriangleIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const PlusIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

/**
 * Empty State Component
 * Shows a friendly message when there's no data
 * Optionally provides a call-to-action
 */
export default function EmptyState({
    icon = <InboxIcon />,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="empty-state" role="status" aria-label={title}>
            <div className="empty-state-icon" aria-hidden="true">
                {icon}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            {description && (
                <p className="empty-state-description">{description}</p>
            )}
            {(actionLabel && (actionHref || onAction)) && (
                actionHref ? (
                    <Link href={actionHref} className="btn btn-primary empty-state-action">
                        <PlusIcon />
                        {actionLabel}
                    </Link>
                ) : (
                    <button
                        onClick={onAction}
                        className="btn btn-primary empty-state-action"
                    >
                        <PlusIcon />
                        {actionLabel}
                    </button>
                )
            )}
        </div>
    );
}

/**
 * Selector Empty State
 * Shows when a required select has no options
 */
export function SelectEmptyState({
    entityName,
    createHref
}: {
    entityName: string;
    createHref: string;
}) {
    return (
        <div className="select-empty-state">
            <AlertTriangleIcon />
            <span>No hay {entityName} disponibles.</span>
            <Link href={createHref} className="select-empty-link">
                Crear {entityName}
            </Link>
        </div>
    );
}
