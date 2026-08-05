import React, { useRef } from 'react';
import { File, CheckCircle } from 'lucide-react';

export function FileUpload({ title, description, icon: Icon, onFilesSelected, files = [], maxFiles }) {
  const inputRef = useRef(null);

  const handleFileSelect = (selectedFiles) => {
    if (maxFiles && selectedFiles.length > maxFiles) {
      alert(`Please select up to ${maxFiles} file${maxFiles > 1 ? 's' : ''} only.`);
      return;
    }
    onFilesSelected(selectedFiles);
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, index) => index !== indexToRemove);
    onFilesSelected(updatedFiles);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 sm:px-8 sm:py-8 transition-all duration-200 hover:border-blue-400 hover:bg-slate-50 active:scale-[0.98] touch-manipulation"
      >
        <input
          type="file"
          multiple={!maxFiles || maxFiles > 1}
          className="hidden"
          ref={inputRef}
          onChange={(e) => handleFileSelect(Array.from(e.target.files))}
          accept=".pdf,.doc,.docx,.txt"
        />
        
        {/* Icon placeholder if provided */}
        {Icon && (
          <div className="rounded-full bg-blue-50 p-3">
            <Icon className="text-blue-600" size={24} />
          </div>
        )}
        
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900 sm:text-base">{title}</p>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm px-2">{description}</p>
          
          {/* Mobile-friendly call to action */}
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white sm:text-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="sm:hidden">Tap to upload</span>
            <span className="hidden sm:inline">Click to upload</span>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
            {maxFiles && ` (max ${maxFiles})`}
          </p>
          
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, i) => (
              <div key={i} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:bg-slate-50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <File className="text-slate-500 shrink-0" size={16} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-slate-700 sm:text-sm">{file.name}</span>
                    <span className="text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <CheckCircle className="text-emerald-500" size={16} />
                  {!maxFiles || maxFiles > 1 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700"
                      aria-label="Remove file"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}