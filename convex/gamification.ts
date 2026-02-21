import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Achievement definitions
const ACHIEVEMENTS = [
  { id: "first_lesson", name: "First Steps", description: "Complete your first lesson", icon: "footprints", points: 10, tier: "bronze" },
  { id: "first_course", name: "Course Graduate", description: "Complete your first course", icon: "graduation-cap", points: 100, tier: "bronze" },
  { id: "perfect_score", name: "Perfect Score", description: "Score 100% on any quiz", icon: "star", points: 50, tier: "silver" },
  { id: "five_courses", name: "Knowledge Seeker", description: "Complete 5 courses", icon: "book-open", points: 200, tier: "silver" },
  { id: "streak_7", name: "Streak Master", description: "Maintain a 7-day learning streak", icon: "flame", points: 75, tier: "silver" },
  { id: "streak_30", name: "Unstoppable", description: "Maintain a 30-day learning streak", icon: "zap", points: 300, tier: "gold" },
  { id: "ten_courses", name: "Scholar", description: "Complete 10 courses", icon: "award", points: 500, tier: "gold" },
  { id: "speed_learner", name: "Speed Learner", description: "Complete a course in under 2 hours", icon: "rocket", points: 100, tier: "silver" },
] as const;

// Get user's points and stats
export const getUserStats = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const points = await ctx.db
      .query("userPoints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const achievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return {
      totalPoints: points?.totalPoints ?? 0,
      currentStreak: points?.currentStreak ?? 0,
      longestStreak: points?.longestStreak ?? 0,
      lastActivityDate: points?.lastActivityDate,
      achievements: achievements.map((a) => ({
        ...a,
        definition: ACHIEVEMENTS.find((d) => d.id === a.achievementId),
      })),
      allAchievements: ACHIEVEMENTS.map((def) => ({
        ...def,
        earned: achievements.some((a) => a.achievementId === def.id),
        earnedAt: achievements.find((a) => a.achievementId === def.id)?.earnedAt,
      })),
    };
  },
});

// Get leaderboard for an org
export const getLeaderboard = query({
  args: {
    orgId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
      .collect();

    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const points = await ctx.db
          .query("userPoints")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .first();

        const achievements = await ctx.db
          .query("userAchievements")
          .withIndex("by_user", (q) => q.eq("userId", member.userId))
          .collect();

        return {
          userId: member.userId,
          name: member.name ?? member.email,
          email: member.email,
          totalPoints: points?.totalPoints ?? 0,
          currentStreak: points?.currentStreak ?? 0,
          achievementCount: achievements.length,
        };
      })
    );

    return leaderboard
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  },
});

// Award points to a user
export const awardPoints = mutation({
  args: {
    userId: v.string(),
    points: v.number(),
    orgId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userPoints")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    if (existing) {
      const lastDate = existing.lastActivityDate
        ? new Date(existing.lastActivityDate)
        : null;
      lastDate?.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let newStreak = existing.currentStreak;
      if (lastDate && lastDate.getTime() === yesterday.getTime()) {
        newStreak = existing.currentStreak + 1;
      } else if (!lastDate || lastDate.getTime() < yesterday.getTime()) {
        newStreak = 1;
      }
      // Same day = no change to streak

      await ctx.db.patch(existing._id, {
        totalPoints: existing.totalPoints + args.points,
        currentStreak: newStreak,
        longestStreak: Math.max(existing.longestStreak, newStreak),
        lastActivityDate: todayTimestamp,
      });
    } else {
      await ctx.db.insert("userPoints", {
        userId: args.userId,
        orgId: args.orgId,
        totalPoints: args.points,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: todayTimestamp,
      });
    }
  },
});

// Check and award achievements
export const checkAchievements = mutation({
  args: {
    userId: v.string(),
    event: v.union(
      v.literal("lesson_completed"),
      v.literal("course_completed"),
      v.literal("quiz_perfect"),
      v.literal("streak_update")
    ),
  },
  handler: async (ctx, args) => {
    const earnedIds = new Set(
      (await ctx.db
        .query("userAchievements")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect()
      ).map((a) => a.achievementId)
    );

    const newAchievements: string[] = [];

    // Check lesson-based achievements
    if (args.event === "lesson_completed") {
      const allProgress = await ctx.db
        .query("userProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const totalLessonsCompleted = allProgress.reduce(
        (sum, p) => sum + (p.completedLessons?.length ?? 0),
        0
      );

      if (totalLessonsCompleted >= 1 && !earnedIds.has("first_lesson")) {
        newAchievements.push("first_lesson");
      }
    }

    // Check course-based achievements
    if (args.event === "course_completed") {
      const completedCourses = await ctx.db
        .query("userProgress")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

      const doneCount = completedCourses.filter((p) => p.completedAt).length;

      if (doneCount >= 1 && !earnedIds.has("first_course")) {
        newAchievements.push("first_course");
      }
      if (doneCount >= 5 && !earnedIds.has("five_courses")) {
        newAchievements.push("five_courses");
      }
      if (doneCount >= 10 && !earnedIds.has("ten_courses")) {
        newAchievements.push("ten_courses");
      }
    }

    // Check quiz-based achievements
    if (args.event === "quiz_perfect" && !earnedIds.has("perfect_score")) {
      newAchievements.push("perfect_score");
    }

    // Check streak-based achievements
    if (args.event === "streak_update") {
      const points = await ctx.db
        .query("userPoints")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .first();

      const streak = points?.currentStreak ?? 0;
      if (streak >= 7 && !earnedIds.has("streak_7")) {
        newAchievements.push("streak_7");
      }
      if (streak >= 30 && !earnedIds.has("streak_30")) {
        newAchievements.push("streak_30");
      }
    }

    // Award new achievements
    for (const achievementId of newAchievements) {
      await ctx.db.insert("userAchievements", {
        userId: args.userId,
        achievementId,
        earnedAt: Date.now(),
      });

      // Award bonus points for achievements
      const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
      if (def) {
        const existing = await ctx.db
          .query("userPoints")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .first();
        if (existing) {
          await ctx.db.patch(existing._id, {
            totalPoints: existing.totalPoints + def.points,
          });
        }
      }
    }

    return newAchievements;
  },
});
