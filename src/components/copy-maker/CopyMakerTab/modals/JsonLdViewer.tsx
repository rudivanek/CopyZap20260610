import React from 'react';
import { JsonLdModal } from '../../../JsonLdModal';

interface JsonLdViewerProps {
  isOpen: boolean;
  onClose: () => void;
  jsonLd: string;
}

const JsonLdViewer: React.FC<JsonLdViewerProps> = ({
  isOpen,
  onClose,
  jsonLd
}) => {
  return (
    <JsonLdModal
      isOpen={isOpen}
      onClose={onClose}
      jsonLd={jsonLd}
    />
  );
};

export default JsonLdViewer;