"use client";

import Link from "next/link";
import {
  Sparkles,
  Building2,
  Brain,
  BarChart3,
  Award,
  FileText,
  ArrowRight,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  Shield,
  BookOpen,
  GraduationCap,
  Check,
  Star,
  Crown,
  Clock,
  Globe2,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Generate complete training courses in minutes with advanced AI technology.",
    accent: "bg-amber-50 text-amber-700",
  },
  {
    icon: Building2,
    title: "Company Specific",
    description:
      "Tailor courses to your unique company knowledge and best practices.",
    accent: "bg-stone-100 text-stone-700",
  },
  {
    icon: Brain,
    title: "Auto Quizzes",
    description:
      "Automatically generate assessments to test learner comprehension.",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor learner progress with detailed analytics and insights.",
    accent: "bg-sky-50 text-sky-700",
  },
  {
    icon: Award,
    title: "Certificates",
    description:
      "Issue professional certificates upon course completion and mastery.",
    accent: "bg-violet-50 text-violet-700",
  },
  {
    icon: FileText,
    title: "Multi-Format",
    description: "Export courses in multiple formats for maximum compatibility.",
    accent: "bg-rose-50 text-rose-700",
  },
];

const steps = [
  {
    number: "01",
    title: "Describe Your Training Needs",
    description:
      "Tell our AI about your company, industry, and specific training requirements.",
  },
  {
    number: "02",
    title: "AI Generates Your Course",
    description:
      "Watch as CourseForge AI creates comprehensive, engaging training content.",
  },
  {
    number: "03",
    title: "Publish & Track Progress",
    description: "Deploy your course to teams and monitor learning outcomes.",
  },
];

const useCases = [
  {
    icon: Users,
    title: "Employee Onboarding",
    description: "Get new hires up to speed in days, not weeks. Create role-specific onboarding courses that cover company culture, processes, and tools.",
    stat: "60% faster",
    statLabel: "onboarding time",
  },
  {
    icon: Shield,
    title: "Compliance Training",
    description: "Stay compliant with automated recertification tracking. GDPR, HIPAA, OSHA, and more with audit-ready certificates.",
    stat: "100%",
    statLabel: "audit-ready",
  },
  {
    icon: BookOpen,
    title: "Product Training",
    description: "Keep your team current on product features and updates. Auto-generate courses from your product docs and knowledge base.",
    stat: "3x faster",
    statLabel: "knowledge transfer",
  },
  {
    icon: GraduationCap,
    title: "Customer Education",
    description: "Reduce support tickets by educating customers. Build self-service courses that scale with your customer base.",
    stat: "40% fewer",
    statLabel: "support tickets",
  },
];

const testimonials = [
  {
    quote: "CourseForge cut our training development time from weeks to hours. The AI-generated content is surprisingly high quality and our team loves it.",
    name: "Sarah Chen",
    role: "Head of L&D",
    company: "TechFlow Inc.",
    rating: 5,
  },
  {
    quote: "We needed compliance training fast. CourseForge generated GDPR and Health & Safety courses that our legal team approved with minimal edits.",
    name: "James Morton",
    role: "Operations Director",
    company: "Apex Solutions",
    rating: 5,
  },
  {
    quote: "The progress tracking and analytics give us real visibility into who's completing training. It's been a game-changer for our distributed team.",
    name: "Maria Rodriguez",
    role: "HR Manager",
    company: "GreenLeaf Co.",
    rating: 5,
  },
];

const comparisonRows = [
  { feature: "Course creation time", traditional: "2-4 weeks", courseforge: "Under 5 minutes" },
  { feature: "Cost per course", traditional: "$5,000-$20,000", courseforge: "Included in plan" },
  { feature: "Subject matter expert required", traditional: "Always", courseforge: "Optional" },
  { feature: "Quiz generation", traditional: "Manual", courseforge: "Automatic" },
  { feature: "Updates & revisions", traditional: "Days", courseforge: "Instant with AI" },
  { feature: "Compliance tracking", traditional: "Spreadsheets", courseforge: "Built-in automation" },
];

const pricingPreview = [
  { name: "Free", price: "$0", description: "For individuals", features: ["1 user", "2 courses", "AI generation"] },
  { name: "Starter", price: "$29", description: "For small teams", features: ["10 users", "20 courses", "Analytics"], highlight: false },
  { name: "Professional", price: "$79", description: "For growing teams", features: ["50 users", "Unlimited courses", "SSO & SCORM"], highlight: true },
];

