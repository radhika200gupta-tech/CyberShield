import React, { useRef } from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import Button from '../../common/Button';

export default function ImageDropzone({ onFileSelected, isAnalyzing }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/'))) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isAnalyzing) return;
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/'))) {
      onFileSelected(file);
    }
  };

  return (
    <div 
      className="p-8 sm:p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/60 rounded-xl bg-surface/30 hover:bg-surface/50 hover:border-accent/40 transition-colors cursor-pointer group min-h-[400px] w-full"
      onClick={() => !isAnalyzing && fileInputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        disabled={isAnalyzing}
      />
      <div className="w-20 h-20 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
        <FiUploadCloud size={32} className="text-accent" />
      </div>
      <h3 className="text-xl font-display font-semibold text-text-primary mb-2 tracking-tight">DROP SCREENSHOT TO BEGIN ANALYSIS</h3>
      <p className="text-sm text-text-secondary mb-1">Supported: PNG, JPG, JPEG, WEBP</p>
      
      <div className="mt-8 mb-6">
        <Button variant="primary" disabled={isAnalyzing} className="px-6">CHOOSE IMAGE</Button>
      </div>

      <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono">
        Images are processed locally in this frontend demonstration.
      </p>
    </div>
  );
}
