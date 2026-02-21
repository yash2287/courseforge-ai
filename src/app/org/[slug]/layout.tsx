'use client';

import { use } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { OrgProvider } from '@/contexts/OrgContext';
import { Navbar } from '@/components/layout/navbar';
import { Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = use(params);
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });

  const membership = useQuery(
    api.orgMembers.getMembership,
    org && user?.id ? { orgId: org._id, userId: user.id } : 'skip'
  );

  if (!isLoaded || org === undefined || (org && membership === undefined)) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
            </div>
            <p className="text-warm-gray text-sm">Loading organization...</p>
          </div>
        </div>
      </>
    );
  }

  if (!org) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
            <ShieldX className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-charcoal mb-2">
              Organization Not Found
            </h2>
            <p className="text-warm-gray text-sm mb-6">
              This organization doesn&apos;t exist or the URL is incorrect.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-lg border-[var(--border)]">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!membership) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
            <ShieldX className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-charcoal mb-2">
              Access Denied
            </h2>
            <p className="text-warm-gray text-sm mb-6">
              You are not a member of this organization.
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-lg border-[var(--border)]">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <OrgProvider org={org} membership={membership}>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
          {children}
        </div>
      </main>
    </OrgProvider>
  );
}