const faqs = [
  { q: "How does AI course generation work?", a: "Simply describe your training topic, company context, target audience, and difficulty level. Our AI (powered by Google Gemini) generates a complete course with modules, lessons, quizzes, and a final exam in minutes." },
  { q: "Can I edit the AI-generated content?", a: "Absolutely. Every lesson, quiz question, and module can be fully edited after generation. The AI gives you a comprehensive starting point that you can customize to perfection." },
  { q: "Is my company data secure?", a: "Yes. We use Clerk for enterprise-grade authentication, all data is encrypted, and we support SSO/SAML for organizations. Your content is stored securely and never shared." },
  { q: "What compliance standards do you support?", a: "We include templates for GDPR, HIPAA, OSHA, Health & Safety, Anti-Bribery, EDI, and more. Courses include automatic certificate issuance and audit-ready compliance tracking." },
  { q: "Can I integrate with my existing LMS?", a: "Yes. Professional plans include SCORM export, allowing you to package courses for import into any SCORM-compatible LMS like Moodle, Cornerstone, or SAP SuccessFactors." },
  { q: "How much does it cost?", a: "We offer a free plan to get started, with paid plans from $29/month. Annual billing saves 20%. Enterprise pricing is available for larger organizations." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-cream">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 w-full z-50 bg-cream/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-charcoal text-gold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-serif text-xl text-charcoal">CourseForge</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
                Pricing
              </Link>
              <Link href="#features" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
                Features
              </Link>
              <Link href="#use-cases" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
                Use Cases
              </Link>
              <Link href="#faq" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-charcoal/70 hover:text-charcoal text-sm font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-charcoal hover:bg-charcoal-light text-cream text-sm font-medium px-5 rounded-lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 hero-glow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute inset-0 diagonal-stripe" />

        <div className="relative z-10 container mx-auto px-6 py-24 max-w-4xl">
          <div className="text-center space-y-8">
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-charcoal/[0.04] border border-charcoal/[0.08] text-warm-gray text-sm font-medium">
              <Zap className="w-3.5 h-3.5 text-gold" />
              Powered by Advanced AI
            </div>

            <h1 className="animate-fade-up delay-100 text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-charcoal leading-[0.95]">
              Build courses{" "}
              <span className="font-serif italic text-gold">beautifully</span>
            </h1>

            <p className="animate-fade-up delay-200 text-lg md:text-xl text-warm-gray max-w-xl mx-auto leading-relaxed font-light">
              Transform company knowledge into professional training courses in
              minutes. AI-powered, company-specific, instantly deployable.
            </p>

            <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-charcoal hover:bg-charcoal-light text-cream px-8 py-6 text-base rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-charcoal/10"
                >
                  Start Creating Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-base border-2 border-charcoal/15 hover:bg-charcoal/[0.03] hover:border-charcoal/25 rounded-xl font-medium text-charcoal"
                >
                  View Pricing
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up delay-400 pt-12 flex items-center justify-center gap-8 md:gap-12 text-sm">
              <div className="text-center">
                <div className="text-2xl font-semibold text-charcoal">500+</div>
                <div className="text-warm-gray-light mt-0.5">Courses Created</div>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="text-center">
                <div className="text-2xl font-semibold text-charcoal">10k+</div>
                <div className="text-warm-gray-light mt-0.5">Learners Trained</div>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="text-center">
                <div className="text-2xl font-semibold text-charcoal">98%</div>
                <div className="text-warm-gray-light mt-0.5">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Bar ─── */}
      <section className="py-12 px-6 bg-[var(--card)] border-y border-charcoal/5">
        <div className="container mx-auto max-w-6xl">
          <p className="text-center text-sm text-warm-gray-light uppercase tracking-widest mb-8">
            Trusted by teams at leading companies
          </p>
          <div className="flex items-center justify-center gap-12 md:gap-16 flex-wrap opacity-40">
            {["TechFlow", "Apex Solutions", "GreenLeaf", "NovaBridge", "PulseMedia", "CoreStar"].map((company) => (
              <div key={company} className="text-lg font-semibold text-charcoal">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gold Divider ─── */}
      <div className="gold-line" />

      {/* ─── Features Section ─── */}
      <section id="features" className="py-24 md:py-32 px-6 bg-[var(--card)] relative scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16 md:mb-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Capabilities
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight leading-tight">
              Everything you need to create{" "}
              <span className="font-serif italic">world-class</span> training
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card-premium group rounded-xl bg-[var(--card)] p-7"
                >
                  <div
                    className={`inline-flex items-center justify-center h-11 w-11 rounded-lg ${feature.accent} mb-5 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-charcoal mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-warm-gray leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Use Cases Section ─── */}
      <section id="use-cases" className="py-24 md:py-32 px-6 bg-cream relative scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Use Cases
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Built for every{" "}
              <span className="font-serif italic">training need</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardContent className="p-7">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-charcoal mb-2">
                          {useCase.title}
                        </h3>
                        <p className="text-sm text-warm-gray leading-relaxed mb-4">
                          {useCase.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold text-charcoal">{useCase.stat}</span>
                          <span className="text-sm text-warm-gray">{useCase.statLabel}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works Section ─── */}
      <section className="py-24 md:py-32 px-6 bg-[var(--card)] relative overflow-hidden">
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gold/[0.04] blur-3xl" />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Process
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Three steps to{" "}
              <span className="font-serif italic">brilliance</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center md:text-left">
                <div className="font-serif text-6xl md:text-7xl text-gold/20 mb-4 leading-none">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-charcoal mb-3">
                  {step.title}
                </h3>
                <p className="text-warm-gray leading-relaxed">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-6 top-10">
                    <ChevronRight className="w-5 h-5 text-warm-gray-light" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Section ─── */}
      <section className="py-24 md:py-32 px-6 bg-cream">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Why CourseForge
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Traditional LMS vs.{" "}
              <span className="font-serif italic">CourseForge AI</span>
            </h2>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cream-dark">
                    <th className="text-left p-4 text-sm font-semibold text-charcoal">Feature</th>
                    <th className="text-center p-4 text-sm font-semibold text-warm-gray">Traditional</th>
                    <th className="text-center p-4 text-sm font-semibold text-gold">CourseForge AI</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-cream/50" : "bg-[var(--card)]"}>
                      <td className="p-4 text-sm text-charcoal">{row.feature}</td>
                      <td className="p-4 text-sm text-warm-gray text-center">{row.traditional}</td>
                      <td className="p-4 text-sm text-charcoal text-center font-medium">{row.courseforge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="py-24 md:py-32 px-6 bg-[var(--card)]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Loved by teams{" "}
              <span className="font-serif italic">everywhere</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-7">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-charcoal leading-relaxed mb-6 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-charcoal/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-charcoal">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-charcoal">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-warm-gray">
                        {testimonial.role}, {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ─── */}
      <section className="py-24 md:py-32 px-6 bg-cream">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              Pricing
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Simple, transparent{" "}
              <span className="font-serif italic">pricing</span>
            </h2>
            <p className="text-warm-gray mt-4 text-lg">
              Start free, upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricingPreview.map((plan) => (
              <Card
                key={plan.name}
                className={`overflow-hidden ${plan.highlight ? "ring-2 ring-gold shadow-lg" : ""}`}
              >
                {plan.highlight && (
                  <div className="h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
                )}
                <CardContent className="p-7 text-center">
                  {plan.highlight && (
                    <Badge className="bg-gold/10 text-gold border-gold/20 text-xs mb-3">
                      Most Popular
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-charcoal">{plan.name}</h3>
                  <p className="text-sm text-warm-gray mb-4">{plan.description}</p>
                  <div className="text-4xl font-light text-charcoal mb-1">
                    {plan.price}
                  </div>
                  {plan.price !== "$0" && (
                    <span className="text-sm text-warm-gray">/month</span>
                  )}
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center justify-center gap-2 text-sm text-charcoal">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="outline" className="border-charcoal/20 text-charcoal">
                View All Plans & Compare
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="py-24 md:py-32 px-6 bg-[var(--card)] scroll-mt-20">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-4">
              FAQ
            </p>
            <h2 className="text-3xl md:text-5xl font-light text-charcoal tracking-tight">
              Common{" "}
              <span className="font-serif italic">questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                className="cursor-pointer"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-charcoal pr-4">{faq.q}</h3>
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
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 md:py-32 px-6 bg-charcoal relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/[0.06] blur-3xl rounded-full" />

        <div className="container mx-auto max-w-2xl text-center relative z-10">
          <div className="animate-float inline-block mb-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gold/10 mx-auto">
              <Sparkles className="w-8 h-8 text-gold" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-cream tracking-tight mb-6 leading-tight">
            Ready to transform{" "}
            <span className="font-serif italic text-gold">your training?</span>
          </h2>
          <p className="text-lg text-cream/60 mb-10 font-light">
            Join companies worldwide building exceptional training programs with
            CourseForge AI. Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-gold hover:bg-gold-dark text-charcoal px-10 py-6 text-base rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-gold/20"
              >
                Start Creating Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-cream/20 text-cream hover:bg-cream/10 px-8 py-6 text-base rounded-xl"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-charcoal border-t border-white/5 py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex items-center justify-center h-7 w-7 rounded-md bg-gold/10">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                </div>
                <span className="font-serif text-lg text-cream/80">CourseForge</span>
              </div>
              <p className="text-cream/40 text-sm leading-relaxed">
                AI-powered training course generation for modern teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-cream/70 mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2.5">
                <li><Link href="/pricing" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Pricing</Link></li>
                <li><Link href="#features" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Features</Link></li>
                <li><Link href="#use-cases" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Use Cases</Link></li>
                <li><Link href="/sign-up" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Get Started</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-cream/70 mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5">
                <li><Link href="/terms" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Privacy Policy</Link></li>
                <li><Link href="mailto:support@courseforge.ai" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-cream/70 mb-4 uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5">
                <li><Link href="mailto:support@courseforge.ai" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Help Center</Link></li>
                <li><Link href="mailto:support@courseforge.ai" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">Email Support</Link></li>
                <li><Link href="#faq" className="text-sm text-cream/40 hover:text-cream/70 transition-colors">FAQ</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-cream/30 text-sm">
              &copy; {new Date().getFullYear()} CourseForge AI. All rights reserved.
            </p>
            <p className="text-cream/30 text-sm">
              Built with AI, designed for teams.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
