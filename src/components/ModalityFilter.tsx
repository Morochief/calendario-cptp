'use client';

import { useState, useRef, useEffect } from 'react';
import { Modalidad } from '@/lib/types';

// Lucide-style SVG Icons (1.2px stroke)
const FilterIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const LayersIcon = () => (
    <svg className="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

interface ModalityFilterProps {
    modalidades: Modalidad[];
    selected: string | null;
    onSelect: (id: string | null) => void;
}

export default function ModalityFilter({ modalidades, selected, onSelect }: ModalityFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedModality = modalidades.find(m => m.id === selected);

    const handleSelect = (id: string | null) => {
        onSelect(id);
        setIsOpen(false);
    };

    return (
        <div className="filter-container" ref={dropdownRef}>
            <button
                className={`filter-trigger ${selected ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedModality ? (
                        <>
                            <span
                                className="dot"
                                style={{
                                    background: selectedModality.color,
                                    width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block'
                                }}
                            />
                            {selectedModality.nombre}
                        </>
                    ) : (
                        <>
                            <FilterIcon />
                            Filtrar por Modalidad
                        </>
                    )}
                </div>

                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        opacity: 0.5
                    }}
                >
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            {isOpen && (
                <div className="filter-dropdown-menu">
                    <button
                        className={`dropdown-item ${selected === null ? 'selected' : ''}`}
                        onClick={() => handleSelect(null)}
                    >
                        <LayersIcon />
                        Ver Todas
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.25rem 0' }} />

                    {modalidades.map((mod) => (
                        <button
                            key={mod.id}
                            className={`dropdown-item ${selected === mod.id ? 'selected' : ''}`}
                            onClick={() => handleSelect(mod.id)}
                        >
                            <span
                                className="dot"
                                style={{ background: mod.color }}
                            />
                            {mod.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
