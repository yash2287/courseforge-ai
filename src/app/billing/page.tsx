'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Crown,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { PLANS, formatPrice, type PlanId } from '@/lib/plans';

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const subscriptions = useQuery(api.subscriptions.getByUser);
  const [loadingPortal, setLoadingPortal] = useState(false);

  if (!isLoaded || subscriptions === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
        <span className="ml-3 text-warm-gray">Loading billing...</span>
      </div>
    );
  }

  // Get the primary subscription (first active one, or first overall)
  const activeSub =
    subscriptions?.find((s) => s.status === 'active') || subscriptions?.[0];
  const currentPlan = activeSub ? PLANS[activeSub.planId as PlanId] : PLANS.free;
  const isFreePlan = !activeSub || activeSub.planId === 'free';

  const handleManageBilling = async () => {
    if (!activeSub?.stripeCustomerId) return;
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeCustomerId: activeSub.stripeCustomerId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setLoadingPortal(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceled: 'bg-rose-50 text-rose-700 border-rose-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    trialing: 'bg-sky-50 text-sky-700 border-sky-200',
    incomplete: 'bg-warm-gray-light/20 text-warm-gray border-warm-gray-light',
    unpaid: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-charcoal">
          Billing & Subscription
        </h1>
        <p className="text-warm-gray mt-1">
          Manage your plan, view usage, and update payment details.
        </p>
      </div>

      {/* Current Plan Card */}
      <Card className="border-gold/20 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-gold via-gold-dark to-gold" />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Crown className="h-5 w-5 text-gold" />
                <h2 className="text-xl font-semibold text-charcoal">
                  {currentPlan.name} Plan
                </h2>
                {activeSub && (
                  <Badge
                    className={`text-xs ${statusColors[activeSub.status] || statusColors.active}`}
                  >
                    {activeSub.status === 'active'
                      ? 'Active'
                      : activeSub.status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <p className="text-warm-gray">{currentPlan.description}</p>
              {activeSub?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2 mt-3 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Cancels at end of billing period (
                    {activeSub.currentPeriodEnd
                      ? new Date(activeSub.currentPeriodEnd).toLocaleDateString()
                      : 'N/A'}
                    )
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-light text-charcoal">
                {formatPrice(currentPlan.monthlyPrice)}
              </div>
              {currentPlan.monthlyPrice > 0 && (
                <span className="text-sm text-warm-gray">/month</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            {isFreePlan ? (
              <Link href="/pricing">
                <Button className="bg-gold hover:bg-gold-dark text-charcoal">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={loadingPortal}
                className="border-charcoal/20"
              >
                {loadingPortal ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Manage Billing
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
            {!isFreePlan && (
              <Link href="/pricing">
                <Button variant="outline" className="border-charcoal/20">
                  Change Plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-charcoal mb-4">
            Your Plan Includes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                label: 'Team Members',
                value:
                  currentPlan.limits.maxUsers === -1
                    ? 'Unlimited'
                    : `Up to ${currentPlan.limits.maxUsers}`,
              },
              {
                label: 'Courses',
                value:
                  currentPlan.limits.maxCourses === -1
                    ? 'Unlimited'
                    : `Up to ${currentPlan.limits.maxCourses}`,
              },
              {
                label: 'Organizations',
                value:
                  currentPlan.limits.maxOrgs === -1
                    ? 'Unlimited'
                    : `Up to ${currentPlan.limits.maxOrgs}`,
              },
              {
                label: 'AI Generations / Month',
                value:
                  currentPlan.limits.aiGenerationsPerMonth === -1
                    ? 'Unlimited'
                    : `${currentPlan.limits.aiGenerationsPerMonth}`,
              },
              {
                label: 'SSO / SAML',
                value: currentPlan.limits.ssoEnabled ? 'Included' : 'Not included',
                included: currentPlan.limits.ssoEnabled,
              },
              {
                label: 'Advanced Analytics',
                value: currentPlan.limits.analyticsEnabled
                  ? 'Included'
                  : 'Not included',
                included: currentPlan.limits.analyticsEnabled,
              },
              {
                label: 'Priority Support',
                value: currentPlan.limits.prioritySupport
                  ? 'Included'
                  : 'Not included',
                included: currentPlan.limits.prioritySupport,
              },
              {
                label: 'SCORM Export',
                value: currentPlan.limits.scormExport ? 'Included' : 'Not included',
                included: currentPlan.limits.scormExport,
              },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-3 py-2"
              >
                {feature.included !== false ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-warm-gray-light flex-shrink-0" />
                )}
                <span className="text-sm text-charcoal">{feature.label}</span>
                <span className="text-sm text-warm-gray ml-auto">
                  {feature.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {!isFreePlan && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-charcoal">
                Billing Details
              </h3>
            </div>
            <div className="space-y-3">
              {activeSub?.billingInterval && (
                <div className="flex justify-between py-2 border-b border-cream-dark">
                  <span className="text-warm-gray">Billing Interval</span>
                  <span className="text-charcoal capitalize">
                    {activeSub.billingInterval}
                  </span>
                </div>
              )}
              {activeSub?.currentPeriodStart && (
                <div className="flex justify-between py-2 border-b border-cream-dark">
                  <span className="text-warm-gray">Current Period Start</span>
                  <span className="text-charcoal">
                    {new Date(activeSub.currentPeriodStart).toLocaleDateString()}
                  </span>
                </div>
              )}
              {activeSub?.currentPeriodEnd && (
                <div className="flex justify-between py-2 border-b border-cream-dark">
                  <span className="text-warm-gray">Next Billing Date</span>
                  <span className="text-charcoal">
                    {new Date(activeSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              <p className="text-sm text-warm-gray pt-2">
                For detailed invoices and payment history, click{' '}
                <button
                  onClick={handleManageBilling}
                  className="text-gold hover:text-gold-dark underline"
                >
                  Manage Billing
                </button>{' '}
                to open the Stripe portal.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
