import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Check, Info } from 'lucide-react';

export type DentitionType = 'permanente' | 'decidua' | 'misto';

interface ToothFaceProps {
  toothId: string;
  face: string;
  isSelected: boolean;
  onToggle: (toothId: string, face: string) => void;
  className?: string;
  d: string;
}

const ToothFace: React.FC<ToothFaceProps> = ({ toothId, face, isSelected, onToggle, className, d }) => (
  <path
    d={d}
    onClick={(e) => {
      e.stopPropagation();
      onToggle(toothId, face);
    }}
    className={cn(
      "cursor-pointer transition-all duration-200 stroke-charcoal-950 stroke-[0.8]",
      isSelected ? "fill-primary-500 stroke-primary-600" : "fill-white hover:fill-charcoal-100",
      className
    )}
  />
);

interface ToothProps {
  id: string;
  selectedFaces: string[];
  onToggleFace: (toothId: string, face: string) => void;
  label: string;
}

const Tooth: React.FC<ToothProps> = ({ id, selectedFaces, onToggleFace, label }) => {
  // SVG paths for a standard tooth with 5 faces
  // V = Vestibular, L = Lingual/Palatina, M = Mesial, D = Distal, O = Oclusal
  const faces = [
    { id: 'V', d: "M 5,5 L 45,5 L 35,15 L 15,15 Z" }, // Top
    { id: 'L', d: "M 15,35 L 35,35 L 45,45 L 5,45 Z" }, // Bottom
    { id: 'M', d: "M 5,5 L 15,15 L 15,35 L 5,45 Z" }, // Left
    { id: 'D', d: "M 45,5 L 45,45 L 35,35 L 35,15 Z" }, // Right
    { id: 'O', d: "M 15,15 L 35,15 L 35,35 L 15,35 Z" }, // Center
  ];

  const isToothSelected = selectedFaces.length > 0;

  return (
    <div className="flex flex-col items-center gap-0.5 group">
      <div className={cn(
        "p-0.5 bg-white rounded-lg border transition-all shadow-sm",
        isToothSelected ? "border-primary-200 bg-primary-50/30 shadow-primary-100" : "border-charcoal-100 group-hover:border-charcoal-200 group-hover:shadow-md"
      )}>
        <svg width="24" height="24" viewBox="0 0 50 50" className="overflow-visible">
          {faces.map((face) => (
            <ToothFace
              key={face.id}
              toothId={id}
              face={face.id}
              isSelected={selectedFaces.includes(face.id)}
              onToggle={onToggleFace}
              d={face.d}
            />
          ))}
          {/* Internal lines for quadrants */}
          <line x1="15" y1="15" x2="35" y2="35" stroke="currentColor" strokeWidth="0.5" className="text-charcoal-200 pointer-events-none" />
          <line x1="35" y1="15" x2="15" y2="35" stroke="currentColor" strokeWidth="0.5" className="text-charcoal-200 pointer-events-none" />
        </svg>
      </div>
      {/* Tooth ID Label */}
      <span className={cn(
        "text-[7px] font-bold transition-colors",
        isToothSelected ? "text-primary-600" : "text-charcoal-400 group-hover:text-charcoal-600"
      )}>
        {label}
      </span>
    </div>
  );
};

interface OdontogramProps {
  onSelectionChange: (data: { denticao: DentitionType; dentes_selecionados: string[] }) => void;
  initialSelection?: string[];
  initialDentition?: DentitionType;
}

