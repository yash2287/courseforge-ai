'use client';

import { use, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Award,
  Download,
  ArrowLeft,
  Share2,
  Loader2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface CourseParams {
  courseId: string;
}

export default function CertificatePage({
  params,
}: {
  params: Promise<CourseParams>;
}) {
  const { courseId } = use(params);
  const { user } = useUser();

  const course = useQuery(api.courses.getById, {
    courseId: courseId as any,
  });
  const progress = useQuery(
    api.progress.getProgress,
    user ? { userId: user.id, courseId: courseId as any } : 'skip'
  );
  const bestFinalExamAttempt = useQuery(
    api.progress.getBestFinalExamScore,
    user ? { userId: user.id, courseId: courseId as any } : 'skip'
  );
  const certificates = useQuery(
    api.certificates.getByUser,
    user ? { userId: user.id } : 'skip'
  );
  const issueCertificate = useMutation(api.certificates.issue);

  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);

  const existingCertificate = certificates?.find(
    (c: any) => c.courseId === courseId
  );

  useEffect(() => {
    const issue = async () => {
      if (
        !user ||
        !course ||
        !progress ||
        issued ||
        issuing ||
        existingCertificate
      )
        return;

      if (progress.overallProgress < 100) return;
      if (!bestFinalExamAttempt?.passed) return;

      try {
        setIssuing(true);
        await issueCertificate({
          userId: user.id,
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
          courseId: courseId as any,
          courseTitle: course.title,
          companyName: course.companyName || 'CourseForge AI',
          finalScore: bestFinalExamAttempt.score,
        });
        setIssued(true);
      } catch (err) {
        console.error('Failed to issue certificate:', err);
      } finally {
        setIssuing(false);
      }
    };

    issue();
  }, [
    user,
    course,
    progress,
    courseId,
    issued,
    issuing,
    existingCertificate,
    issueCertificate,
    bestFinalExamAttempt,
  ]);

  if (
    !user ||
    course === undefined ||
    progress === undefined ||
    certificates === undefined ||
    bestFinalExamAttempt === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
          <p className="text-warm-gray text-sm">Loading your certificate...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
          <p className="text-warm-gray">Course not found</p>
        </div>
      </div>
    );
  }

  const lessonsComplete = progress?.overallProgress === 100;
  const examPassed = bestFinalExamAttempt?.passed === true;
  const isComplete = lessonsComplete && examPassed;

  if (!isComplete) {
    return (
      <div className="min-h-screen bg-cream p-6">
        <div className="max-w-2xl mx-auto">
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" className="mb-8 text-charcoal/70 hover:text-charcoal">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
          </Link>

          <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-cream-dark mb-6">
              <Award className="w-8 h-8 text-gold" />
            </div>
            {lessonsComplete && !examPassed ? (
              <>
                <h1 className="text-3xl font-light text-charcoal mb-3">
                  Final Exam <span className="font-serif italic">Required</span>
                </h1>
                <p className="text-warm-gray mb-2">
                  You&apos;ve completed all lessons. Pass the final exam to earn your certificate.
                </p>
                <p className="text-warm-gray-light text-sm mb-8">
                  A passing score of 70% is required.
                </p>
                <Link href={`/courses/${courseId}/learn`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg px-6">
                    Take Final Exam
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-light text-charcoal mb-3">
                  Course Completion <span className="font-serif italic">Required</span>
                </h1>
                <p className="text-warm-gray mb-2">
                  Complete all lessons and pass the final exam to earn your certificate.
                </p>
                <p className="text-warm-gray-light text-sm mb-8">
                  Progress: {progress?.overallProgress || 0}%
                </p>
                <Link href={`/courses/${courseId}/learn`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg px-6">
                    Continue Learning
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const certificate = existingCertificate;

  const completionDate = new Date(
    certificate?.completionDate || Date.now()
  ).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (certificate?.certificateId) {
      window.open(`/api/export/certificate-pdf?id=${certificate.certificateId}`, '_blank');
    } else {
      window.print();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Certificate of Completion',
        text: `I just completed the ${course.title} course!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const scoreDisplay = certificate?.finalScore ?? bestFinalExamAttempt?.score ?? 100;

  return (
    <div className="min-h-screen bg-cream p-6 print:p-0 print:bg-[var(--card)] print:min-h-0 animate-fade-up">
      {/* Header - hidden on print */}
      <div className="max-w-3xl mx-auto mb-6 print:hidden">
        <Link href={`/courses/${courseId}`}>
          <Button variant="ghost" className="mb-4 text-charcoal/70 hover:text-charcoal">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Achievement Unlocked</p>
        </div>
        <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight">
          Congratulations, <span className="font-serif italic">{user?.firstName}</span>
        </h1>
        <p className="text-warm-gray mt-2">
          You&apos;ve successfully completed {course.title}. Here&apos;s your certificate.
        </p>
      </div>

      {/* Certificate - fits single print page */}
      <div id="certificate" className="max-w-3xl mx-auto mb-6 print:max-w-none print:m-0">
        <div className="certificate-card bg-[var(--card)] rounded-2xl shadow-2xl shadow-charcoal/5 relative overflow-hidden print:shadow-none print:rounded-none">
          {/* Decorative corner accents */}
          <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-gold/30 print:top-8 print:left-8 print:w-20 print:h-20" />
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-gold/30 print:top-8 print:right-8 print:w-20 print:h-20" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-gold/30 print:bottom-8 print:left-8 print:w-20 print:h-20" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-gold/30 print:bottom-8 print:right-8 print:w-20 print:h-20" />

          {/* Inner border */}
          <div className="absolute inset-8 border border-gold/10 pointer-events-none print:inset-12" />

          {/* Content */}
          <div className="relative flex flex-col items-center justify-center text-center px-8 py-10 print:px-16 print:py-0 print:h-[100vh] print:justify-center">
            {/* Logo */}
            <div className="mb-4 print:mb-5">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gold/10 print:h-14 print:w-14">
                <Sparkles className="w-6 h-6 text-gold print:w-7 print:h-7" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-warm-gray-light font-semibold mb-2 print:text-xs print:mb-3">
              Certificate of Completion
            </h2>
            <div className="gold-line w-14 mx-auto mb-5 print:w-16 print:mb-6" />

            {/* Presented to */}
            <p className="text-warm-gray text-xs mb-1 print:text-sm print:mb-2">
              This certificate is proudly presented to
            </p>

            {/* Student Name */}
            <p className="font-serif text-3xl text-charcoal italic mb-5 print:text-4xl print:mb-6">
              {user?.firstName} {user?.lastName}
            </p>

            {/* Completion text */}
            <p className="text-warm-gray text-xs mb-1 print:text-sm print:mb-2">
              for successfully completing
            </p>

            {/* Course Title */}
            <p className="text-lg font-semibold text-charcoal mb-5 max-w-md leading-snug print:text-xl print:mb-6 print:max-w-lg">
              {course.title}
            </p>

            {/* Details line */}
            <div className="text-xs text-warm-gray mb-4 print:text-sm print:mb-5">
              <span>Presented by </span>
              <span className="font-semibold text-charcoal">
                {course.companyName || 'CourseForge AI'}
              </span>
              <span className="mx-2 text-warm-gray-light">|</span>
              <span>{completionDate}</span>
            </div>

            {/* Score badge */}
            <div className="bg-cream rounded-lg px-6 py-3 mb-5 print:bg-gray-50 print:mb-6">
              <p className="text-[9px] uppercase tracking-[0.2em] text-warm-gray-light font-semibold mb-0.5 print:text-[10px]">
                Final Score
              </p>
              <p className="font-serif text-2xl text-charcoal italic print:text-3xl">
                {Math.round(scoreDisplay)}%
              </p>
            </div>

            {/* Certificate ID */}
            {certificate?.certificateId && (
              <p className="text-[10px] text-warm-gray-light font-mono mb-4 print:text-xs print:mb-5">
                Certificate ID: {certificate.certificateId}
              </p>
            )}

            {/* Signature */}
            <div>
              <div className="gold-line w-28 mx-auto mb-1.5 print:w-32 print:mb-2" />
              <p className="text-[9px] text-warm-gray-light font-semibold uppercase tracking-widest print:text-[10px]">
                Authenticated Certificate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - hidden on print */}
      <div className="max-w-3xl mx-auto print:hidden">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handlePrint}
            className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg px-6"
          >
            <Download className="w-4 h-4 mr-2" />
            Print Certificate
          </Button>

          <Button
            onClick={handleDownloadPDF}
            variant="outline"
            className="border-[var(--border)] text-charcoal hover:bg-cream rounded-lg px-6"
          >
            <Download className="w-4 h-4 mr-2" />
            Download as PDF
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            className="border-[var(--border)] text-charcoal hover:bg-cream rounded-lg px-6"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Info Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: CheckCircle, color: 'text-emerald-500', title: 'Course Complete', desc: "You've mastered all course material" },
            { icon: Award, color: 'text-gold', title: 'Certified', desc: 'Verified achievement credential' },
            { icon: Sparkles, color: 'text-charcoal', title: `${Math.round(scoreDisplay)}% Score`, desc: 'Excellent performance' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="card-premium rounded-xl bg-[var(--card)] p-6 text-center">
                <Icon className={`w-6 h-6 ${item.color} mx-auto mb-3`} />
                <h3 className="font-semibold text-charcoal text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-warm-gray">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        <div className="card-premium rounded-xl bg-gold/5 border-gold/20 p-6 mt-6">
          <h3 className="font-semibold text-charcoal mb-3 text-sm">Next Steps</h3>
          <ul className="space-y-2 text-sm text-warm-gray">
            {[
              'Download or print your certificate for your records',
              'Share your achievement on social media',
              'Add this certification to your resume or LinkedIn profile',
              'Explore other courses to expand your skills',
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-gold font-bold">&#8226;</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Print Styles - ensures single-page PDF */}
      <style jsx>{`
        @media print {
          /* Reset everything for clean single-page print */
          :global(body) {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page {
            size: letter;
            margin: 0;
          }

          /* Hide the parent layout navbar and paddings */
          :global(nav),
          :global(header) {
            display: none !important;
          }

          :global(main) {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          :global(.grain::before) {
            display: none !important;
          }

          /* Certificate fills exactly one page */
          .certificate-card {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
