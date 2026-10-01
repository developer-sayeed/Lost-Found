import React from 'react';
import { Certificate } from '../../types';
import { ElementorCertificateBuilder } from './builder/ElementorCertificateBuilder';

export type EditableElementId =
  | 'hotel_header'
  | 'title_block'
  | 'recipient_block'
  | 'citation_block'
  | 'badge_block'
  | 'signatories_block';

interface VisualLiveEditorStageProps {
  cert: Partial<Certificate>;
  onChange: (updates: Partial<Certificate>) => void;
  onOpenSignaturePad?: (signatoryIndex: 1 | 2 | 3) => void;
  onOpenDirectPrint?: () => void;
  canPrint?: boolean;
  canSave?: boolean;
}

export const VisualLiveEditorStage: React.FC<VisualLiveEditorStageProps> = ({
  cert,
  onChange,
  onOpenSignaturePad,
  onOpenDirectPrint,
  canPrint = true,
  canSave = true
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950">
      <ElementorCertificateBuilder
        initialCertificate={cert}
        onSave={(updated) => {
          onChange(updated);
        }}
      />
    </div>
  );
};
