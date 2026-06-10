import React from 'react';
import SavePrefillModal from '../../../SavePrefillModal';
import { User } from '../../../../types';

interface PrefillSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string, category: string, isPublic: boolean) => Promise<void>;
  mode: 'add' | 'edit' | 'clone';
  initialLabel?: string;
  currentUser?: User;
}

const PrefillSaveDialog: React.FC<PrefillSaveDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  initialLabel,
  currentUser
}) => {
  return (
    <SavePrefillModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      mode={mode}
      initialLabel={initialLabel || ''}
      currentUser={currentUser}
    />
  );
};

export default PrefillSaveDialog;