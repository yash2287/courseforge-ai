import { Loader2 } from 'lucide-react';

export default function CourseLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <p className="text-warm-gray">Loading course...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
