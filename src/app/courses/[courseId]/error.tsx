'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Course error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              Course Error
            </h2>
            <p className="text-warm-gray mb-6">
              There was a problem loading this course. It may not exist or you may not have access.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset} className="bg-charcoal hover:bg-charcoal-light text-cream">
                Try Again
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
