'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateOrgPage() {
  const { user } = useUser();
  const router = useRouter();
  const createOrg = useMutation(api.organizations.create);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !slug.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await createOrg({
        name: name.trim(),
        slug: slug.trim(),
        industry: industry || undefined,
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || '',
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      });
      router.push(`/org/${slug.trim()}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing',
    'Retail', 'Education', 'Marketing', 'Legal',
    'Real Estate', 'Construction', 'Hospitality', 'Other',
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-charcoal flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold">
                New Organization
              </p>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight mt-3">
            Create your <span className="font-serif italic">organization</span>
          </h1>
          <p className="text-warm-gray mt-2">
            Set up a team workspace to manage courses, assign training, and track compliance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-premium rounded-xl bg-[var(--card)] p-6 space-y-5">
            {/* Organization Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Acme Corporation"
                required
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-warm-gray whitespace-nowrap">
                  courseforge.com/org/
                </span>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlug(generateSlug(e.target.value));
                    setError('');
                  }}
                  placeholder="acme-corp"
                  required
                />
              </div>
              <p className="text-xs text-warm-gray-light">
                This will be used in your organization&apos;s URL.
              </p>
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">
                Industry
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind.toLowerCase()}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="card-premium rounded-xl bg-gold/5 border-gold/20 p-5">
            <h3 className="font-semibold text-charcoal text-sm mb-2">
              What you can do with an organization
            </h3>
            <ul className="space-y-1.5 text-sm text-warm-gray">
              {[
                'Invite team members and assign roles (Admin, Manager, Learner)',
                'Create and assign training courses to your team',
                'Use UK compliance templates for mandatory training (GDPR, H&S, EDI)',
                'Track team progress and completion rates',
              ].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold font-bold">&#8226;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !slug.trim()}
            className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg py-5 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Organization...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Create Organization
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
