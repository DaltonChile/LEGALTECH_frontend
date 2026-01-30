import { useState, useCallback, useRef } from 'react';

interface StepConfig {
    key: string;
    label: string;
}

interface UploadStepProps {
    steps: StepConfig[];
    onContinue: (file: File) => void;
    onBack: () => void;
}

export function UploadStep({ steps, onContinue, onBack }: UploadStepProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): boolean => {
        setError(null);

        // Check type
        if (file.type !== 'application/pdf') {
            setError('Solo se permiten archivos PDF');
            return false;
        }

        // Check size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('El archivo no puede exceder 10MB');
            return false;
        }

        return true;
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
        }
    }, []);

    const handleContinue = () => {
        if (file) {
            onContinue(file);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const currentStepIndex = steps.findIndex(s => s.key === 'upload');

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-serif font-bold text-navy-900">Firma tu propio documento</h1>
                    <p className="text-slate-600 mt-1 font-sans">Sube un PDF para firmarlo electrónicamente</p>

                    {/* Progress bar */}
                    <div className="mt-4 flex items-center gap-2">
                        {steps.map((step, index) => (
                            <div key={step.key} className="flex items-center">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStepIndex
                                            ? 'bg-legal-emerald-500 text-white'
                                            : index === currentStepIndex
                                                ? 'bg-navy-900 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}
                                >
                                    {index + 1}
                                </div>
                                <span className={`ml-2 text-sm ${index === currentStepIndex ? 'text-navy-900 font-medium' : 'text-slate-500'
                                    }`}>
                                    {step.label}
                                </span>
                                {index < steps.length - 1 && (
                                    <div className="w-8 h-0.5 mx-2 bg-slate-200" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-2xl mx-auto">
                    {/* Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${isDragging
                                ? 'border-legal-emerald-500 bg-legal-emerald-50'
                                : file
                                    ? 'border-legal-emerald-500 bg-legal-emerald-50'
                                    : 'border-slate-300 bg-white hover:border-slate-400'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {file ? (
                            <div>
                                <div className="w-16 h-16 mx-auto mb-4 bg-legal-emerald-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-legal-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-navy-900">{file.name}</p>
                                <p className="text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                    className="mt-4 text-sm text-slate-600 hover:text-slate-800 underline"
                                >
                                    Cambiar archivo
                                </button>
                            </div>
                        ) : (
                            <div>
                                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-navy-900">Arrastra tu PDF aquí</p>
                                <p className="text-slate-500 mt-1">o haz clic para seleccionar</p>
                                <p className="text-sm text-slate-400 mt-4">Máximo 10MB</p>
                            </div>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex justify-between">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium"
                    >
                        ← Volver al catálogo
                    </button>
                    <button
                        onClick={handleContinue}
                        disabled={!file}
                        className={`px-8 py-3 rounded-lg font-medium transition-colors ${file
                                ? 'bg-navy-900 text-white hover:bg-navy-800'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Continuar →
                    </button>
                </div>
            </div>
        </div>
    );
}