export const Odontogram: React.FC<OdontogramProps> = ({ 
  onSelectionChange, 
  initialSelection = [],
  initialDentition = 'permanente'
}) => {
  const [denticao, setDenticao] = useState<DentitionType>(initialDentition);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>(initialSelection);

  const handleToggleFace = (toothId: string, face: string) => {
    const tag = `${toothId}-${face}`;
    const newSelection = selectedTeeth.includes(tag)
      ? selectedTeeth.filter(t => t !== tag)
      : [...selectedTeeth, tag];
    
    setSelectedTeeth(newSelection);
    onSelectionChange({ denticao, dentes_selecionados: newSelection });
  };

  const clearSelection = () => {
    setSelectedTeeth([]);
    onSelectionChange({ denticao, dentes_selecionados: [] });
  };

  const renderQuadrant = (ids: string[], title: string, isSmall = false) => (
    <div className="flex flex-col gap-0.5 items-center">
      {!isSmall && <span className="text-[8px] font-bold text-charcoal-400 uppercase tracking-widest mb-0">{title}</span>}
      <div className="flex gap-0.5">
        {ids.map(id => (
          <Tooth
            key={id}
            id={id}
            label={id}
            selectedFaces={selectedTeeth
              .filter(t => t.startsWith(`${id}-`))
              .map(t => t.split('-')[1])
            }
            onToggleFace={handleToggleFace}
          />
        ))}
      </div>
    </div>
  );

  // Permanente IDs
  const pUR = ['18', '17', '16', '15', '14', '13', '12', '11'];
  const pUL = ['21', '22', '23', '24', '25', '26', '27', '28'];
  const pLR = ['48', '47', '46', '45', '44', '43', '42', '41'];
  const pLL = ['31', '32', '33', '34', '35', '36', '37', '38'];

  // Decidua IDs
  const dUR = ['55', '54', '53', '52', '51'];
  const dUL = ['61', '62', '63', '64', '65'];
  const dLR = ['85', '84', '83', '82', '81'];
  const dLL = ['71', '72', '73', '74', '75'];

  const facesLegend = [
    { id: 'V', name: 'Vestibular' },
    { id: 'L', name: 'Lingual' },
    { id: 'M', name: 'Mesial' },
    { id: 'D', name: 'Distal' },
    { id: 'O', name: 'Oclusal' },
  ];

  return (
    <div className="flex flex-col w-full max-w-full overflow-hidden">
      {/* Faces Legend */}
      <div className="flex items-center justify-center gap-3 mb-2 py-1 border-b border-charcoal-100">
        {facesLegend.map(f => (
          <div key={f.id} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-charcoal-300 rounded-sm bg-white flex items-center justify-center text-[6px] font-bold text-charcoal-500">
              {f.id}
            </div>
            <span className="text-[8px] font-bold text-charcoal-500 uppercase tracking-tighter">{f.name}</span>
          </div>
        ))}
      </div>

      {/* Info Header */}
      <div className="mb-2 p-1.5 bg-primary-50/50 rounded-xl border border-primary-100/50 flex items-center gap-2">
        <Info size={12} className="text-primary-500 shrink-0" />
        <p className="text-[8px] text-primary-700 font-medium leading-tight">
          Clique nas faces dos dentes para selecionar. {selectedTeeth.length > 0 && <strong>{selectedTeeth.length} faces ativas.</strong>}
        </p>
      </div>

      {/* Header / Tabs */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex bg-charcoal-100 p-0.5 rounded-lg border border-charcoal-200 shadow-inner">
          {(['permanente', 'decidua', 'misto'] as DentitionType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setDenticao(type);
                onSelectionChange({ denticao: type, dentes_selecionados: selectedTeeth });
              }}
              className={cn(
                "px-2 py-1 rounded-md text-[9px] font-bold transition-all capitalize whitespace-nowrap",
                denticao === type 
                  ? "bg-white text-primary-600 shadow-sm ring-1 ring-charcoal-200" 
                  : "text-charcoal-500 hover:bg-charcoal-200/50"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        
        <button 
          onClick={clearSelection}
          className="px-2 py-1 bg-red-50 text-red-500 rounded-md text-[8px] font-bold hover:bg-red-100 transition-colors uppercase tracking-widest"
        >
          Limpar
        </button>
      </div>

      {/* Odontogram Grid - Vertical Stacked Layout */}
      <div className="flex flex-col gap-1.5 items-center">
        {/* Patient's Right Side (Viewer's Left) */}
        <div className="flex flex-col gap-1.5 items-center pb-1.5 border-b border-charcoal-100 w-full">
          {renderQuadrant(denticao === 'decidua' ? dUR : pUR, "Sup. Dir.")}
          {denticao === 'misto' && (
            <div className="opacity-80 scale-[0.85] -my-1">
              {renderQuadrant(dUR, "Decíduo", true)}
            </div>
          )}
          {renderQuadrant(denticao === 'decidua' ? dLR : pLR, "Inf. Dir.")}
          {denticao === 'misto' && (
            <div className="opacity-80 scale-[0.85] -my-1">
              {renderQuadrant(dLR, "Decíduo", true)}
            </div>
          )}
        </div>

        {/* Patient's Left Side (Viewer's Right) */}
        <div className="flex flex-col gap-1.5 items-center w-full">
          {renderQuadrant(denticao === 'decidua' ? dUL : pUL, "Sup. Esq.")}
          {denticao === 'misto' && (
            <div className="opacity-80 scale-[0.85] -my-1">
              {renderQuadrant(dUL, "Decíduo", true)}
            </div>
          )}
          {renderQuadrant(denticao === 'decidua' ? dLL : pLL, "Inf. Esq.")}
          {denticao === 'misto' && (
            <div className="opacity-80 scale-[0.85] -my-1">
              {renderQuadrant(dLL, "Decíduo", true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
