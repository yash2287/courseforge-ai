"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Bell,
  Mail,
  BookOpen,
  Clock,
  Trophy,
  BarChart3,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  const prefs = useQuery(
    api.notificationPreferences.get,
    isLoaded && user ? { userId: user.id } : "skip"
  );
  const updatePrefs = useMutation(api.notificationPreferences.update);

  const [emailAssignments, setEmailAssignments] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [emailCompletions, setEmailCompletions] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setEmailAssignments(prefs.emailAssignments);
      setEmailReminders(prefs.emailReminders);
      setEmailCompletions(prefs.emailCompletions);
      setEmailDigest(prefs.emailDigest);
    }
  }, [prefs]);

  if (!isLoaded || prefs === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    await updatePrefs({
      userId: user.id,
      emailAssignments,
      emailReminders,
      emailCompletions,
      emailDigest,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleItems = [
    {
      key: "emailAssignments",
      icon: BookOpen,
      title: "Course Assignments",
      description: "Get notified when a new course is assigned to you",
      value: emailAssignments,
      onChange: setEmailAssignments,
    },
    {
      key: "emailReminders",
      icon: Clock,
      title: "Deadline Reminders",
      description: "Receive reminders at 7, 3, and 1 day before due dates",
      value: emailReminders,
      onChange: setEmailReminders,
    },
    {
      key: "emailCompletions",
      icon: Trophy,
      title: "Completion Alerts",
      description: "Get notified when your team members complete courses (managers only)",
      value: emailCompletions,
      onChange: setEmailCompletions,
    },
    {
      key: "emailDigest",
      icon: BarChart3,
      title: "Weekly Digest",
      description: "Receive a weekly summary of your org's training activity (admins only)",
      value: emailDigest,
      onChange: setEmailDigest,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-serif text-charcoal">Settings</h1>
          <p className="text-warm-gray text-sm mt-1">
            Manage your profile, billing, and notification preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-lg bg-charcoal/5 flex items-center justify-center">
                <span className="text-sm font-semibold text-charcoal">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-charcoal">Profile</h2>
                <p className="text-xs text-warm-gray">Your account information</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-sm text-warm-gray">Name</span>
                <span className="text-sm text-charcoal">{user?.fullName || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]">
                <span className="text-sm text-warm-gray">Email</span>
                <span className="text-sm text-charcoal">{user?.primaryEmailAddress?.emailAddress || "—"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-warm-gray">Member since</span>
                <span className="text-sm text-charcoal">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
            </div>
            <p className="text-xs text-warm-gray mt-4">
              To update your name, email, or password, use the profile button in the navigation bar.
            </p>
          </CardContent>
        </Card>

        {/* Billing Quick Link */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-gold" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-charcoal">Billing & Plan</h2>
                  <p className="text-xs text-warm-gray">Manage your subscription and payment details</p>
                </div>
              </div>
              <Link href="/billing">
                <Button variant="outline" className="border-charcoal/10 text-sm">
                  Manage Billing
                  <ArrowLeft className="w-3.5 h-3.5 ml-1 rotate-180" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications Section */}
        <Card className="border-[var(--border)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-9 rounded-lg bg-gold/10 flex items-center justify-center">
                <Mail className="w-4.5 h-4.5 text-gold" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-charcoal">Email Notifications</h2>
                <p className="text-xs text-warm-gray">Choose which emails you receive</p>
              </div>
            </div>

            <div className="space-y-1">
              {toggleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-cream-dark flex items-center justify-center">
                        <Icon className="w-4 h-4 text-warm-gray" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-charcoal">{item.title}</p>
                        <p className="text-xs text-warm-gray mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => item.onChange(!item.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        item.value ? "bg-gold" : "bg-[var(--border)]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-[var(--card)] shadow-sm transition-transform ${
                          item.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-charcoal text-gold hover:bg-charcoal/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/20">
          <div className="flex gap-3">
            <Bell className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-charcoal font-medium">In-app notifications are always on</p>
              <p className="text-xs text-warm-gray mt-1">
                These settings only control email delivery. You&apos;ll always receive in-app
                notifications in your notification center regardless of these settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
