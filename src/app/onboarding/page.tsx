'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Building2,
  Users,
  Loader2,
  Check,
  SkipForward,
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'role', title: 'Your Role' },
  { id: 'company', title: 'Company Details' },
  { id: 'ready', title: 'Get Started' },
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
  'Manufacturing', 'Professional Services', 'Hospitality', 'Construction', 'Other',
];

const companySizes = [
  '1-10', '11-50', '51-200', '201-500', '500+',
];

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const updateOnboarding = useMutation(api.onboarding.createOrUpdate);
  const skipOnboarding = useMutation(api.onboarding.skip);
  const onboardingState = useQuery(api.onboarding.getState);

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already completed
  if (onboardingState?.completed) {
    router.push('/dashboard');
    return null;
  }

  const handleNext = async () => {
    const completedSteps = STEPS.slice(0, step + 1).map((s) => s.id);
    await updateOnboarding({
      currentStep: step + 1,
      completedSteps,
      role: role || undefined,
      companyName: companyName || undefined,
      companySize: companySize || undefined,
      industry: industry || undefined,
    });
    setStep(step + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    await updateOnboarding({
      currentStep: 3,
      completedSteps: STEPS.map((s) => s.id),
      role: role || undefined,
      companyName: companyName || undefined,
      companySize: companySize || undefined,
      industry: industry || undefined,
      completed: true,
    });
    router.push('/dashboard');
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 bg-charcoal rounded-xl flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <span className="font-serif text-2xl text-charcoal">CourseForge</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-8 bg-gold'
                  : i < step
                    ? 'w-2 bg-gold/40'
                    : 'w-2 bg-charcoal/10'
              }`}
            />
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
          <CardContent className="p-8">
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center space-y-6">
                <div className="h-16 w-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-light text-charcoal mb-2">
                    Welcome, {user?.firstName || 'there'}!
                  </h1>
                  <p className="text-warm-gray">
                    Let&apos;s set up your account so you can start creating amazing training courses.
                  </p>
                </div>
                <Button
                  onClick={handleNext}
                  className="bg-charcoal hover:bg-charcoal-light text-cream w-full py-6"
                >
                  Let&apos;s Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-light text-charcoal mb-2">
                    What brings you here?
                  </h2>
                  <p className="text-warm-gray">
                    This helps us personalize your experience.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[
                    {
                      id: 'creator',
                      icon: BookOpen,
                      title: 'Creating Training',
                      description: 'I want to build courses for my team',
                    },
                    {
                      id: 'learner',
                      icon: GraduationCap,
                      title: 'Taking Courses',
                      description: 'I was invited to complete training',
                    },
                    {
                      id: 'both',
                      icon: Users,
                      title: 'Both',
                      description: 'I create and take training courses',
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setRole(option.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          role === option.id
                            ? 'border-gold bg-gold/5'
                            : 'border-charcoal/10 hover:border-charcoal/20'
                        }`}
                      >
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            role === option.id
                              ? 'bg-gold/10'
                              : 'bg-charcoal/5'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              role === option.id ? 'text-gold' : 'text-charcoal/50'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-charcoal">{option.title}</div>
                          <div className="text-sm text-warm-gray">{option.description}</div>
                        </div>
                        {role === option.id && (
                          <Check className="h-5 w-5 text-gold ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(0)}
                    className="border-charcoal/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!role}
                    className="bg-charcoal hover:bg-charcoal-light text-cream flex-1"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Company Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-light text-charcoal mb-2">
                    Tell us about your company
                  </h2>
                  <p className="text-warm-gray">
                    We&apos;ll use this to customize your courses.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-charcoal">Company Name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-charcoal">Industry</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {industries.map((ind) => (
                        <button
                          key={ind}
                          onClick={() => setIndustry(ind)}
                          className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                            industry === ind
                              ? 'border-gold bg-gold/5 text-charcoal'
                              : 'border-charcoal/10 text-warm-gray hover:border-charcoal/20'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-charcoal">Company Size</Label>
                    <div className="flex gap-2 mt-1">
                      {companySizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setCompanySize(size)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${
                            companySize === size
                              ? 'border-gold bg-gold/5 text-charcoal'
                              : 'border-charcoal/10 text-warm-gray hover:border-charcoal/20'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-charcoal/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="bg-charcoal hover:bg-charcoal-light text-cream flex-1"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Ready */}
            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-charcoal mb-2">
                    You&apos;re all set!
                  </h2>
                  <p className="text-warm-gray">
                    {role === 'learner'
                      ? "Head to your dashboard to find your assigned courses."
                      : "Create your first AI-powered training course in minutes."}
                  </p>
                </div>

                <div className="space-y-3">
                  {role !== 'learner' && (
                    <Button
                      onClick={async () => {
                        setLoading(true);
                        await updateOnboarding({
                          currentStep: 3,
                          completedSteps: STEPS.map((s) => s.id),
                          completed: true,
                        });
                        router.push('/courses/create');
                      }}
                      disabled={loading}
                      className="bg-gold hover:bg-gold-dark text-charcoal w-full py-6"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Create Your First Course
                    </Button>
                  )}
                  <Button
                    onClick={handleComplete}
                    disabled={loading}
                    variant={role === 'learner' ? 'default' : 'outline'}
                    className={`w-full py-6 ${role === 'learner' ? 'bg-charcoal hover:bg-charcoal-light text-cream' : 'border-charcoal/10'}`}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Skip link */}
            {step < 3 && (
              <button
                onClick={handleSkip}
                className="mt-4 w-full text-center text-sm text-warm-gray hover:text-charcoal transition-colors flex items-center justify-center gap-1"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip setup for now
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
