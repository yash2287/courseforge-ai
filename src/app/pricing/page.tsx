"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building2,
  Zap,
  Crown,
  Shield,
} from "lucide-react";
import { PLANS, PLAN_ORDER, formatPrice, type PlanId } from "@/lib/plans";

const planIcons: Record<PlanId, React.ElementType> = {
  free: Zap,
  starter: Sparkles,
  professional: Crown,
  enterprise: Building2,
};

const planAccents: Record<PlanId, string> = {
  free: "border-warm-gray-light/30",
  starter: "border-sky-200",
  professional: "border-gold",
  enterprise: "border-charcoal/20",
};

const featureComparison = [
  { name: "AI Course Generation", free: true, starter: true, professional: true, enterprise: true },
  { name: "Auto Quiz Generation", free: true, starter: true, professional: true, enterprise: true },
  { name: "AI Chat Assistant", free: true, starter: true, professional: true, enterprise: true },
  { name: "Certificates", free: true, starter: true, professional: true, enterprise: true },
  { name: "Progress Tracking", free: true, starter: true, professional: true, enterprise: true },
  { name: "Team Members", free: "1", starter: "10", professional: "50", enterprise: "Unlimited" },
  { name: "Courses", free: "2", starter: "20", professional: "Unlimited", enterprise: "Unlimited" },
  { name: "Organizations", free: "1", starter: "5", professional: "Unlimited", enterprise: "Unlimited" },
  { name: "AI Generations / Month", free: "5", starter: "50", professional: "Unlimited", enterprise: "Unlimited" },
  { name: "Advanced Analytics", free: false, starter: true, professional: true, enterprise: true },
  { name: "Learning Paths", free: false, starter: true, professional: true, enterprise: true },
  { name: "Course Assignments", free: false, starter: true, professional: true, enterprise: true },
  { name: "Email Notifications", free: false, starter: true, professional: true, enterprise: true },
  { name: "SCORM Export", free: false, starter: false, professional: true, enterprise: true },
  { name: "SSO / SAML", free: false, starter: false, professional: true, enterprise: true },
  { name: "Priority Support", free: false, starter: false, professional: true, enterprise: true },
  { name: "API Access", free: false, starter: false, professional: true, enterprise: true },
  { name: "Webhooks", free: false, starter: false, professional: true, enterprise: true },
  { name: "Custom Domain", free: false, starter: false, professional: false, enterprise: true },
  { name: "Dedicated Support", free: false, starter: false, professional: false, enterprise: true },
  { name: "SLA Guarantee", free: false, starter: false, professional: false, enterprise: true },
];

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing period.",
  },
  {
    q: "What happens when I hit my plan limits?",
    a: "You'll receive a notification when approaching your limits. Once reached, you'll need to upgrade to continue creating courses or adding team members. Existing content remains accessible.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan lets you explore CourseForge with no time limit. You can upgrade to a paid plan whenever you're ready - no credit card required to start.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processing. Annual plans are available for a 20% discount.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact support for a full refund - no questions asked.",
  },
  {
    q: "Do you offer discounts for nonprofits or education?",
    a: "Yes! We offer special pricing for nonprofits, educational institutions, and startups. Contact our sales team for details.",
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-charcoal/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-charcoal rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <span className="text-xl font-semibold text-charcoal">
              CourseForge
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-charcoal">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-charcoal text-cream hover:bg-charcoal-light">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <div className="text-center pt-16 pb-12">
          <Badge className="bg-gold/10 text-gold border-gold/20 mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-light text-charcoal mb-4">
            Choose the plan that{" "}
            <span className="font-serif italic">fits your team</span>
          </h1>
          <p className="text-lg text-warm-gray max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include AI-powered
            course generation, quizzes, and certificates.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <span
              className={`text-sm ${!isAnnual ? "text-charcoal font-semibold" : "text-warm-gray"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? "bg-gold" : "bg-charcoal/20"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-[var(--card)] shadow-sm transition-transform ${
                  isAnnual ? "translate-x-7" : "translate-x-0.5"
                }`}
              />
            </button>
            <span
              className={`text-sm ${isAnnual ? "text-charcoal font-semibold" : "text-warm-gray"}`}
            >
              Annual
            </span>
            {isAnnual && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-16">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            const Icon = planIcons[planId];
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isPopular = plan.popular;
            const isEnterprise = planId === "enterprise";

            return (
              <Card
                key={planId}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${planAccents[planId]} ${
                  isPopular ? "ring-2 ring-gold shadow-lg scale-[1.02]" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
                )}
                <CardContent className="p-6">
                  {isPopular && (
                    <Badge className="bg-gold/10 text-gold border-gold/20 text-xs mb-4">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                        isPopular
                          ? "bg-gold/10"
                          : "bg-charcoal/5"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isPopular ? "text-gold" : "text-charcoal"}`}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal">
                      {plan.name}
                    </h3>
                  </div>

                  <p className="text-sm text-warm-gray mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    {isEnterprise ? (
                      <div className="text-3xl font-light text-charcoal">
                        Custom
                      </div>
                    ) : (
                      <>
                        <span className="text-3xl font-light text-charcoal">
                          {formatPrice(price)}
                        </span>
                        {price > 0 && (
                          <span className="text-warm-gray text-sm">/month</span>
                        )}
                        {isAnnual && price > 0 && (
                          <div className="text-xs text-warm-gray mt-1">
                            Billed annually (
                            {formatPrice(price * 12)}/year)
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isEnterprise ? (
                    <Link href="mailto:sales@courseforge.ai">
                      <Button
                        variant="outline"
                        className="w-full border-charcoal/20"
                      >
                        Contact Sales
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : planId === "free" ? (
                    <Link href="/sign-up">
                      <Button
                        variant="outline"
                        className="w-full border-charcoal/20"
                      >
                        Get Started Free
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/sign-up">
                      <Button
                        className={`w-full ${
                          isPopular
                            ? "bg-gold hover:bg-gold-dark text-charcoal"
                            : "bg-charcoal text-cream hover:bg-charcoal-light"
                        }`}
                      >
                        Start {plan.name}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}

                  {/* Key features */}
                  <ul className="mt-6 space-y-2.5">
                    <li className="text-xs text-warm-gray font-semibold uppercase tracking-wider mb-1">
                      Includes:
                    </li>
                    {planId === "free" && (
                      <>
                        <FeatureItem>1 team member</FeatureItem>
                        <FeatureItem>2 courses</FeatureItem>
                        <FeatureItem>5 AI generations/mo</FeatureItem>
                        <FeatureItem>Quizzes & certificates</FeatureItem>
                      </>
                    )}
                    {planId === "starter" && (
                      <>
                        <FeatureItem>Up to 10 team members</FeatureItem>
                        <FeatureItem>20 courses</FeatureItem>
                        <FeatureItem>50 AI generations/mo</FeatureItem>
                        <FeatureItem>Analytics & learning paths</FeatureItem>
                        <FeatureItem>Email notifications</FeatureItem>
                      </>
                    )}
                    {planId === "professional" && (
                      <>
                        <FeatureItem>Up to 50 team members</FeatureItem>
                        <FeatureItem>Unlimited courses</FeatureItem>
                        <FeatureItem>Unlimited AI generations</FeatureItem>
                        <FeatureItem>SSO / SAML</FeatureItem>
                        <FeatureItem>SCORM export</FeatureItem>
                        <FeatureItem>API & webhooks</FeatureItem>
                        <FeatureItem>Priority support</FeatureItem>
                      </>
                    )}
                    {planId === "enterprise" && (
                      <>
                        <FeatureItem>Unlimited everything</FeatureItem>
                        <FeatureItem>Custom domain</FeatureItem>
                        <FeatureItem>Dedicated support</FeatureItem>
                        <FeatureItem>SLA guarantee</FeatureItem>
                        <FeatureItem>Custom integrations</FeatureItem>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Toggle */}
        <div className="text-center pb-8">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center gap-2 text-charcoal hover:text-gold transition-colors font-medium"
          >
            {showComparison ? "Hide" : "Show"} full feature comparison
            {showComparison ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Feature Comparison Table */}
        {showComparison && (
          <div className="pb-16 overflow-x-auto">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cream-dark">
                      <th className="text-left p-4 text-sm font-semibold text-charcoal">
                        Feature
                      </th>
                      {PLAN_ORDER.map((planId) => (
                        <th
                          key={planId}
                          className="text-center p-4 text-sm font-semibold text-charcoal"
                        >
                          {PLANS[planId].name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparison.map((feature, i) => (
                      <tr
                        key={feature.name}
                        className={
                          i % 2 === 0 ? "bg-cream/50" : "bg-[var(--card)]"
                        }
                      >
                        <td className="p-4 text-sm text-charcoal">
                          {feature.name}
                        </td>
                        {(["free", "starter", "professional", "enterprise"] as const).map(
                          (planId) => {
                            const val = feature[planId];
                            return (
                              <td
                                key={planId}
                                className="text-center p-4"
                              >
                                {val === true ? (
                                  <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                                ) : val === false ? (
                                  <X className="h-4 w-4 text-warm-gray-light mx-auto" />
                                ) : (
                                  <span className="text-sm text-charcoal">
                                    {val}
                                  </span>
                                )}
                              </td>
                            );
                          }
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pb-24">
          <h2 className="text-3xl font-light text-charcoal text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                className="cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-charcoal">{faq.q}</h3>
                    {openFaq === i ? (
                      <ChevronUp className="h-4 w-4 text-warm-gray flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-warm-gray flex-shrink-0" />
                    )}
                  </div>
                  {openFaq === i && (
                    <p className="mt-3 text-warm-gray text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pb-16">
          <Card className="bg-charcoal text-cream overflow-hidden">
            <CardContent className="p-12">
              <div className="h-1 w-16 bg-gold mx-auto mb-6" />
              <h2 className="text-3xl font-light mb-4">
                Ready to transform your training?
              </h2>
              <p className="text-cream/70 mb-8 max-w-lg mx-auto">
                Join hundreds of companies using CourseForge to create
                AI-powered training courses in minutes.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/sign-up">
                  <Button className="bg-gold hover:bg-gold-dark text-charcoal px-8">
                    Start Free Today
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="mailto:sales@courseforge.ai">
                  <Button
                    variant="outline"
                    className="border-cream/20 text-cream hover:bg-cream/10"
                  >
                    Talk to Sales
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-charcoal">
      <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
      {children}
    </li>
  );
}
