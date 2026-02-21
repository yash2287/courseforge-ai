'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, useCallback } from 'react';
import { Upload, Loader2, X, FileImage, FileVideo, FileText, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Id } from '../../../convex/_generated/dataModel';

interface MediaUploaderProps {
  uploadedBy: string;
  orgId?: Id<'organizations'>;
  courseId?: Id<'courses'>;
  onUpload?: (mediaId: Id<'mediaFiles'>) => void;
  accept?: string;
  compact?: boolean;
}

const MIME_TO_TYPE: Record<string, 'image' | 'video' | 'document' | 'audio'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'application/pdf': 'document',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
};

const TYPE_ICONS = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
  audio: FileAudio,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploader({ uploadedBy, orgId, courseId, onUpload, accept, compact }: MediaUploaderProps) {
  const generateUploadUrl = useMutation(api.mediaFiles.generateUploadUrl);
  const saveFile = useMutation(api.mediaFiles.saveFile);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    const mediaType = MIME_TO_TYPE[file.type];
    if (!mediaType) {
      alert(`Unsupported file type: ${file.type}`);
      return;
    }

    try {
      setUploading(true);
      setUploadedFile({ name: file.name, size: file.size, type: mediaType });

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!response.ok) throw new Error('Upload failed');
      const { storageId } = await response.json();

      // Save metadata
      const mediaId = await saveFile({
        storageId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        type: mediaType,
        uploadedBy,
        orgId,
        courseId,
      });

      onUpload?.(mediaId);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setUploadedFile(null);
    }
  }, [generateUploadUrl, saveFile, uploadedBy, orgId, courseId, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  }, [handleUpload]);

  if (compact) {
    return (
      <label className="cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept={accept || 'image/*,video/*,application/pdf,audio/*'}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-[var(--border)] text-[var(--foreground)]"
          disabled={uploading}
          asChild
        >
          <span>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Upload'}
          </span>
        </Button>
      </label>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
        dragOver
          ? 'border-gold bg-gold/5'
          : 'border-[var(--border)] hover:border-gold/50 hover:bg-[var(--secondary)]/50'
      }`}
    >
      {uploading && uploadedFile ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">{uploadedFile.name}</p>
            <p className="text-xs text-warm-gray">{formatFileSize(uploadedFile.size)} &middot; Uploading...</p>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer flex flex-col items-center gap-3">
          <input
            type="file"
            className="hidden"
            accept={accept || 'image/*,video/*,application/pdf,audio/*'}
            onChange={handleFileSelect}
          />
          <div className="h-12 w-12 rounded-xl bg-[var(--secondary)] flex items-center justify-center">
            <Upload className="w-5 h-5 text-warm-gray" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Drop files here or <span className="text-gold">browse</span>
            </p>
            <p className="text-xs text-warm-gray mt-1">
              Images, videos, PDFs, audio &middot; Max 50MB
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
