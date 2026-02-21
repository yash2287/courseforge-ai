'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrg } from '@/contexts/OrgContext';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MediaUploader } from '@/components/media/MediaUploader';
import {
  ArrowLeft,
  FileImage,
  FileVideo,
  FileText,
  FileAudio,
  Trash2,
  Loader2,
  Image,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

const TYPE_ICONS = {
  image: FileImage,
  video: FileVideo,
  document: FileText,
  audio: FileAudio,
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { org, isManager } = useOrg();
  const { user } = useUser();
  const [filterType, setFilterType] = useState('all');

  const files = useQuery(
    api.mediaFiles.listByOrg,
    org ? { orgId: org._id, ...(filterType !== 'all' ? { type: filterType as any } : {}) } : 'skip'
  );
  const removeFile = useMutation(api.mediaFiles.remove);

  if (!org || !user) return null;

  const totalSize = files?.reduce((sum, f) => sum + f.size, 0) || 0;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <Link href={`/org/${org.slug}/dashboard`} className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
            Media Library
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-[var(--foreground)] tracking-tight">
            Organization <span className="font-serif italic">Files</span>
          </h1>
          <p className="text-warm-gray text-sm mt-1">
            {files?.length || 0} files &middot; {formatSize(totalSize)} total
          </p>
        </div>
      </div>

      {/* Upload */}
      <MediaUploader
        uploadedBy={user.id}
        orgId={org._id}
        onUpload={() => {}}
      />

      {/* Type Filter */}
      <div className="flex gap-1.5">
        {['all', 'image', 'video', 'document', 'audio'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filterType === t
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--secondary)] text-warm-gray hover:text-[var(--foreground)]'
            }`}
          >
            {t === 'all' ? 'All Files' : `${t}s`}
          </button>
        ))}
      </div>

      {/* File Grid */}
      {!files ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <Image className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
          <p className="text-warm-gray text-sm">No files uploaded yet.</p>
          <p className="text-warm-gray-light text-xs mt-1">Upload images, videos, or documents to use in your courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file) => {
            const Icon = TYPE_ICONS[file.type as keyof typeof TYPE_ICONS] || FileText;
            return (
              <div
                key={file._id}
                className="group card-premium rounded-xl bg-[var(--card)] overflow-hidden"
              >
                {/* Preview */}
                <div className="h-32 bg-[var(--secondary)] flex items-center justify-center relative">
                  {file.type === 'image' && file.url ? (
                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-10 h-10 text-warm-gray-light" />
                  )}

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {file.url && (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg bg-[var(--card)]/90 flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--card)]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isManager && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this file?')) removeFile({ mediaId: file._id });
                        }}
                        className="h-8 w-8 rounded-lg bg-[var(--card)]/90 flex items-center justify-center text-red-500 hover:bg-[var(--card)]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-medium text-[var(--foreground)] truncate">{file.filename}</p>
                  <p className="text-[10px] text-warm-gray mt-0.5">{formatSize(file.size)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
