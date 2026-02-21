'use client';

import { use, useState, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Clock,
  Users,
  BarChart3,
  Play,
  CheckCircle,
  ArrowLeft,
  GraduationCap,
  Trophy,
  Loader2,
  FileText,
  Target,
  Copy,
  Eye,
  Star,
  MessageSquare,
  Download,
} from 'lucide-react';

interface CourseViewerPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseViewerPage({ params }: CourseViewerPageProps) {
  const { courseId } = use(params);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const duplicateCourse = useMutation(api.courses.duplicate);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    if (!user) return;
    setIsDuplicating(true);
    try {
      const newCourseId = await duplicateCourse({
        courseId: courseId as any,
        createdBy: user.id,
      });
      router.push(`/courses/${newCourseId}`);
    } catch (err) {
      alert('Failed to duplicate course');
    } finally {
      setIsDuplicating(false);
    }
  };

  const course = useQuery(api.courses.getById, {
    courseId: courseId as any,
  });

  const progress = useQuery(
    api.progress.getProgress,
    user?.id ? { userId: user.id, courseId: courseId as any } : 'skip'
  );

  const bestFinalExamAttempt = useQuery(
    api.progress.getBestFinalExamScore,
    user?.id ? { userId: user.id, courseId: courseId as any } : 'skip'
  );

  const courseReviews = useQuery(api.courseReviews.getByCourse, { courseId: courseId as any });
  const userReview = useQuery(
    api.courseReviews.getUserReview,
    user?.id ? { userId: user.id, courseId: courseId as any } : 'skip'
  );
  const submitReview = useMutation(api.courseReviews.submit);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  if (!isLoaded || course === undefined || (user?.id && progress === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
          <p className="text-warm-gray text-sm">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
          <p className="text-warm-gray mb-4">
            Course not found. Please check the course ID and try again.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-lg border-[var(--border)]">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalModules = course.modules?.length || 0;
  const totalLessons =
    course.modules?.reduce((sum: number, module: any) => sum + (module.lessons?.length || 0), 0) || 0;
  const completionPercentage = progress?.overallProgress || 0;
  const hasStarted = !!progress;
  const lessonsComplete = completionPercentage === 100;
  const examPassed = bestFinalExamAttempt?.passed === true;
  const isCompleted = lessonsComplete && examPassed;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'advanced':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const getQuizTypeBadge = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'module':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'final':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="min-h-screen bg-cream py-8 animate-fade-up">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        {/* Header Section */}
        <div className="space-y-5">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-3">Course Overview</p>
            <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight mb-3">
              {course.title}
            </h1>
            <p className="text-warm-gray leading-relaxed max-w-3xl">{course.description}</p>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {course.difficulty && (
              <Badge className={`${getDifficultyColor(course.difficulty)} border text-xs font-medium`}>
                {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
              </Badge>
            )}
            {course.industry && (
              <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs">{course.industry}</Badge>
            )}
            {course.estimatedDuration && (
              <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.estimatedDuration}
              </Badge>
            )}
            {course.status && (
              <Badge variant="secondary" className="bg-cream-dark text-charcoal border-0 text-xs">
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </Badge>
            )}
            {courseReviews && courseReviews.totalReviews > 0 && (
              <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-gold text-gold" />
                {courseReviews.avgRating} ({courseReviews.totalReviews})
              </Badge>
            )}
          </div>

          {/* Progress Bar and Action Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <div className="flex-1 space-y-2">
              {hasStarted && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-warm-gray">Progress</span>
                    <span className="font-semibold text-charcoal">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3">
              {/* Edit button */}
              {user && course.createdBy === user.id && (
                <Link href={`/courses/${courseId}/edit`}>
                  <Button variant="outline" className="gap-2 whitespace-nowrap rounded-lg border-[var(--border)] text-charcoal hover:border-gold-light">
                    <FileText className="w-4 h-4" />
                    Edit
                  </Button>
                </Link>
              )}
              {/* Duplicate button */}
              {user && course.createdBy === user.id && (
                <Button
                  variant="outline"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="gap-2 whitespace-nowrap rounded-lg border-[var(--border)] text-charcoal hover:border-gold-light"
                >
                  {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                  Duplicate
                </Button>
              )}
              {/* SCORM Export button */}
              {user && course.createdBy === user.id && course.status === 'published' && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`/api/export/scorm/${courseId}`, '_blank')}
                  className="gap-2 whitespace-nowrap rounded-lg border-[var(--border)] text-charcoal hover:border-gold-light"
                >
                  <Download className="w-4 h-4" />
                  SCORM
                </Button>
              )}
              {/* Preview button for course creator */}
              {user && course.createdBy === user.id && !hasStarted && (
                <Link href={`/courses/${courseId}/learn?preview=true`}>
                  <Button variant="outline" className="gap-2 whitespace-nowrap rounded-lg border-[var(--border)] text-charcoal hover:border-gold-light">
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                </Link>
              )}
              {isCompleted ? (
                <Link href={`/courses/${courseId}/certificate`}>
                  <Button className="bg-gold hover:bg-gold-dark text-charcoal gap-2 whitespace-nowrap rounded-lg px-6 font-semibold">
                    <Trophy className="w-4 h-4" />
                    View Certificate
                  </Button>
                </Link>
              ) : lessonsComplete && !examPassed ? (
                <Link href={`/courses/${courseId}/learn`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 whitespace-nowrap rounded-lg px-6">
                    <Target className="w-4 h-4" />
                    Take Final Exam
                  </Button>
                </Link>
              ) : (
                <Link href={`/courses/${courseId}/learn`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 whitespace-nowrap rounded-lg px-6">
                    <Play className="w-4 h-4" />
                    {hasStarted ? 'Continue Learning' : 'Start Learning'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="gold-line" />

        {/* Tabs Section */}
        <Tabs defaultValue="curriculum" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[520px] bg-cream-dark rounded-lg h-11">
            <TabsTrigger value="overview" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Overview</TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Curriculum</TabsTrigger>
            <TabsTrigger value="quizzes" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Quizzes</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, label: 'Modules', value: totalModules, color: 'text-charcoal' },
                { icon: FileText, label: 'Lessons', value: totalLessons, color: 'text-emerald-600' },
                { icon: Clock, label: 'Duration', value: course.estimatedDuration || 'N/A', color: 'text-amber-600' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="card-premium rounded-xl bg-[var(--card)] p-6 text-center">
                    <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                    <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
                    <p className="text-xs text-warm-gray mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="card-premium rounded-xl bg-[var(--card)] p-6">
              <h3 className="text-base font-semibold text-charcoal mb-3">About this course</h3>
              <p className="text-warm-gray leading-relaxed">{course.description}</p>
            </div>

            {course.targetAudience && (
              <div className="card-premium rounded-xl bg-[var(--card)] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-warm-gray" />
                  <h3 className="text-base font-semibold text-charcoal">Target Audience</h3>
                </div>
                <p className="text-warm-gray">{course.targetAudience}</p>
              </div>
            )}
          </TabsContent>

          {/* Curriculum Tab */}
          <TabsContent value="curriculum" className="mt-6">
            {course.modules && course.modules.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-3">
                {course.modules.map((module: any, moduleIndex: number) => (
                  <div key={module._id} className="card-premium rounded-xl bg-[var(--card)] overflow-hidden">
                    <AccordionItem value={`module-${moduleIndex}`} className="border-0">
                      <AccordionTrigger className="px-6 py-5 hover:no-underline">
                        <div className="flex items-start justify-between w-full gap-4 text-left">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-serif text-lg text-gold/40">
                                {String(moduleIndex + 1).padStart(2, '0')}
                              </span>
                              <h3 className="text-base font-semibold text-charcoal">
                                {module.title}
                              </h3>
                            </div>
                            <p className="text-sm text-warm-gray mt-1 ml-9">
                              {module.description}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 ml-9">
                              <span className="inline-flex items-center gap-1.5 text-xs text-warm-gray-light">
                                <FileText className="w-3 h-3" />
                                {module.lessons?.length || 0} lessons
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs text-warm-gray-light">
                                <Clock className="w-3 h-3" />
                                {module.estimatedDuration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 py-4 border-t border-[var(--border)]">
                        <div className="space-y-2.5 ml-9">
                          {module.lessons && module.lessons.length > 0 ? (
                            module.lessons.map((lesson: any) => {
                              const isLessonCompleted =
                                progress?.completedLessons.includes(lesson._id) || false;
                              return (
                                <div
                                  key={lesson._id}
                                  className="p-4 bg-cream rounded-lg border border-[var(--border)] hover:border-gold-light transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    {isLessonCompleted ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Play className="w-4 h-4 text-warm-gray-light flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium text-charcoal">
                                        {lesson.title}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-xs text-warm-gray-light mt-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.estimatedDuration}
                                      </div>

                                      {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                          <p className="text-[10px] font-semibold text-warm-gray-light uppercase tracking-widest">
                                            Key Takeaways
                                          </p>
                                          <ul className="space-y-0.5">
                                            {lesson.keyTakeaways.map(
                                              (takeaway: string, index: number) => (
                                                <li key={index} className="text-xs text-warm-gray flex items-start gap-2">
                                                  <span className="text-gold mt-0.5">&#8226;</span>
                                                  <span>{takeaway}</span>
                                                </li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-warm-gray">No lessons in this module yet.</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            ) : (
              <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
                <BookOpen className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
                <h3 className="text-base font-semibold text-charcoal mb-2">No modules yet</h3>
                <p className="text-warm-gray text-sm">This course is currently being prepared.</p>
              </div>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="mt-6">
            {course.quizzes && course.quizzes.length > 0 ? (
              <div className="space-y-3">
                {course.quizzes.map((quiz: any) => (
                  <div key={quiz._id} className="card-premium rounded-xl bg-[var(--card)] p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-charcoal mb-2">
                          {quiz.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${getQuizTypeBadge(quiz.type)} border text-xs font-medium`}>
                            {quiz.type === 'lesson' ? 'Lesson Quiz' : quiz.type === 'module' ? 'Module Quiz' : 'Final Exam'}
                          </Badge>
                          <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs">
                            {quiz.questions.length} questions
                          </Badge>
                          <Badge variant="outline" className="border-[var(--border)] text-warm-gray text-xs">
                            Passing: {quiz.passingScore}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {user?.id && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <Link href={`/courses/${courseId}/learn`}>
                          <Button size="sm" className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg text-xs">
                            <Play className="w-3 h-3" />
                            Take Quiz
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
                <Target className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
                <h3 className="text-base font-semibold text-charcoal mb-2">No quizzes available</h3>
                <p className="text-warm-gray text-sm">Quizzes will be available once the course content is finalized.</p>
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Rating Summary */}
            {courseReviews && courseReviews.totalReviews > 0 && (
              <Card className="card-premium rounded-xl bg-[var(--card)]">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-charcoal">{courseReviews.avgRating}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${s <= Math.round(courseReviews.avgRating) ? 'fill-gold text-gold' : 'text-warm-gray-light'}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-warm-gray mt-1">{courseReviews.totalReviews} review{courseReviews.totalReviews !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count = courseReviews.reviews.filter((r: any) => r.rating === rating).length;
                        const pct = courseReviews.totalReviews > 0 ? (count / courseReviews.totalReviews) * 100 : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs text-warm-gray w-3">{rating}</span>
                            <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden">
                              <div className="h-full bg-gold rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-warm-gray w-5 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Review */}
            {user && hasStarted && (
              <Card className="card-premium rounded-xl bg-[var(--card)]">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-charcoal mb-3">
                    {userReview ? 'Update Your Review' : 'Rate This Course'}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoveredStar(s)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setReviewRating(s)}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= (hoveredStar || reviewRating || (userReview?.rating ?? 0))
                              ? 'fill-gold text-gold'
                              : 'text-warm-gray-light'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-warm-gray ml-2">
                      {reviewRating || userReview?.rating || 0} / 5
                    </span>
                  </div>
                  <textarea
                    value={reviewFeedback || userReview?.feedback || ''}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Share your thoughts about this course (optional)"
                    className="w-full h-20 px-3 py-2 rounded-lg border border-[var(--border)] bg-cream text-sm text-charcoal placeholder:text-warm-gray-light resize-none focus:outline-none focus:ring-1 focus:ring-gold/50"
                  />
                  <Button
                    onClick={async () => {
                      const rating = reviewRating || userReview?.rating;
                      if (!rating || !user) return;
                      setSubmittingReview(true);
                      await submitReview({
                        userId: user.id,
                        courseId: courseId as any,
                        rating,
                        feedback: reviewFeedback || undefined,
                      });
                      setSubmittingReview(false);
                    }}
                    disabled={(!reviewRating && !userReview?.rating) || submittingReview}
                    className="mt-3 bg-charcoal text-gold hover:bg-charcoal/90"
                    size="sm"
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {userReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            {courseReviews && courseReviews.reviews.length > 0 ? (
              <div className="space-y-3">
                {courseReviews.reviews.map((review: any) => (
                  <Card key={review._id} className="card-premium rounded-xl bg-[var(--card)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-gold text-gold' : 'text-warm-gray-light'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-warm-gray">
                          {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {review.feedback && (
                        <p className="text-sm text-charcoal">{review.feedback}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
                <p className="text-sm text-warm-gray">No reviews yet. Be the first to rate this course!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Sidebar for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3" />

          <div className="space-y-4">
            {/* Course Progress Card */}
            {hasStarted && (
              <div className="card-premium rounded-xl bg-[var(--card)] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-semibold text-charcoal">Progress</h3>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-warm-gray">Completion</span>
                    <span className="text-xl font-semibold text-charcoal">{completionPercentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>

                <Separator className="bg-[var(--border)]" />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Lessons Completed</span>
                    <span className="font-semibold text-charcoal">
                      {progress?.completedLessons.length || 0} / {totalLessons}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Modules</span>
                    <span className="font-semibold text-charcoal">{totalModules}</span>
                  </div>
                </div>

                {lessonsComplete && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    {examPassed ? (
                      <Link href={`/courses/${courseId}/certificate`}>
                        <Button className="w-full bg-gold hover:bg-gold-dark text-charcoal gap-2 rounded-lg text-sm font-semibold">
                          <Trophy className="w-4 h-4" />
                          View Certificate
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/courses/${courseId}/learn`}>
                        <Button className="w-full bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg text-sm font-semibold">
                          <Target className="w-4 h-4" />
                          Take Final Exam
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Course Info Card */}
            <div className="card-premium rounded-xl bg-[var(--card)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-semibold text-charcoal">Course Info</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-warm-gray-light uppercase tracking-widest">Instructor</p>
                  <p className="text-sm text-charcoal font-medium mt-0.5">{course.companyName || 'Unknown'}</p>
                </div>
                {course.industry && (
                  <div>
                    <p className="text-[10px] font-semibold text-warm-gray-light uppercase tracking-widest">Industry</p>
                    <p className="text-sm text-charcoal mt-0.5">{course.industry}</p>
                  </div>
                )}
                {course.difficulty && (
                  <div>
                    <p className="text-[10px] font-semibold text-warm-gray-light uppercase tracking-widest">Difficulty</p>
                    <p className="text-sm text-charcoal capitalize mt-0.5">{course.difficulty}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
