import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check deadlines daily at 8:00 AM UTC and send reminders
crons.daily(
  "check-deadlines",
  { hourUTC: 8, minuteUTC: 0 },
  internal.emails.checkDeadlinesAndNotify,
  {}
);

// Send weekly digest every Monday at 9:00 AM UTC
crons.weekly(
  "weekly-digest",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.emails.sendWeeklyDigests,
  {}
);

// Retry failed webhook deliveries every 5 minutes
crons.interval(
  "retry-webhooks",
  { minutes: 5 },
  internal.webhooks.retryPending,
  {}
);

export default crons;
