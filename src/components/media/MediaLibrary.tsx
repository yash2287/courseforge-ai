'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MediaUploader } from './MediaUploader';
import { FileImage, FileVideo, FileText, FileAudio, Trash2, Image, Loader2 } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface MediaLibraryProps {
  userId: string;
  orgId?: Id<'organizations'>;
  courseId?: Id<'courses'>;
  onSelect?: (media: { id: Id<'mediaFiles'>; url: string; type: string; filename: string }) => void;
  trigger?: React.ReactNode;
}

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

export function MediaLibrary({ userId, orgId, courseId, onSelect, trigger }: MediaLibraryProps) {
  const [open, setOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const files = useQuery(
    api.mediaFiles.listByUser,
    { userId }
  );
  const removeFile = useMutation(api.mediaFiles.remove);

  const filtered = files?.filter(
    (f) => filterType === 'all' || f.type === filterType
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Image className="w-3.5 h-3.5" />
            Media Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        {/* Upload */}
        <MediaUploader
          uploadedBy={userId}
          orgId={orgId}
          courseId={courseId}
          onUpload={() => {}}
        />

        {/* Type Filter */}
        <div className="flex gap-1.5 mt-4">
          {['all', 'image', 'video', 'document', 'audio'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterType === t
                  ? 'bg-gold/15 text-gold'
                  : 'text-warm-gray hover:bg-[var(--secondary)]'
              }`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>

        {/* File Grid */}
        <div className="flex-1 overflow-y-auto mt-4">
          {!filtered ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-warm-gray text-sm">
              No files uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((file) => {
                const Icon = TYPE_ICONS[file.type as keyof typeof TYPE_ICONS] || FileText;
                return (
                  <div
                    key={file._id}
                    className="group relative rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden cursor-pointer hover:border-gold/50 transition-colors"
                    onClick={() => {
                      if (onSelect && file.url) {
                        onSelect({
                          id: file._id,
                          url: file.url,
                          type: file.type,
                          filename: file.filename,
                        });
                        setOpen(false);
                      }
                    }}
                  >
                    {/* Preview */}
                    <div className="h-24 bg-[var(--secondary)] flex items-center justify-center">
                      {file.type === 'image' && file.url ? (
                        <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-8 h-8 text-warm-gray-light" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate">{file.filename}</p>
                      <p className="text-[10px] text-warm-gray">{formatSize(file.size)}</p>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this file?')) {
                          removeFile({ mediaId: file._id });
                        }
                      }}
                      className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-[var(--card)]/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-warm-gray hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
