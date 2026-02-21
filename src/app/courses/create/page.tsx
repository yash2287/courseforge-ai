"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UK_COMPLIANCE_TEMPLATES } from "@/lib/compliance-templates";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  ArrowLeft,
  BookOpen,
  Building2,
  Users,
  GraduationCap,
  Layers,
  Clock,
} from "lucide-react";

interface FormData {
  courseTitle: string;
  courseDescription: string;
  companyName: string;
  industry: string;
  targetAudience: string;
  difficultyLevel: string;
  numModules: string;
  lessonsPerModule: string;
  additionalInstructions: string;
}

type GenerationStep =
  | "idle"
  | "analyzing"
  | "structure"
  | "content"
  | "quizzes"
  | "finalexam"
  | "publishing";

export default function CreateCoursePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
          <p className="text-warm-gray text-sm">Loading...</p>
        </div>
      </div>
    }>
      <CreateCoursePage />
    </Suspense>
  );
}

function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const templateId = searchParams.get("template");
  const convexTemplateId = searchParams.get("templateId");
  const orgId = searchParams.get("orgId");

  const org = useQuery(
    api.organizations.getById,
    orgId ? { orgId: orgId as any } : "skip"
  );

  const convexTemplate = useQuery(
    api.courseTemplates.getById,
    convexTemplateId ? { templateId: convexTemplateId as any } : "skip"
  );

  const [formData, setFormData] = useState<FormData>({
    courseTitle: "",
    courseDescription: "",
    companyName: "",
    industry: "Technology",
    targetAudience: "",
    difficultyLevel: "beginner",
    numModules: "3",
    lessonsPerModule: "3",
    additionalInstructions: "",
  });

  // Pre-fill from compliance template (legacy) or Convex template
  useEffect(() => {
    if (templateId) {
      const template = UK_COMPLIANCE_TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        setFormData((prev) => ({
          ...prev,
          ...template.formData,
          companyName: org?.name || prev.companyName,
        }));
      }
    }
  }, [templateId, org?.name]);

  useEffect(() => {
    if (convexTemplate) {
      setFormData((prev) => ({
        ...prev,
        ...convexTemplate.formData,
        companyName: org?.name || prev.companyName,
      }));
    }
  }, [convexTemplate, org?.name]);

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const createCourse = useMutation(api.courses.create);
  const batchCreateModules = useMutation(api.modules.batchCreate);
  const batchCreateLessons = useMutation(api.lessons.batchCreate);
  const batchCreateQuizzes = useMutation(api.quizzes.batchCreate);
  const updateCourseStatus = useMutation(api.courses.updateStatus);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.courseTitle.trim()) {
      setError("Course title is required");
      return false;
    }
    if (!formData.courseDescription.trim()) {
      setError("Course description is required");
      return false;
    }
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!formData.targetAudience.trim()) {
      setError("Target audience is required");
      return false;
    }
    setError(null);
    return true;
  };

  const handleGenerateCourse = async () => {
    if (!validateForm() || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setCurrentStep("analyzing");

      setCurrentStep("structure");
      const generateResponse = await fetch("/api/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.courseTitle,
          description: formData.courseDescription,
          companyName: formData.companyName,
          industry: formData.industry,
          targetAudience: formData.targetAudience,
          difficulty: formData.difficultyLevel,
          numberOfModules: parseInt(formData.numModules),
          lessonsPerModule: parseInt(formData.lessonsPerModule),
          additionalInstructions: formData.additionalInstructions,
        }),
      });

      if (!generateResponse.ok) {
        const errBody = await generateResponse.json().catch(() => ({}));
        throw new Error(
          errBody.error || "Failed to generate course structure"
        );
      }

      const generatedData = await generateResponse.json();
      const courseContent = generatedData.data;

      if (!courseContent || !courseContent.modules) {
        throw new Error("Invalid course data received from AI");
      }

      // Sum module durations into a single total
      const totalMinutes = courseContent.modules.reduce(
        (sum: number, m: { estimatedDuration?: string }) => {
          const dur = (m.estimatedDuration || "").toLowerCase();
          let mins = 0;
          const hourMatch = dur.match(/(\d+)\s*h/);
          const minMatch = dur.match(/(\d+)\s*m/);
          if (hourMatch) mins += parseInt(hourMatch[1]) * 60;
          if (minMatch) mins += parseInt(minMatch[1]);
          // Fallback: if only a bare number, treat as minutes
          if (!hourMatch && !minMatch) {
            const num = parseInt(dur);
            if (!isNaN(num)) mins += num;
          }
          return sum + mins;
        },
        0
      );
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const totalDuration =
        totalMinutes > 0
          ? hours > 0 && mins > 0
            ? `${hours} hour${hours !== 1 ? "s" : ""} ${mins} minutes`
            : hours > 0
              ? `${hours} hour${hours !== 1 ? "s" : ""}`
              : `${mins} minutes`
          : `${parseInt(formData.numModules) * 2} hours`;

      setCurrentStep("content");
      const courseId = await createCourse({
        title: courseContent.title || formData.courseTitle,
        description: courseContent.description || formData.courseDescription,
        companyName: formData.companyName,
        industry: formData.industry,
        targetAudience: formData.targetAudience,
        difficulty: formData.difficultyLevel as
          | "beginner"
          | "intermediate"
          | "advanced",
        estimatedDuration: totalDuration,
        createdBy: user.id,
        orgId: orgId ? (orgId as any) : undefined,
        isComplianceTemplate: templateId ? true : undefined,
        complianceCategory: templateId || undefined,
      });

      const modulesForConvex = courseContent.modules.map(
        (
          mod: {
            title: string;
            description?: string;
            estimatedDuration?: string;
          },
          idx: number
        ) => ({
          courseId,
          title: mod.title,
          description: mod.description || "",
          order: idx,
          estimatedDuration: mod.estimatedDuration || "1 hour",
        })
      );
      const moduleIds = await batchCreateModules({
        modules: modulesForConvex,
      });

      interface AILesson {
        title: string;
        content?: string;
        keyTakeaways?: string[];
        estimatedDuration?: string;
      }
      interface AIModule {
        title: string;
        lessons?: AILesson[];
      }

      const allLessons: Array<{
        moduleId: (typeof moduleIds)[number];
        courseId: typeof courseId;
        title: string;
        content: string;
        keyTakeaways: string[];
        order: number;
        estimatedDuration: string;
      }> = [];

      courseContent.modules.forEach((mod: AIModule, modIdx: number) => {
        const moduleId = moduleIds[modIdx];
        (mod.lessons || []).forEach((lesson: AILesson, lessonIdx: number) => {
          allLessons.push({
            moduleId,
            courseId,
            title: lesson.title,
            content: lesson.content || "",
            keyTakeaways: lesson.keyTakeaways || [],
            order: lessonIdx,
            estimatedDuration: lesson.estimatedDuration || "30 minutes",
          });
        });
      });

      await batchCreateLessons({ lessons: allLessons as any });

      setCurrentStep("quizzes");
      const quizzesForConvex: Array<{
        courseId: typeof courseId;
        moduleId?: (typeof moduleIds)[number];
        title: string;
        type: "module" | "final";
        passingScore: number;
        questions: Array<{
          question: string;
          options: string[];
          correctAnswer: number;
          explanation: string;
        }>;
      }> = [];

      for (let i = 0; i < courseContent.modules.length; i++) {
        const mod: AIModule = courseContent.modules[i];
        const moduleId = moduleIds[i];
        const moduleContent = (mod.lessons || [])
          .map((l: AILesson) => l.content || "")
          .join("\n\n");

        try {
          const quizResponse = await fetch("/api/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonTitle: mod.title,
              lessonContent: moduleContent.substring(0, 8000),
              numberOfQuestions: 5,
              difficulty: formData.difficultyLevel,
            }),
          });

          if (quizResponse.ok) {
            const quizResult = await quizResponse.json();
            if (quizResult.success && quizResult.data) {
              quizzesForConvex.push({
                courseId,
                moduleId,
                title: `${mod.title} Quiz`,
                type: "module",
                passingScore: 70,
                questions: quizResult.data,
              });
            }
          }
        } catch {
          console.error(`Failed to generate quiz for module: ${mod.title}`);
        }
      }

      setCurrentStep("finalexam");
      const allContent = allLessons
        .map((l) => l.content)
        .join("\n\n")
        .substring(0, 10000);

      try {
        const finalExamResponse = await fetch("/api/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonTitle: `${formData.courseTitle} - Final Exam`,
            lessonContent: allContent,
            numberOfQuestions: 10,
            difficulty: formData.difficultyLevel,
          }),
        });

        if (finalExamResponse.ok) {
          const finalResult = await finalExamResponse.json();
          if (finalResult.success && finalResult.data) {
            quizzesForConvex.push({
              courseId,
              title: "Final Exam",
              type: "final",
              passingScore: 70,
              questions: finalResult.data,
            });
          }
        }
      } catch {
        console.error("Failed to generate final exam");
      }

      if (quizzesForConvex.length > 0) {
        await batchCreateQuizzes({ quizzes: quizzesForConvex as any });
      }

      setCurrentStep("publishing");
      await updateCourseStatus({ courseId, status: "published" });

      router.push(`/courses/${courseId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setLoading(false);
      setCurrentStep("idle");
    }
  };

  const getStepMessage = (): string => {
    switch (currentStep) {
      case "analyzing":
        return "Analyzing your requirements...";
      case "structure":
        return "Generating course structure...";
      case "content":
        return "Creating lesson content...";
      case "quizzes":
        return "Building quizzes...";
      case "finalexam":
        return "Creating final exam...";
      case "publishing":
        return "Publishing course...";
      default:
        return "";
    }
  };

  const stepProgress = {
    analyzing: 15,
    structure: 30,
    content: 50,
    quizzes: 75,
    finalexam: 90,
    publishing: 100,
  };

  const currentProgress =
    stepProgress[currentStep as keyof typeof stepProgress] || 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-warm-gray hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Org Context Badge */}
      {org && (
        <div className="flex items-center gap-2 bg-gold/5 border border-gold/20 rounded-lg px-4 py-2.5">
          <Building2 className="w-4 h-4 text-gold" />
          <span className="text-sm text-charcoal">
            Creating course for <span className="font-semibold">{org.name}</span>
          </span>
          {templateId && (
            <Badge className="bg-gold/10 text-gold border-gold/20 text-xs ml-auto">
              Compliance Template
            </Badge>
          )}
        </div>
      )}

      {/* Page Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">New Course</p>
        <h1 className="text-3xl md:text-4xl font-light tracking-tight text-charcoal">
          Create a <span className="font-serif italic">training course</span>
        </h1>
        <p className="text-warm-gray">
          Fill in the details and let AI generate a complete course for your organization.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="card-premium rounded-xl bg-[var(--card)]">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-charcoal">Course Details</h2>
              <p className="text-sm text-warm-gray mt-1">
                Provide information about your training course.
              </p>
            </div>
            <div className="p-6 space-y-6">
              {/* Course Title */}
              <div className="space-y-2">
                <Label htmlFor="courseTitle" className="text-sm font-medium text-charcoal">
                  Course Title<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="courseTitle"
                  name="courseTitle"
                  placeholder="e.g., Advanced Data Analysis"
                  value={formData.courseTitle}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="rounded-lg border-[var(--border)] focus:border-gold focus:ring-gold/20"
                />
              </div>

              {/* Course Description */}
              <div className="space-y-2">
                <Label htmlFor="courseDescription" className="text-sm font-medium text-charcoal">
                  Course Description<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Textarea
                  id="courseDescription"
                  name="courseDescription"
                  placeholder="Describe what this course will cover..."
                  value={formData.courseDescription}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={4}
                  className="rounded-lg border-[var(--border)] focus:border-gold focus:ring-gold/20"
                />
              </div>

              {/* Company & Industry */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-charcoal">
                    Company Name<span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="rounded-lg border-[var(--border)] focus:border-gold focus:ring-gold/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-charcoal">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      handleSelectChange("industry", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="industry" className="rounded-lg border-[var(--border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-sm font-medium text-charcoal">
                  Target Audience<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  id="targetAudience"
                  name="targetAudience"
                  placeholder="e.g., New hires, Sales team, Managers"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="rounded-lg border-[var(--border)] focus:border-gold focus:ring-gold/20"
                />
              </div>

              {/* Difficulty Level */}
              <div className="space-y-2">
                <Label htmlFor="difficultyLevel" className="text-sm font-medium text-charcoal">Difficulty Level</Label>
                <Select
                  value={formData.difficultyLevel}
                  onValueChange={(value) =>
                    handleSelectChange("difficultyLevel", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="difficultyLevel" className="rounded-lg border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Modules & Lessons */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numModules" className="text-sm font-medium text-charcoal">Number of Modules</Label>
                  <Select
                    value={formData.numModules}
                    onValueChange={(value) =>
                      handleSelectChange("numModules", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="numModules" className="rounded-lg border-[var(--border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lessonsPerModule" className="text-sm font-medium text-charcoal">Lessons per Module</Label>
                  <Select
                    value={formData.lessonsPerModule}
                    onValueChange={(value) =>
                      handleSelectChange("lessonsPerModule", value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="lessonsPerModule" className="rounded-lg border-[var(--border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-2">
                <Label htmlFor="additionalInstructions" className="text-sm font-medium text-charcoal">
                  Additional Instructions <span className="text-warm-gray font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="additionalInstructions"
                  name="additionalInstructions"
                  placeholder="Any specific topics, company policies, or tone preferences..."
                  value={formData.additionalInstructions}
                  onChange={handleInputChange}
                  disabled={loading}
                  rows={3}
                  className="rounded-lg border-[var(--border)] focus:border-gold focus:ring-gold/20"
                />
              </div>

              {/* Progress Indicator */}
              {loading && (
                <div className="rounded-xl bg-cream p-5 border border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-gold/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    </div>
                    <p className="font-medium text-charcoal text-sm">
                      {getStepMessage()}
                    </p>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-gold-dark transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerateCourse}
                disabled={loading}
                size="lg"
                className="w-full gap-2 bg-charcoal hover:bg-charcoal-light text-cream rounded-xl h-12 text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Course
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <div className="card-premium rounded-xl bg-[var(--card)] sticky top-24">
            <div className="p-6 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-charcoal">Course Summary</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Title Preview */}
              {formData.courseTitle && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Title
                    </p>
                  </div>
                  <p className="font-medium text-charcoal text-sm">{formData.courseTitle}</p>
                </div>
              )}

              {/* Company Preview */}
              {formData.companyName && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Company
                    </p>
                  </div>
                  <p className="font-medium text-charcoal text-sm">{formData.companyName}</p>
                </div>
              )}

              {/* Industry Preview */}
              {formData.industry && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Industry
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-cream-dark text-charcoal border-0 text-xs">{formData.industry}</Badge>
                </div>
              )}

              {/* Target Audience Preview */}
              {formData.targetAudience && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Audience
                    </p>
                  </div>
                  <p className="font-medium text-charcoal text-sm">{formData.targetAudience}</p>
                </div>
              )}

              {/* Difficulty Level Preview */}
              {formData.difficultyLevel && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Level
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-cream-dark text-charcoal border-0 text-xs">
                    {formData.difficultyLevel.charAt(0).toUpperCase() +
                      formData.difficultyLevel.slice(1)}
                  </Badge>
                </div>
              )}

              {/* Course Structure Preview */}
              {formData.numModules && formData.lessonsPerModule && (
                <div className="space-y-3 border-t border-[var(--border)] pt-5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-warm-gray-light" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-warm-gray-light">
                      Structure
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between rounded-lg bg-cream p-2.5 text-xs">
                      <span className="text-warm-gray">Modules</span>
                      <span className="font-semibold text-charcoal">
                        {formData.numModules}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-cream p-2.5 text-xs">
                      <span className="text-warm-gray">Lessons/Module</span>
                      <span className="font-semibold text-charcoal">
                        {formData.lessonsPerModule}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-cream p-2.5 text-xs">
                      <span className="text-warm-gray">Total Lessons</span>
                      <span className="font-semibold text-charcoal">
                        {parseInt(formData.numModules) *
                          parseInt(formData.lessonsPerModule)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated Time */}
              {formData.numModules && formData.lessonsPerModule && (
                <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 p-3 text-xs border border-amber-100">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-amber-800 leading-relaxed">
                    Generation typically takes 2-5 minutes depending on course
                    size.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
