export type PlanId = "free" | "starter" | "professional" | "enterprise";

export interface PlanLimits {
  maxUsers: number;
  maxCourses: number;
  maxOrgs: number;
  aiGenerationsPerMonth: number;
  ssoEnabled: boolean;
  analyticsEnabled: boolean;
  prioritySupport: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  scormExport: boolean;
  webhooks: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  annualPrice: number; // in cents (per month, billed annually)
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  limits: PlanLimits;
  popular?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with AI-powered course creation",
    monthlyPrice: 0,
    annualPrice: 0,
    stripePriceIdMonthly: "",
    stripePriceIdAnnual: "",
    limits: {
      maxUsers: 1,
      maxCourses: 2,
      maxOrgs: 1,
      aiGenerationsPerMonth: 5,
      ssoEnabled: false,
      analyticsEnabled: false,
      prioritySupport: false,
      customDomain: false,
      apiAccess: false,
      scormExport: false,
      webhooks: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started with training",
    monthlyPrice: 2900, // $29
    annualPrice: 2320, // $23.20 (20% discount)
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || "",
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || "",
    limits: {
      maxUsers: 10,
      maxCourses: 20,
      maxOrgs: 5,
      aiGenerationsPerMonth: 50,
      ssoEnabled: false,
      analyticsEnabled: true,
      prioritySupport: false,
      customDomain: false,
      apiAccess: false,
      scormExport: false,
      webhooks: false,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing teams that need full power",
    monthlyPrice: 7900, // $79
    annualPrice: 6320, // $63.20 (20% discount)
    stripePriceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "",
    stripePriceIdAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || "",
    limits: {
      maxUsers: 50,
      maxCourses: -1, // unlimited
      maxOrgs: -1,
      aiGenerationsPerMonth: -1,
      ssoEnabled: true,
      analyticsEnabled: true,
      prioritySupport: true,
      customDomain: false,
      apiAccess: true,
      scormExport: true,
      webhooks: true,
    },
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    monthlyPrice: -1, // custom
    annualPrice: -1,
    stripePriceIdMonthly: "",
    stripePriceIdAnnual: "",
    limits: {
      maxUsers: -1,
      maxCourses: -1,
      maxOrgs: -1,
      aiGenerationsPerMonth: -1,
      ssoEnabled: true,
      analyticsEnabled: true,
      prioritySupport: true,
      customDomain: true,
      apiAccess: true,
      scormExport: true,
      webhooks: true,
    },
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "professional", "enterprise"];

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  if (cents === -1) return "Custom";
  return `$${(cents / 100).toFixed(0)}`;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true; // unlimited
  return current < limit;
}
