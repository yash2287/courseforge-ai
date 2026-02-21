'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  BookOpen,
  Clock,
  ArrowLeft,
  Award,
  Brain,
  Loader2,
  Menu,
  X,
  Trophy,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { CourseChat } from '@/components/chat/CourseChat';

function markdownToHtml(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o|l|p])/gm, '<p>')
    .replace(/$(?!<\/[h|u|o|l|p])/gm, '</p>')
    .replace(/<p><\/p>/g, '');
}

interface CourseParams {
  courseId: string;
}

export default function LearnPage({
  params,
}: {
  params: Promise<CourseParams>;
}) {
  const { courseId } = use(params);
  const { user } = useUser();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const course = useQuery(api.courses.getById, { courseId: courseId as any });
  const progress = useQuery(
    api.progress.getProgress,
    user ? { userId: user.id, courseId: courseId as any } : 'skip'
  );
  const finalExam = useQuery(
    api.progress.getFinalExamForCourse,
    { courseId: courseId as any }
  );
  const bestFinalExamAttempt = useQuery(
    api.progress.getBestFinalExamScore,
    user ? { userId: user.id, courseId: courseId as any } : 'skip'
  );
  const getOrCreateProgress = useMutation(api.progress.getOrCreate);
  const completeLessonMutation = useMutation(api.progress.completeLesson);
  const submitQuizAttemptMutation = useMutation(api.progress.submitQuizAttempt);

  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quizOpen, setQuizOpen] = useState(false);
  const [showModuleQuiz, setShowModuleQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [courseComplete, setCourseComplete] = useState(false);

  // Final exam state
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [finalExamAnswers, setFinalExamAnswers] = useState<number[]>([]);
  const [finalExamScore, setFinalExamScore] = useState<number | null>(null);
  const [isFinalExamMode, setIsFinalExamMode] = useState(false);

  useEffect(() => {
    if (user && courseId && !isPreview) {
      getOrCreateProgress({ userId: user.id, courseId: courseId as any });
    }
  }, [user, courseId, getOrCreateProgress, isPreview]);

  // Auto-show final exam prompt or course complete if user already qualifies
  useEffect(() => {
    if (!course || !progress || !user) return;
    const totalLessonsCount = course.modules.reduce(
      (acc: number, m: any) => acc + (m.lessons?.length || 0), 0
    );
    const allLessonsDone = progress.completedLessons.length >= totalLessonsCount && totalLessonsCount > 0;

    if (allLessonsDone && bestFinalExamAttempt?.passed) {
      setCourseComplete(true);
    } else if (allLessonsDone && finalExam && !bestFinalExamAttempt?.passed) {
      setShowFinalExam(true);
    }
  }, [course, progress, user, bestFinalExamAttempt, finalExam]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs or when quiz dialog is open
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || quizOpen) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevLesson();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNextLesson();
    }
  }, [quizOpen, currentModuleIdx, currentLessonIdx]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!course || progress === undefined || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[currentModuleIdx];
  const currentLesson = currentModule?.lessons?.[currentLessonIdx];

  if (!currentModule || !currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <p className="text-warm-gray mb-4">No lesson found</p>
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" className="rounded-lg border-[var(--border)]">Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModuleQuiz = course.quizzes?.find(
    (q: any) => q.moduleId === currentModule._id && q.type === 'module'
  );

  const totalLessons = course.modules.reduce(
    (acc: number, m: any) => acc + (m.lessons?.length || 0),
    0
  );
  const completedLessons = progress?.completedLessons || [];
  const isLessonComplete = completedLessons.includes(currentLesson._id as any);
  const moduleProgress = currentModule.lessons.filter((lesson: any) =>
    completedLessons.includes(lesson._id as any)
  ).length;
  const moduleTotalLessons = currentModule.lessons.length;
  const moduleComplete = moduleProgress === moduleTotalLessons;
  const overallProgress =
    totalLessons > 0
      ? (completedLessons.length / totalLessons) * 100
      : 0;
  const allLessonsComplete = completedLessons.length >= totalLessons && totalLessons > 0;

  const handleCompleteLesson = async () => {
    await completeLessonMutation({
      userId: user.id,
      courseId: courseId as any,
      lessonId: currentLesson._id as any,
      totalLessons,
    });

    const willBeComplete = completedLessons.length + 1 >= totalLessons;
    const isLastModuleLastLesson =
      currentModuleIdx === course.modules.length - 1 &&
      moduleProgress + 1 === moduleTotalLessons;

    if (moduleProgress + 1 === moduleTotalLessons && currentModuleQuiz) {
      setShowModuleQuiz(true);
    } else if (willBeComplete && isLastModuleLastLesson && finalExam) {
      // All lessons done, no module quiz for this module — show final exam
      setShowFinalExam(true);
    }
  };

  const handleQuizAnswer = (questionIdx: number, answerIdx: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[questionIdx] = answerIdx;
    setQuizAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => {
    if (!currentModuleQuiz) return;

    const score = quizAnswers.reduce((acc, answer, idx) => {
      return (
        acc +
        (answer === currentModuleQuiz.questions[idx]?.correctAnswer ? 1 : 0)
      );
    }, 0);

    const percentage = (score / currentModuleQuiz.questions.length) * 100;
    setQuizScore(percentage);

    await submitQuizAttemptMutation({
      userId: user.id,
      quizId: currentModuleQuiz._id as any,
      courseId: courseId as any,
      score: percentage,
      passed: percentage >= (currentModuleQuiz.passingScore || 70),
      answers: quizAnswers,
    });

    // If passed last module quiz and all lessons complete → prompt final exam
    if (
      percentage >= (currentModuleQuiz.passingScore || 70) &&
      currentModuleIdx === course.modules.length - 1 &&
      completedLessons.length + 1 >= totalLessons &&
      finalExam
    ) {
      setShowFinalExam(true);
    }
  };

  // Final exam handlers
  const handleFinalExamAnswer = (questionIdx: number, answerIdx: number) => {
    const newAnswers = [...finalExamAnswers];
    newAnswers[questionIdx] = answerIdx;
    setFinalExamAnswers(newAnswers);
  };

  const handleSubmitFinalExam = async () => {
    if (!finalExam) return;

    const score = finalExamAnswers.reduce((acc, answer, idx) => {
      return (
        acc +
        (answer === finalExam.questions[idx]?.correctAnswer ? 1 : 0)
      );
    }, 0);

    const percentage = (score / finalExam.questions.length) * 100;
    setFinalExamScore(percentage);

    await submitQuizAttemptMutation({
      userId: user.id,
      quizId: finalExam._id as any,
      courseId: courseId as any,
      score: percentage,
      passed: percentage >= (finalExam.passingScore || 70),
      answers: finalExamAnswers,
    });

    if (percentage >= (finalExam.passingScore || 70)) {
      setCourseComplete(true);
    }
  };

  const openFinalExamDialog = () => {
    if (!finalExam) return;
    setFinalExamAnswers(new Array(finalExam.questions.length).fill(-1));
    setFinalExamScore(null);
    setIsFinalExamMode(true);
    setQuizOpen(true);
  };

  const openModuleQuizDialog = () => {
    if (!currentModuleQuiz) return;
    setQuizAnswers(new Array(currentModuleQuiz.questions.length).fill(-1));
    setQuizScore(null);
    setIsFinalExamMode(false);
    setQuizOpen(true);
  };

  const handleNextLesson = () => {
    setShowModuleQuiz(false);
    if (currentLessonIdx < moduleTotalLessons - 1) {
      setCurrentLessonIdx(currentLessonIdx + 1);
    } else if (currentModuleIdx < course.modules.length - 1) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentLessonIdx(0);
    }
  };

  const handlePrevLesson = () => {
    setShowModuleQuiz(false);
    if (currentLessonIdx > 0) {
      setCurrentLessonIdx(currentLessonIdx - 1);
    } else if (currentModuleIdx > 0) {
      setCurrentModuleIdx(currentModuleIdx - 1);
      setCurrentLessonIdx(
        course.modules[currentModuleIdx - 1].lessons.length - 1
      );
    }
  };

  const htmlContent = markdownToHtml(currentLesson.content || '');
  const lessonKeyTakeaways = (currentLesson as any).keyTakeaways || [];

  // Determine which quiz to show in the dialog
  const activeQuiz = isFinalExamMode ? finalExam : currentModuleQuiz;
  const activeAnswers = isFinalExamMode ? finalExamAnswers : quizAnswers;
  const activeScore = isFinalExamMode ? finalExamScore : quizScore;
  const handleActiveAnswer = isFinalExamMode ? handleFinalExamAnswer : handleQuizAnswer;
  const handleActiveSubmit = isFinalExamMode ? handleSubmitFinalExam : handleSubmitQuiz;

  const finalExamPassedScore = bestFinalExamAttempt?.passed ? bestFinalExamAttempt.score : (finalExamScore !== null && finalExamScore >= (finalExam?.passingScore || 70) ? finalExamScore : null);

  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-[var(--card)] border-r border-[var(--border)] overflow-y-auto transition-all duration-300 ease-in-out lg:w-72 flex-shrink-0`}
      >
        <div className="p-6">
          <h2 className="font-serif text-lg text-charcoal mb-1 leading-tight">
            {course.title}
          </h2>
          <div className="gold-line-left mt-3 mb-6 w-12" />

          {/* Module/Lesson Tree */}
          <div className="space-y-4">
            {course.modules.map((module: any, moduleIdx: number) => (
              <div key={module._id}>
                <button
                  onClick={() => {
                    setCurrentModuleIdx(moduleIdx);
                    setCurrentLessonIdx(0);
                    setShowModuleQuiz(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    currentModuleIdx === moduleIdx
                      ? 'bg-cream text-charcoal'
                      : 'text-warm-gray hover:bg-cream'
                  }`}
                >
                  <span className="font-serif text-gold/40 mr-2 text-xs">{String(moduleIdx + 1).padStart(2, '0')}</span>
                  {module.title}
                </button>

                {currentModuleIdx === moduleIdx && (
                  <div className="ml-4 mt-1.5 space-y-0.5">
                    {module.lessons.map((lesson: any, lessonIdx: number) => {
                      const isCompleted = completedLessons.includes(
                        lesson._id as any
                      );
                      const isActive = currentLessonIdx === lessonIdx;

                      return (
                        <button
                          key={lesson._id}
                          onClick={() => {
                            setCurrentLessonIdx(lessonIdx);
                            setShowModuleQuiz(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                            isActive
                              ? 'bg-gold/5 text-charcoal font-medium'
                              : 'text-warm-gray hover:bg-cream'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-warm-gray-light flex-shrink-0" />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progress */}
          <Separator className="my-6 bg-[var(--border)]" />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-warm-gray">Course Progress</span>
              <span className="font-semibold text-charcoal">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Banner */}
        {isPreview && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-center gap-2">
            <Eye className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Preview Mode — progress will not be tracked</span>
          </div>
        )}
        {/* Header */}
        <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-cream rounded-lg transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-charcoal/60" />
              ) : (
                <Menu className="w-5 h-5 text-charcoal/60" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-charcoal">
              {currentLesson.title}
            </h1>
          </div>
          <Link href={`/courses/${courseId}`}>
            <Button variant="ghost" size="sm" className="text-charcoal/70 hover:text-charcoal">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Course Complete Celebration */}
        {courseComplete && (
          <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20 m-6 rounded-xl p-6 text-center">
            <Award className="w-10 h-10 text-gold mx-auto mb-3" />
            <h2 className="text-2xl font-light text-charcoal mb-2">
              Course <span className="font-serif italic">Complete!</span>
            </h2>
            <p className="text-warm-gray mb-1">
              Congratulations! You&apos;ve successfully completed this course.
            </p>
            {finalExamPassedScore !== null && (
              <p className="text-sm font-semibold text-charcoal mb-4">
                Final Exam Score: {Math.round(finalExamPassedScore)}%
              </p>
            )}
            <Link href={`/courses/${courseId}/certificate`}>
              <Button className="bg-gold hover:bg-gold-dark text-charcoal font-semibold rounded-lg">
                <Award className="w-4 h-4 mr-2" />
                View Certificate
              </Button>
            </Link>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Lesson Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-charcoal text-cream border-0 text-xs font-medium">{currentModule.title}</Badge>
                <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {(currentLesson as any).estimatedDuration || 'N/A'}
                </Badge>
                {isLessonComplete && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>

            {/* Lesson Content */}
            <div className="card-premium rounded-xl bg-[var(--card)] p-8 mb-8">
              <div
                className="prose-course max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>

            {/* Key Takeaways */}
            {lessonKeyTakeaways.length > 0 && (
              <div className="card-premium rounded-xl bg-[var(--card)] p-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-gold" />
                  <h3 className="text-base font-semibold text-charcoal">Key Takeaways</h3>
                </div>
                <ul className="space-y-2">
                  {lessonKeyTakeaways.map((takeaway: string, idx: number) => (
                    <li key={idx} className="flex gap-2.5 text-sm">
                      <span className="text-gold font-bold mt-0.5">&#8226;</span>
                      <span className="text-warm-gray leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {!isPreview && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button
                onClick={handleCompleteLesson}
                disabled={isLessonComplete}
                className={`flex-1 rounded-lg font-medium ${
                  isLessonComplete
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : 'bg-charcoal hover:bg-charcoal-light text-cream'
                }`}
              >
                {isLessonComplete ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Lesson Complete
                  </>
                ) : (
                  'Mark as Complete'
                )}
              </Button>
            </div>
            )}

            {/* Module Quiz Prompt */}
            {showModuleQuiz && moduleComplete && currentModuleQuiz && (
              <div className="card-premium rounded-xl bg-gold/5 border-gold/20 p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal mb-1.5">
                      Module Complete!
                    </h3>
                    <p className="text-warm-gray text-sm mb-4">
                      You&apos;ve completed all lessons in {currentModule.title}.
                      Take the quiz to solidify your learning.
                    </p>
                    <Button
                      onClick={openModuleQuizDialog}
                      className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg"
                    >
                      Take Module Quiz
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Final Exam Prompt */}
            {showFinalExam && allLessonsComplete && finalExam && !bestFinalExamAttempt?.passed && !courseComplete && (
              <div className="card-premium rounded-xl bg-gradient-to-br from-gold/10 to-amber-50 border-gold/30 p-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-6 h-6 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-charcoal mb-2">
                      Ready for the Final Exam?
                    </h3>
                    <p className="text-warm-gray text-sm mb-1">
                      You&apos;ve completed all lessons! Pass the final exam to earn your certificate.
                    </p>
                    <p className="text-xs text-charcoal/60 mb-5">
                      {finalExam.questions.length} questions &bull; {finalExam.passingScore}% passing score
                    </p>
                    <Button
                      onClick={openFinalExamDialog}
                      className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg font-semibold"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Take Final Exam
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pb-8">
              <Button
                onClick={handlePrevLesson}
                disabled={currentModuleIdx === 0 && currentLessonIdx === 0}
                variant="outline"
                className="border-[var(--border)] text-charcoal hover:bg-cream rounded-lg gap-1"
                title="Previous lesson (←)"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
                <kbd className="hidden sm:inline-block ml-1 text-[10px] text-warm-gray bg-cream-dark px-1.5 py-0.5 rounded">←</kbd>
              </Button>

              <div className="text-xs text-warm-gray">
                Lesson {currentLessonIdx + 1} of {moduleTotalLessons}
              </div>

              <Button
                onClick={handleNextLesson}
                disabled={
                  currentModuleIdx === course.modules.length - 1 &&
                  currentLessonIdx === moduleTotalLessons - 1
                }
                className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg gap-1"
                title="Next lesson (→)"
              >
                Next
                <kbd className="hidden sm:inline-block mr-1 text-[10px] text-charcoal/40 bg-charcoal-light/50 px-1.5 py-0.5 rounded">→</kbd>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Dialog — handles both module quiz and final exam */}
      {activeQuiz && (
        <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl border-[var(--border)]">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-charcoal">
                {isFinalExamMode ? 'Final Exam' : `Module Quiz: ${currentModule.title}`}
              </DialogTitle>
            </DialogHeader>

            {activeScore !== null ? (
              <div className="space-y-5 py-4">
                <div className="text-center bg-cream rounded-xl p-6 border border-[var(--border)]">
                  <div className="font-serif text-5xl text-charcoal mb-2">
                    {Math.round(activeScore)}%
                  </div>
                  <p className="text-charcoal font-medium text-base">
                    {activeScore >= (activeQuiz.passingScore || 70)
                      ? 'Congratulations! You passed!'
                      : 'You need a higher score to pass.'}
                  </p>
                </div>

                {activeScore >= (activeQuiz.passingScore || 70) ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-emerald-900">
                          {isFinalExamMode ? 'Final Exam Passed!' : 'Module Passed!'}
                        </p>
                        <p className="text-sm text-emerald-700">
                          {isFinalExamMode
                            ? "You've earned your certificate! Close this dialog to continue."
                            : "You've earned credit for this module."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      if (isFinalExamMode && finalExam) {
                        setFinalExamAnswers(new Array(finalExam.questions.length).fill(-1));
                        setFinalExamScore(null);
                      } else if (currentModuleQuiz) {
                        setQuizAnswers(new Array(currentModuleQuiz.questions.length).fill(-1));
                        setQuizScore(null);
                      }
                    }}
                    className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg"
                  >
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={() => setQuizOpen(false)}
                  variant="outline"
                  className="w-full border-[var(--border)] text-charcoal rounded-lg"
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {activeQuiz.questions.map(
                  (question: any, idx: number) => (
                    <div key={idx} className="bg-cream rounded-xl p-5 border border-[var(--border)]">
                      <div className="mb-4">
                        <div className="text-xs text-charcoal/60 font-medium mb-1.5">
                          Question {idx + 1} of{' '}
                          {activeQuiz.questions.length}
                        </div>
                        <h3 className="text-base font-semibold text-charcoal">
                          {question.question}
                        </h3>
                      </div>

                      <div className="space-y-2">
                        {question.options.map(
                          (option: string, optionIdx: number) => (
                            <button
                              key={optionIdx}
                              onClick={() => handleActiveAnswer(idx, optionIdx)}
                              className={`w-full p-4 rounded-xl border-2 transition-all text-left text-sm ${
                                activeAnswers[idx] === optionIdx
                                  ? 'border-gold bg-gold/10 text-charcoal font-semibold'
                                  : 'border-[var(--border)] bg-[var(--card)] hover:border-gold-light text-charcoal'
                              }`}
                            >
                              {option}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}

                <Button
                  onClick={handleActiveSubmit}
                  disabled={activeAnswers.some((a) => a === -1)}
                  className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg h-11"
                >
                  Submit {isFinalExamMode ? 'Final Exam' : 'Quiz'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* AI Course Assistant */}
      {!isPreview && course && currentLesson && (
        <CourseChat
          courseId={courseId as any}
          courseTitle={course.title}
          lessonTitle={currentLesson.title}
          lessonContent={currentLesson.content}
        />
      )}
    </div>
  );
}
