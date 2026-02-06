'use client';

import { Modalidad } from '@/lib/types';

interface ModalityFilterProps {
    modalidades: Modalidad[];
    selected: string | null;
    onSelect: (id: string | null) => void;
}

export default function ModalityFilter({ modalidades, selected, onSelect }: ModalityFilterProps) {
    return (
        <div className="filter-bar">
            {/* Scroll Container for horizontal swiping */}
            <div className="filter-scroll-container">
                <button
                    className={`filter-chip ${selected === null ? 'active' : ''}`}
                    onClick={() => onSelect(null)}
                >
                    Todas
                </button>
                {modalidades.map((mod) => (
                    <button
                        key={mod.id}
                        className={`filter-chip ${selected === mod.id ? 'active' : ''}`}
                        onClick={() => onSelect(mod.id)}
                        style={{
                            backgroundColor: selected === mod.id ? mod.color : undefined,
                            borderColor: selected === mod.id ? mod.color : undefined,
                            color: selected === mod.id ? 'white' : undefined
                        }}
                    >
                        <span className="dot" style={{ background: selected === mod.id ? 'white' : mod.color }} />
                        {mod.nombre}
                    </button>
                ))}
            </div>
        </div>
    );
}
