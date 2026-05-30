'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useImageUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    const urls: string[] = [];
    for (const file of filesToUpload) {
      const url = await upload(file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) onImagesChange([...images, ...urls]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="font-medium text-gray-700">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-400">PNG, JPG, WEBP up to 5MB ({images.length}/{maxImages})</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-medium">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
