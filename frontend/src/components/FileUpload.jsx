import React, { useRef } from 'react';
import { File, CheckCircle } from 'lucide-react';

export function FileUpload({ title, description, icon: Icon, onFilesSelected, files = [] }) {
  const inputRef = useRef(null);

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-8 transition-colors hover:border-blue-400 hover:bg-slate-50"
      >
        <input
          type="file"
          multiple
          className="hidden"
          ref={inputRef}
          onChange={(e) => onFilesSelected(Array.from(e.target.files))}
        />
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <File className="text-slate-500" size={14} />
                <span className="max-w-[160px] truncate text-xs text-slate-700">{file.name}</span>
              </div>
              <CheckCircle className="flex-shrink-0 text-emerald-500" size={14} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}