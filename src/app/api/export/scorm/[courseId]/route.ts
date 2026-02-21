import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import JSZip from "jszip";
import { generateManifest } from "@/lib/scorm/manifest-generator";
import { generateLessonHtml, generateQuizHtml } from "@/lib/scorm/content-generator";
import { SCORM_API_JS, SCORM_STYLES } from "@/lib/scorm/scorm-api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  try {
    // Fetch course data
    const course = await convex.query(api.courses.getById, {
      courseId: courseId as Id<"courses">,
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Fetch modules, lessons, quizzes
    const modules = await convex.query(api.modules.getByCourse, {
      courseId: courseId as Id<"courses">,
    });

    const allLessons = [];
    for (const mod of modules) {
      const lessons = await convex.query(api.lessons.getByModule, {
        moduleId: mod._id,
      });
      allLessons.push(...lessons);
    }

    const quizzes = await convex.query(api.quizzes.getByCourse, {
      courseId: courseId as Id<"courses">,
    });

    // Build ZIP
    const zip = new JSZip();

    // Add SCORM API and styles
    zip.file("scormapi.js", SCORM_API_JS);
    zip.file("style.css", SCORM_STYLES);

    // Build manifest config
    const manifestModules = [];
    let globalLessonIndex = 0;
    const totalLessons = allLessons.length;

    for (const mod of modules) {
      const modLessons = allLessons
        .filter((l) => l.moduleId === mod._id)
        .sort((a, b) => a.order - b.order);

      const manifestLessons = [];

      for (const lesson of modLessons) {
        globalLessonIndex++;
        const filename = `content/module-${mod.order}/lesson-${lesson.order}.html`;

        // Generate lesson HTML
        const html = generateLessonHtml({
          title: lesson.title,
          content: lesson.content,
          keyTakeaways: lesson.keyTakeaways,
          moduleTitle: mod.title,
          courseTitle: course.title,
          lessonIndex: globalLessonIndex,
          totalLessons,
        });

        zip.file(filename, html);

        manifestLessons.push({
          id: `L${mod.order}_${lesson.order}`,
          title: lesson.title,
          filename,
        });
      }

      // Module quiz
      const moduleQuiz = quizzes.find(
        (q) => q.moduleId === mod._id && q.type === "module"
      );
      let quizFilename: string | undefined;

      if (moduleQuiz) {
        quizFilename = `content/module-${mod.order}/quiz.html`;
        const quizHtml = generateQuizHtml({
          title: `${mod.title} Quiz`,
          questions: moduleQuiz.questions,
          passingScore: moduleQuiz.passingScore,
          courseTitle: course.title,
        });
        zip.file(quizFilename, quizHtml);
      }

      manifestModules.push({
        id: `M${mod.order}`,
        title: mod.title,
        lessons: manifestLessons,
        quizFilename,
      });
    }

    // Final exam
    const finalExam = quizzes.find((q) => q.type === "final");
    if (finalExam) {
      const finalHtml = generateQuizHtml({
        title: "Final Exam",
        questions: finalExam.questions,
        passingScore: finalExam.passingScore,
        courseTitle: course.title,
      });
      zip.file("content/final-exam.html", finalHtml);
    }

    // Generate manifest
    const manifest = generateManifest({
      courseId,
      courseTitle: course.title,
      courseDescription: course.description,
      modules: manifestModules,
      hasFinalExam: !!finalExam,
    });
    zip.file("imsmanifest.xml", manifest);

    // Generate ZIP
    const uint8 = await zip.generateAsync({ type: "uint8array" });

    const slug = course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return new NextResponse(uint8.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-scorm.zip"`,
      },
    });
  } catch (error) {
    console.error("SCORM export error:", error);
    return NextResponse.json(
      { error: "Failed to generate SCORM package" },
      { status: 500 }
    );
  }
}
