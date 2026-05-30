'use client';

import { useState } from 'react';

export function useImageUpload(subfolder = 'products') {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subfolder', subfolder);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Upload failed');
      }
      const { url } = await res.json();
      return url as string;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}
