import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    industry: v.optional(v.string()),
    createdBy: v.string(),
    // Branding / white-label
    branding: v.optional(
      v.object({
        primaryColor: v.optional(v.string()),
        secondaryColor: v.optional(v.string()),
        logoUrl: v.optional(v.string()),
        companyUrl: v.optional(v.string()),
        certificateFooter: v.optional(v.string()),
      })
    ),
    // SSO / SAML configuration
    ssoConfig: v.optional(
      v.object({
        enabled: v.boolean(),
        provider: v.optional(v.string()), // "okta" | "azure_ad" | "google_workspace" | "custom"
        defaultRole: v.union(
          v.literal("admin"),
          v.literal("manager"),
          v.literal("learner")
        ),
        autoProvision: v.boolean(),
        defaultDepartmentId: v.optional(v.id("departments")),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["createdBy"]),

  // Departments within an organization
  departments: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    managerId: v.optional(v.string()),
    parentDepartmentId: v.optional(v.id("departments")),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_parent", ["parentDepartmentId"]),

  // SSO email domain → organization mapping
  ssoDomains: defineTable({
    orgId: v.id("organizations"),
    domain: v.string(), // e.g. "acme.com"
    verified: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_domain", ["domain"])
    .index("by_org", ["orgId"]),

  // Organization members
  orgMembers: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("manager"),
      v.literal("learner")
    ),
    departmentId: v.optional(v.id("departments")),
    provisionedVia: v.optional(
      v.union(v.literal("invite"), v.literal("sso"), v.literal("manual"))
    ),
    joinedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["orgId", "userId"])
    .index("by_email", ["email"])
    .index("by_department", ["departmentId"]),

  // Organization invites
  orgInvites: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("learner")
    ),
    invitedBy: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["email"])
    .index("by_email_status", ["email", "status"])
    .index("by_org_status", ["orgId", "status"]),

  // Course assignments
  courseAssignments: defineTable({
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
    userId: v.string(),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue")
    ),
    assignedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_org_course", ["orgId", "courseId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["orgId", "userId"])
    .index("by_course", ["courseId"])
    .index("by_status", ["status"]),

  // Courses table
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    companyName: v.string(),
    industry: v.string(),
    targetAudience: v.string(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.string(),
    coverImage: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("generating"), v.literal("published"), v.literal("archived")),
    createdBy: v.string(),
    orgId: v.optional(v.id("organizations")),
    isComplianceTemplate: v.optional(v.boolean()),
    complianceCategory: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_status", ["status"])
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"]),

  // Modules within a course
  modules: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    order: v.number(),
    estimatedDuration: v.string(),
  }).index("by_course", ["courseId"]),

  // Lessons within a module
  lessons: defineTable({
    moduleId: v.id("modules"),
    courseId: v.id("courses"),
    title: v.string(),
    content: v.string(),
    keyTakeaways: v.array(v.string()),
    order: v.number(),
    estimatedDuration: v.string(),
    mediaAttachments: v.optional(v.array(v.object({
      mediaId: v.id("mediaFiles"),
      type: v.union(v.literal("image"), v.literal("video"), v.literal("document"), v.literal("audio")),
      position: v.union(v.literal("inline"), v.literal("top"), v.literal("bottom")),
      caption: v.optional(v.string()),
    }))),
  })
    .index("by_module", ["moduleId"])
    .index("by_course", ["courseId"]),

  // Quizzes for lessons/modules
  quizzes: defineTable({
    courseId: v.id("courses"),
    moduleId: v.optional(v.id("modules")),
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    type: v.union(v.literal("lesson"), v.literal("module"), v.literal("final")),
    passingScore: v.number(),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        explanation: v.string(),
      })
    ),
  })
    .index("by_course", ["courseId"])
    .index("by_lesson", ["lessonId"])
    .index("by_module", ["moduleId"]),

  // User progress tracking
  userProgress: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    completedLessons: v.array(v.id("lessons")),
    currentLessonId: v.optional(v.id("lessons")),
    overallProgress: v.number(), // 0-100
    startedAt: v.number(),
    lastAccessedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_course", ["courseId"]),

  // Quiz attempts
  quizAttempts: defineTable({
    userId: v.string(),
    quizId: v.id("quizzes"),
    courseId: v.id("courses"),
    score: v.number(),
    passed: v.boolean(),
    answers: v.array(v.number()),
    attemptedAt: v.number(),
  })
    .index("by_user_quiz", ["userId", "quizId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_course", ["courseId"])
    .index("by_quiz", ["quizId"]),

  // Certificates
  certificates: defineTable({
    userId: v.string(),
    userName: v.string(),
    courseId: v.id("courses"),
    courseTitle: v.string(),
    companyName: v.string(),
    completionDate: v.number(),
    certificateId: v.string(),
    finalScore: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_course", ["userId", "courseId"])
    .index("by_certificate_id", ["certificateId"])
    .index("by_course", ["courseId"]),

  // In-app notifications
  notifications: defineTable({
    userId: v.string(),
    orgId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("course_assigned"),
      v.literal("course_completed"),
      v.literal("deadline_reminder"),
      v.literal("certificate_earned"),
      v.literal("org_invite"),
      v.literal("general")
    ),
    title: v.string(),
    message: v.string(),
    linkUrl: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  // Learning events for analytics
  learningEvents: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    eventType: v.union(
      v.literal("lesson_started"),
      v.literal("lesson_completed"),
      v.literal("quiz_attempted"),
      v.literal("quiz_passed"),
      v.literal("course_completed")
    ),
    duration: v.optional(v.number()),
    metadata: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_org_course", ["courseId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Notification preferences per user
  notificationPreferences: defineTable({
    userId: v.string(),
    emailAssignments: v.boolean(),
    emailReminders: v.boolean(),
    emailCompletions: v.boolean(),
    emailDigest: v.boolean(),
  }).index("by_user", ["userId"]),

  // Learning paths (course sequences)
  learningPaths: defineTable({
    orgId: v.id("organizations"),
    title: v.string(),
    description: v.optional(v.string()),
    courseIds: v.array(v.id("courses")),
    estimatedDuration: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_status", ["orgId", "status"]),

  // Learning path assignments
  learningPathAssignments: defineTable({
    pathId: v.id("learningPaths"),
    orgId: v.id("organizations"),
    userId: v.string(),
    assignedBy: v.string(),
    dueDate: v.optional(v.number()),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    assignedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_path", ["pathId"])
    .index("by_path_user", ["pathId", "userId"]),

  // Course ratings/reviews
  courseReviews: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    rating: v.number(),
    feedback: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_user_course", ["userId", "courseId"]),

  // AI Chat messages for course assistant
  chatMessages: defineTable({
    userId: v.string(),
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_user_course", ["userId", "courseId"])
    .index("by_user_course_lesson", ["userId", "courseId", "lessonId"]),

  // Gamification: user points
  userPoints: defineTable({
    userId: v.string(),
    orgId: v.optional(v.id("organizations")),
    totalPoints: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActivityDate: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"]),

  // Gamification: user achievements
  userAchievements: defineTable({
    userId: v.string(),
    achievementId: v.string(),
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_achievement", ["userId", "achievementId"]),

  // Compliance schedules for auto-renewal
  complianceSchedules: defineTable({
    orgId: v.id("organizations"),
    courseId: v.id("courses"),
    recertificationPeriodDays: v.number(),
    autoReassign: v.boolean(),
    reminderDaysBefore: v.array(v.number()),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_course", ["orgId", "courseId"]),

  // Audit logs for compliance
  auditLogs: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    metadata: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_timestamp", ["orgId", "timestamp"])
    .index("by_user", ["userId"]),

  // Subscriptions (Stripe billing)
  subscriptions: defineTable({
    orgId: v.id("organizations"),
    userId: v.string(), // the user who owns the subscription
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    planId: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise")
    ),
    billingInterval: v.union(v.literal("monthly"), v.literal("annual")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // Usage tracking for plan limits
  usageRecords: defineTable({
    orgId: v.id("organizations"),
    metric: v.union(
      v.literal("courses_created"),
      v.literal("members_added"),
      v.literal("ai_generations"),
      v.literal("orgs_created")
    ),
    count: v.number(),
    periodStart: v.number(), // start of billing period
    periodEnd: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_metric", ["orgId", "metric"])
    .index("by_org_metric_period", ["orgId", "metric", "periodStart"]),

  // Onboarding state
  onboardingState: defineTable({
    userId: v.string(),
    currentStep: v.number(),
    completedSteps: v.array(v.string()),
    role: v.optional(v.string()), // "creator" | "learner"
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    completed: v.boolean(),
    skippedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Course templates library
  courseTemplates: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    icon: v.string(),
    thumbnail: v.optional(v.string()),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    estimatedDuration: v.optional(v.string()),
    moduleCount: v.number(),
    lessonCount: v.number(),
    tags: v.array(v.string()),
    formData: v.object({
      courseTitle: v.string(),
      courseDescription: v.string(),
      industry: v.string(),
      targetAudience: v.string(),
      difficultyLevel: v.string(),
      numModules: v.string(),
      lessonsPerModule: v.string(),
      additionalInstructions: v.string(),
    }),
    isSystem: v.boolean(),
    createdBy: v.optional(v.string()),
    orgId: v.optional(v.id("organizations")),
    usageCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_org", ["orgId"])
    .index("by_system", ["isSystem"]),

  // Media files (Convex storage)
  mediaFiles: defineTable({
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    type: v.union(v.literal("image"), v.literal("video"), v.literal("document"), v.literal("audio")),
    uploadedBy: v.string(),
    orgId: v.optional(v.id("organizations")),
    courseId: v.optional(v.id("courses")),
    createdAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_course", ["courseId"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_type", ["type"]),

  // Webhook endpoints (outgoing)
  webhookEndpoints: defineTable({
    orgId: v.id("organizations"),
    url: v.string(),
    secret: v.string(),
    events: v.array(v.string()),
    active: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_org_active", ["orgId", "active"]),

  // Webhook delivery log
  webhookDeliveries: defineTable({
    endpointId: v.id("webhookEndpoints"),
    orgId: v.id("organizations"),
    event: v.string(),
    payload: v.string(),
    statusCode: v.optional(v.number()),
    response: v.optional(v.string()),
    attempts: v.number(),
    nextRetryAt: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("delivered"), v.literal("failed")),
    createdAt: v.number(),
    deliveredAt: v.optional(v.number()),
  })
    .index("by_endpoint", ["endpointId"])
    .index("by_org", ["orgId"])
    .index("by_status", ["status"])
    .index("by_next_retry", ["status", "nextRetryAt"]),
});
