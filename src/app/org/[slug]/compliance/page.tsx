'use client';

import { useOrg } from '@/contexts/OrgContext';
import { UK_COMPLIANCE_TEMPLATES } from '@/lib/compliance-templates';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  HardHat,
  Users,
  Scale,
  Flame,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Shield,
  HardHat,
  Users,
  Scale,
  Flame,
  Eye,
};

export default function CompliancePage() {
  const { org, isManager } = useOrg();

  if (!org || !isManager) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-charcoal mb-2">Manager Access Required</h2>
          <p className="text-warm-gray text-sm">
            Only owners, admins, and managers can use compliance templates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
          {org.name}
        </p>
        <h1 className="text-3xl font-light text-charcoal tracking-tight">
          UK Compliance <span className="font-serif italic">Templates</span>
        </h1>
        <p className="text-warm-gray mt-2 max-w-2xl">
          Generate AI-powered training courses for UK mandatory compliance requirements.
          Each template creates a full course tailored to your company with lessons, quizzes, and a final exam.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {UK_COMPLIANCE_TEMPLATES.map((template) => {
          const Icon = ICON_MAP[template.icon] || Shield;
          return (
            <div
              key={template.id}
              className="card-premium rounded-xl bg-[var(--card)] flex flex-col"
            >
              <div className="h-0.5 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent rounded-t-xl" />
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-[var(--border)] text-warm-gray"
                  >
                    {template.category}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold text-charcoal mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-warm-gray leading-relaxed mb-4 flex-1">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <Badge variant="outline" className="text-[10px] border-[var(--border)] text-warm-gray font-normal">
                    {template.formData.numModules} modules
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-[var(--border)] text-warm-gray font-normal">
                    {template.formData.lessonsPerModule} lessons/module
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-[var(--border)] text-warm-gray font-normal">
                    {template.formData.difficultyLevel}
                  </Badge>
                </div>

                <Link
                  href={`/courses/create?template=${template.id}&orgId=${org._id}`}
                >
                  <Button
                    className="w-full bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg text-sm"
                  >
                    Generate Course
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="card-premium rounded-xl bg-gold/5 border-gold/20 p-5">
        <h3 className="font-semibold text-charcoal text-sm mb-2">
          How compliance templates work
        </h3>
        <ul className="space-y-1.5 text-sm text-warm-gray">
          {[
            'Templates pre-fill the course creation form with UK-specific compliance content',
            'AI generates full course content tailored to your company name and industry',
            'Each course includes quizzes per module and a comprehensive final exam',
            'Courses can be assigned to your team with optional due dates',
          ].map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gold font-bold">&#8226;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
