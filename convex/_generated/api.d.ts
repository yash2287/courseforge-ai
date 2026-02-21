/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as certificates from "../certificates.js";
import type * as chat from "../chat.js";
import type * as complianceSchedules from "../complianceSchedules.js";
import type * as courseAssignments from "../courseAssignments.js";
import type * as courseReviews from "../courseReviews.js";
import type * as courseTemplates from "../courseTemplates.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as departments from "../departments.js";
import type * as emails from "../emails.js";
import type * as gamification from "../gamification.js";
import type * as learningPaths from "../learningPaths.js";
import type * as lessons from "../lessons.js";
import type * as mediaFiles from "../mediaFiles.js";
import type * as modules from "../modules.js";
import type * as notificationPreferences from "../notificationPreferences.js";
import type * as notifications from "../notifications.js";
import type * as onboarding from "../onboarding.js";
import type * as orgInvites from "../orgInvites.js";
import type * as orgMembers from "../orgMembers.js";
import type * as organizations from "../organizations.js";
import type * as progress from "../progress.js";
import type * as quizzes from "../quizzes.js";
import type * as sso from "../sso.js";
import type * as subscriptions from "../subscriptions.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  certificates: typeof certificates;
  chat: typeof chat;
  complianceSchedules: typeof complianceSchedules;
  courseAssignments: typeof courseAssignments;
  courseReviews: typeof courseReviews;
  courseTemplates: typeof courseTemplates;
  courses: typeof courses;
  crons: typeof crons;
  departments: typeof departments;
  emails: typeof emails;
  gamification: typeof gamification;
  learningPaths: typeof learningPaths;
  lessons: typeof lessons;
  mediaFiles: typeof mediaFiles;
  modules: typeof modules;
  notificationPreferences: typeof notificationPreferences;
  notifications: typeof notifications;
  onboarding: typeof onboarding;
  orgInvites: typeof orgInvites;
  orgMembers: typeof orgMembers;
  organizations: typeof organizations;
  progress: typeof progress;
  quizzes: typeof quizzes;
  sso: typeof sso;
  subscriptions: typeof subscriptions;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
