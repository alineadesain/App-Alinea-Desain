import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Link, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { compressAndConvertImageFile, isValidImageFile } from '../utils/imageUploadHelper';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  maxWidth?: number;
  maxHeight?: number;
  presets?: { label: string; url: string }[];
  placeholderText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Foto / Gambar',
  description,
  aspectRatio = 'square',
  maxWidth = 1000,
  maxHeight = 1000,
  presets = [],
  placeholderText = 'Pilih file PNG, JPG, atau WEBP'
}) => {
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      setErrorMessage('Format file tidak didukung! Harap pilih file dengan ekstensi PNG, JPG, atau WEBP.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const compressedDataUrl = await compressAndConvertImageFile(file, maxWidth, maxHeight);
      onChange(compressedDataUrl);
      setUrlInput(compressedDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal memproses file gambar.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setErrorMessage(null);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setErrorMessage(null);
  };

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'banner'
      ? 'aspect-[21/9]'
      : 'min-h-28';

  return (
    <div className="space-y-2">
      {/* Label & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
            <span>{label}</span>
          </label>
          {description && <p className="text-[10px] text-slate-400">{description}</p>}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsUrlMode(false)}
            className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
              !isUrlMode ? 'bg-teal-100 text-teal-800' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setIsUrlMode(true)}
            className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
              isUrlMode ? 'bg-teal-100 text-teal-800' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Input URL
          </button>
        </div>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] flex items-center gap-1.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preview & Upload Area */}
      {!isUrlMode ? (
        <div className="space-y-2">
          {value ? (
            <div className="relative group bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex items-center gap-3">
              <img
                src={value}
                alt="Preview"
                className={`w-16 h-16 ${aspectClass} rounded-xl object-cover border border-slate-200 bg-white shrink-0`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Gambar';
                }}
              />

              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gambar Siap Digunakan</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Format didukung: PNG, JPG, WEBP
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/70 p-4 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                isProcessing ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-700" />
                ) : (
                  <Upload className="w-4 h-4 text-teal-700" />
                )}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-800">
                  {isProcessing ? 'Mengompresi Gambar...' : 'Klik untuk Upload File Foto'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {placeholderText}
                </p>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-teal-100/80 text-teal-800">
                  PNG
                </span>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-teal-100/80 text-teal-800">
                  JPG
                </span>
                <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded bg-teal-100/80 text-teal-800">
                  WEBP
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* URL Input Mode */
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://... (URL gambar PNG / JPG / WEBP)"
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
            >
              Terapkan
            </button>
          </div>

          {value && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={value}
                alt="Preview"
                className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                }}
              />
              <span className="text-[10px] text-slate-500 truncate flex-1 font-mono">
                {value}
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-rose-500 hover:text-rose-700 p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preset Chips (if provided) */}
      {presets.length > 0 && (
        <div className="pt-1">
          <span className="text-[10px] text-slate-400 block mb-1">Pilihan Preset Cepat:</span>
          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  onChange(p.url);
                  setUrlInput(p.url);
                  setErrorMessage(null);
                }}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                  value === p.url
                    ? 'bg-teal-700 text-white border-teal-700 font-bold'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
