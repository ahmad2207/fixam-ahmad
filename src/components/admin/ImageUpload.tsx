'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, PlayCircle, AlertTriangle } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { isVideoUrl } from '@/lib/media';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  allowVideo?: boolean;
}

// Images always sort ahead of videos so images[0] — used as the product's
// main thumbnail everywhere else in the store — is never a video.
function sortMedia(urls: string[]): string[] {
  const images = urls.filter((u) => !isVideoUrl(u));
  const videos = urls.filter(isVideoUrl);
  return [...images, ...videos];
}

export function ImageUpload({ images, onImagesChange, maxImages = 10, allowVideo = true }: ImageUploadProps) {
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
    if (urls.length > 0) onImagesChange(sortMedia([...images, ...urls]));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const hasOnlyVideos = images.length > 0 && images.every(isVideoUrl);

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-400'
        } ${isUploading || images.length >= maxImages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowVideo ? 'image/*,video/mp4' : 'image/*'}
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
            <p className="text-sm text-gray-400">
              {allowVideo ? 'JPG, PNG, WEBP, GIF, MP4' : 'JPG, PNG, WEBP, GIF'} up to 20MB ({images.length}/{maxImages})
            </p>
          </div>
        )}
      </div>

      {hasOnlyVideos && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>Add at least one image — a video can&apos;t be used as the product&apos;s main thumbnail.</span>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {images.map((url, i) => {
            const video = isVideoUrl(url);
            return (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                {video ? (
                  <video src={url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="w-full h-full object-cover" />
                )}
                {video && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                    <PlayCircle className="h-7 w-7 text-white drop-shadow" />
                  </div>
                )}
                {i === 0 && !video && (
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
            );
          })}
        </div>
      )}
    </div>
  );
}
