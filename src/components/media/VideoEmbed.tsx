'use client';

interface VideoEmbedProps {
  url: string;
  caption?: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  return null;
}

export function VideoEmbed({ url, caption }: VideoEmbedProps) {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4 text-center">
        <p className="text-sm text-warm-gray">Unsupported video URL</p>
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={caption || 'Embedded video'}
        />
      </div>
      {caption && (
        <p className="text-xs text-warm-gray mt-2 text-center italic">{caption}</p>
      )}
    </div>
  );
}
