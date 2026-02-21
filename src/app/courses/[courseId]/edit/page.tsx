'use client';

import { use, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Save,
  ArrowLeft,
  FileText,
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Loader2,
  Eye,
  Globe,
  PenLine,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CourseEditPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  const { courseId } = use(params);
  const { user } = useUser();
  const router = useRouter();

  const course = useQuery(api.courses.getById, { courseId: courseId as any });

  const updateLesson = useMutation(api.lessons.update);
  const updateModule = useMutation(api.modules.update);
  const updateQuiz = useMutation(api.quizzes.update);
  const updateCourseStatus = useMutation(api.courses.updateStatus);

  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [editMode, setEditMode] = useState<'lesson' | 'quiz'>('lesson');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);

  // Local editing state
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonTakeaways, setLessonTakeaways] = useState<string[]>([]);
  const [lessonDuration, setLessonDuration] = useState('');

  // Module editing state
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  // Sync local state with selected lesson
  useEffect(() => {
    if (!course?.modules) return;
    const module = course.modules[selectedModuleIdx];
    if (!module) return;

    setModuleTitle(module.title);
    setModuleDescription(module.description);

    const lesson = module.lessons?.[selectedLessonIdx];
    if (lesson) {
      setLessonTitle(lesson.title);
      setLessonContent(lesson.content);
      setLessonTakeaways(lesson.keyTakeaways || []);
      setLessonDuration(lesson.estimatedDuration || '');
    }
  }, [course, selectedModuleIdx, selectedLessonIdx]);

  if (!course || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  if (course.createdBy !== user.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 text-center max-w-md">
          <p className="text-warm-gray mb-4">You don&apos;t have permission to edit this course.</p>
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline" className="rounded-lg">Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[selectedModuleIdx];
  const currentLesson = currentModule?.lessons?.[selectedLessonIdx];

  const handleSaveLesson = async () => {
    if (!currentLesson) return;
    setSaving(true);
    try {
      await updateLesson({
        lessonId: currentLesson._id as any,
        title: lessonTitle,
        content: lessonContent,
        keyTakeaways: lessonTakeaways,
        estimatedDuration: lessonDuration,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModule = async () => {
    if (!currentModule) return;
    setSaving(true);
    try {
      await updateModule({
        moduleId: currentModule._id as any,
        title: moduleTitle,
        description: moduleDescription,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    await updateCourseStatus({
      courseId: courseId as any,
      status: 'published',
    });
    router.push(`/courses/${courseId}`);
  };

  const handleUnpublish = async () => {
    await updateCourseStatus({
      courseId: courseId as any,
      status: 'draft',
    });
  };

  const toggleModule = (idx: number) => {
    const next = new Set(expandedModules);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedModules(next);
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setQuizDialogOpen(true);
  };

  const handleSaveQuiz = async (quiz: any, questions: any[]) => {
    setSaving(true);
    try {
      await updateQuiz({
        quizId: quiz._id as any,
        questions,
      });
      setQuizDialogOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-cream">
      {/* Left Sidebar — Module/Lesson Tree */}
      <div className="w-72 bg-[var(--card)] border-r border-[var(--border)] overflow-y-auto flex-shrink-0">
        <div className="p-5">
          <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-xs transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" />
            Back to Course
          </Link>

          <h2 className="font-serif text-base text-charcoal leading-tight mb-1">{course.title}</h2>
          <Badge className={`text-[10px] font-medium border ${
            course.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            course.status === 'draft' ? 'bg-sky-50 text-sky-700 border-sky-200' :
            'bg-amber-50 text-amber-700 border-amber-200'
          }`}>{course.status}</Badge>

          <div className="gold-line-left mt-4 mb-5 w-10" />

          {/* Module Tree */}
          <div className="space-y-1">
            {course.modules?.map((module: any, moduleIdx: number) => (
              <div key={module._id}>
                <button
                  onClick={() => {
                    toggleModule(moduleIdx);
                    setSelectedModuleIdx(moduleIdx);
                    if (module.lessons?.length > 0) {
                      setSelectedLessonIdx(0);
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedModuleIdx === moduleIdx ? 'bg-cream text-charcoal' : 'text-warm-gray hover:bg-cream'
                  }`}
                >
                  {expandedModules.has(moduleIdx) ? (
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span className="font-serif text-gold/40 text-xs">{String(moduleIdx + 1).padStart(2, '0')}</span>
                  <span className="truncate text-xs">{module.title}</span>
                </button>

                {expandedModules.has(moduleIdx) && module.lessons && (
                  <div className="ml-6 mt-0.5 space-y-0.5">
                    {module.lessons.map((lesson: any, lessonIdx: number) => (
                      <button
                        key={lesson._id}
                        onClick={() => {
                          setSelectedModuleIdx(moduleIdx);
                          setSelectedLessonIdx(lessonIdx);
                          setEditMode('lesson');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                          selectedModuleIdx === moduleIdx && selectedLessonIdx === lessonIdx
                            ? 'bg-gold/5 text-charcoal font-medium'
                            : 'text-warm-gray hover:bg-cream'
                        }`}
                      >
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    ))}
                    {/* Module quiz link */}
                    {course.quizzes?.filter((q: any) => q.moduleId === module._id && q.type === 'module').map((quiz: any) => (
                      <button
                        key={quiz._id}
                        onClick={() => handleEditQuiz(quiz)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-2"
                      >
                        <HelpCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Module Quiz</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Final Exam */}
            {course.quizzes?.filter((q: any) => q.type === 'final').map((quiz: any) => (
              <button
                key={quiz._id}
                onClick={() => handleEditQuiz(quiz)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-2 mt-2"
              >
                <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Final Exam ({quiz.questions.length} questions)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className="bg-[var(--card)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine className="w-4 h-4 text-gold" />
            <h1 className="text-sm font-semibold text-charcoal">Course Editor</h1>
            {saved && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs animate-fade-up">
                <CheckCircle className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/courses/${courseId}/learn?preview=true`}>
              <Button variant="outline" size="sm" className="gap-1.5 border-[var(--border)] rounded-lg text-xs">
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Button>
            </Link>
            {course.status === 'published' ? (
              <Button variant="outline" size="sm" onClick={handleUnpublish} className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-lg text-xs">
                Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={handlePublish} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs">
                <Globe className="w-3.5 h-3.5" />
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8 space-y-8">
            {/* Module Info (collapsible) */}
            {currentModule && (
              <div className="card-premium rounded-xl bg-[var(--card)] p-6">
                <h3 className="text-xs font-semibold text-warm-gray uppercase tracking-wider mb-4">Module Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-charcoal mb-1.5 block">Module Title</label>
                    <Input
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      className="bg-cream border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-charcoal mb-1.5 block">Description</label>
                    <Input
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      className="bg-cream border-[var(--border)] rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveModule}
                    disabled={saving}
                    className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg text-xs gap-1.5"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save Module
                  </Button>
                </div>
              </div>
            )}

            {/* Lesson Editor */}
            {currentLesson && (
              <>
                <div className="card-premium rounded-xl bg-[var(--card)] p-6 space-y-5">
                  <h3 className="text-xs font-semibold text-warm-gray uppercase tracking-wider">Lesson Content</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-charcoal mb-1.5 block">Lesson Title</label>
                      <Input
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        className="bg-cream border-[var(--border)] rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-charcoal mb-1.5 block">Duration</label>
                      <Input
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(e.target.value)}
                        placeholder="e.g., 15 minutes"
                        className="bg-cream border-[var(--border)] rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-charcoal mb-1.5 block">Content (Markdown)</label>
                    <Textarea
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      rows={16}
                      className="bg-cream border-[var(--border)] rounded-lg text-sm font-mono leading-relaxed resize-y"
                      placeholder="Write your lesson content in Markdown..."
                    />
                    <p className="text-[10px] text-warm-gray mt-1">Supports Markdown: **bold**, *italic*, # headings, - lists</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-charcoal mb-1.5 block">Key Takeaways</label>
                    <div className="space-y-2">
                      {lessonTakeaways.map((takeaway, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={takeaway}
                            onChange={(e) => {
                              const next = [...lessonTakeaways];
                              next[idx] = e.target.value;
                              setLessonTakeaways(next);
                            }}
                            className="bg-cream border-[var(--border)] rounded-lg text-sm flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLessonTakeaways(lessonTakeaways.filter((_, i) => i !== idx))}
                            className="text-warm-gray hover:text-red-500 px-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLessonTakeaways([...lessonTakeaways, ''])}
                        className="gap-1.5 border-dashed border-[var(--border)] text-warm-gray text-xs rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                        Add Takeaway
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveLesson}
                      disabled={saving}
                      className="bg-charcoal hover:bg-charcoal-light text-cream rounded-lg gap-1.5"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Lesson
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Editor Dialog */}
      {selectedQuiz && (
        <QuizEditorDialog
          quiz={selectedQuiz}
          open={quizDialogOpen}
          onOpenChange={setQuizDialogOpen}
          onSave={handleSaveQuiz}
          saving={saving}
        />
      )}
    </div>
  );
}

function QuizEditorDialog({
  quiz,
  open,
  onOpenChange,
  onSave,
  saving,
}: {
  quiz: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (quiz: any, questions: any[]) => void;
  saving: boolean;
}) {
  const [questions, setQuestions] = useState<any[]>(quiz.questions || []);

  useEffect(() => {
    setQuestions(quiz.questions || []);
  }, [quiz]);

  const updateQuestion = (idx: number, field: string, value: any) => {
    const next = [...questions];
    next[idx] = { ...next[idx], [field]: value };
    setQuestions(next);
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const next = [...questions];
    const options = [...next[qIdx].options];
    options[oIdx] = value;
    next[qIdx] = { ...next[qIdx], options };
    setQuestions(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-2xl border-[var(--border)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-charcoal">
            Edit: {quiz.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-cream rounded-xl p-5 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-warm-gray">Question {qIdx + 1}</span>
              </div>

              <Input
                value={q.question}
                onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                className="bg-[var(--card)] border-[var(--border)] rounded-lg text-sm mb-3"
                placeholder="Question text"
              />

              <div className="space-y-2 mb-3">
                {q.options.map((opt: string, oIdx: number) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        q.correctAnswer === oIdx
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-[var(--border)] bg-[var(--card)] hover:border-emerald-300'
                      }`}
                    >
                      {q.correctAnswer === oIdx && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      className="bg-[var(--card)] border-[var(--border)] rounded-lg text-sm flex-1"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[10px] font-medium text-warm-gray uppercase tracking-wider">Explanation</label>
                <Textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                  rows={2}
                  className="bg-[var(--card)] border-[var(--border)] rounded-lg text-xs mt-1"
                />
              </div>
            </div>
          ))}

          <Button
            onClick={() => onSave(quiz, questions)}
            disabled={saving}
            className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
