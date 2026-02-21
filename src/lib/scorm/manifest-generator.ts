interface ManifestModule {
  id: string;
  title: string;
  lessons: { id: string; title: string; filename: string }[];
  quizFilename?: string;
}

interface ManifestConfig {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  modules: ManifestModule[];
  hasFinalExam: boolean;
}

export function generateManifest(config: ManifestConfig): string {
  const resources: string[] = [];
  const items: string[] = [];

  for (const mod of config.modules) {
    const lessonItems = mod.lessons.map(
      (lesson) =>
        `          <item identifier="ITEM_${lesson.id}" identifierref="RES_${lesson.id}">
            <title>${escapeXml(lesson.title)}</title>
          </item>`
    );

    if (mod.quizFilename) {
      lessonItems.push(
        `          <item identifier="ITEM_QUIZ_${mod.id}" identifierref="RES_QUIZ_${mod.id}">
            <title>${escapeXml(mod.title)} Quiz</title>
          </item>`
      );
    }

    items.push(
      `        <item identifier="MODULE_${mod.id}">
          <title>${escapeXml(mod.title)}</title>
${lessonItems.join('\n')}
        </item>`
    );

    // Resources for lessons
    for (const lesson of mod.lessons) {
      resources.push(
        `      <resource identifier="RES_${lesson.id}" type="webcontent" adlcp:scormtype="sco" href="${lesson.filename}">
        <file href="${lesson.filename}" />
      </resource>`
      );
    }

    // Quiz resource
    if (mod.quizFilename) {
      resources.push(
        `      <resource identifier="RES_QUIZ_${mod.id}" type="webcontent" adlcp:scormtype="sco" href="${mod.quizFilename}">
        <file href="${mod.quizFilename}" />
      </resource>`
      );
    }
  }

  // Final exam
  if (config.hasFinalExam) {
    items.push(
      `        <item identifier="ITEM_FINAL_EXAM" identifierref="RES_FINAL_EXAM">
          <title>Final Exam</title>
        </item>`
    );
    resources.push(
      `      <resource identifier="RES_FINAL_EXAM" type="webcontent" adlcp:scormtype="sco" href="content/final-exam.html">
        <file href="content/final-exam.html" />
      </resource>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST_${config.courseId}"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
  http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">

  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>

  <organizations default="ORG_${config.courseId}">
    <organization identifier="ORG_${config.courseId}">
      <title>${escapeXml(config.courseTitle)}</title>
${items.join('\n')}
    </organization>
  </organizations>

  <resources>
${resources.join('\n')}
  </resources>

</manifest>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
