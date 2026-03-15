/**
 * CANLK-96: PhotoUploader - Composant d'upload de photos
 * 
 * @version Sprint 5 | 2026-03-15
 * @agent front_nexus
 */

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { supabase } from '../../lib/supabase';

export interface PhotoFile {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface PhotoUploaderProps {
  tdlId: string | null;
  photos: PhotoFile[];
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
  required?: boolean;
  readOnly?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function PhotoUploader({ 
  tdlId, 
  photos, 
  onPhotosChange,
  maxPhotos = 10,
  maxSizeMB = 10,
  required = false,
  readOnly = false 
}: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.';
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Fichier trop volumineux. Maximum ${maxSizeMB}MB.`;
    }
    if (photos.length >= maxPhotos) {
      return `Nombre maximum de photos atteint (${maxPhotos}).`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<PhotoFile | null> => {
    if (!tdlId) return null;

    try {
      const fileName = `${tdlId}/${Date.now()}_${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('tdl-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tdl-photos')
        .getPublicUrl(fileName);

      return {
        id: data.id || fileName,
        name: file.name,
        size: file.size,
        url: publicUrl,
        uploadedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!tdlId || readOnly) return;

    setError(null);
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        const photo = await uploadFile(file);
        if (photo) {
          onPhotosChange([...photos, photo]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (readOnly) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('tdl-photos')
        .remove([photoId]);

      if (deleteError) throw deleteError;

      onPhotosChange(photos.filter(p => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  return (
    <Card className="photo-uploader">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>📷</span>
          <span>Photos des résultats</span>
          {required && <span className="text-red-500">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone de drop */}
        {!readOnly && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            
            {uploading ? (
              <p className="text-gray-500">Upload en cours...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Glissez-déposez vos photos ici
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline"
                >
                  ou parcourir...
                </button>
                <p className="text-xs text-gray-400 mt-2">
                  JPG, PNG, WebP - Max {maxSizeMB}MB par fichier
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Galerie de photos */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
                <p className="text-xs text-gray-500 truncate mt-1">
                  {photo.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Required warning */}
        {required && photos.length === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Les photos sont obligatoires pour ce niveau de complexité.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400">
          {photos.length} / {maxPhotos} photos uploadées
        </p>
      </CardContent>
    </Card>
  );
}

export default PhotoUploader;
