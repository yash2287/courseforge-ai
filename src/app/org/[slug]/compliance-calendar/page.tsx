"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function ComplianceCalendarPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const schedules = useQuery(
    api.complianceSchedules.getByOrg,
    org ? { orgId: org._id } : "skip"
  );
  const orgCourses = useQuery(
    api.courses.getByOrg,
    org ? { orgId: org._id } : "skip"
  );

  const createSchedule = useMutation(api.complianceSchedules.create);
  const removeSchedule = useMutation(api.complianceSchedules.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [period, setPeriod] = useState("365");
  const [autoReassign, setAutoReassign] = useState(true);
  const [creating, setCreating] = useState(false);

  const complianceCourses = useMemo(() => {
    if (!orgCourses || !schedules) return [];
    const scheduledIds = new Set(schedules.map((s: any) => s.courseId));
    return orgCourses.filter(
      (c: any) => c.status === "published" && !scheduledIds.has(c._id)
    );
  }, [orgCourses, schedules]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (!schedules) return { compliant: 0, expiring: 0, expired: 0, total: 0 };
    return schedules.reduce(
      (acc: any, s: any) => ({
        compliant: acc.compliant + s.compliant,
        expiring: acc.expiring + s.expiringSoon,
        expired: acc.expired + s.expired,
        total: acc.total + s.totalMembers,
      }),
      { compliant: 0, expiring: 0, expired: 0, total: 0 }
    );
  }, [schedules]);

  if (!isLoaded || org === undefined || schedules === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (!org) return <div className="flex items-center justify-center min-h-screen"><p className="text-warm-gray">Organization not found</p></div>;

  const handleCreate = async () => {
    if (!selectedCourseId || !user) return;
    setCreating(true);
    await createSchedule({
      orgId: org._id,
      courseId: selectedCourseId as Id<"courses">,
      recertificationPeriodDays: parseInt(period) || 365,
      autoReassign,
      reminderDaysBefore: [30, 14, 7, 1],
      callerUserId: user.id,
    });
    setSelectedCourseId("");
    setShowAdd(false);
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/org/${slug}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif text-charcoal">Compliance Calendar</h1>
              <p className="text-warm-gray text-sm mt-1">
                Track certification expiry and auto-renewal schedules
              </p>
            </div>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-charcoal text-gold hover:bg-charcoal/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        {schedules.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Compliant", value: stats.compliant, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
              { label: "Expiring Soon", value: stats.expiring, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Expired", value: stats.expired, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
              { label: "Total Tracked", value: stats.total, icon: Shield, color: "text-charcoal", bg: "bg-cream-dark" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-[var(--border)] shadow-sm">
                  <CardContent className="p-4">
                    <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
                    <p className="text-[10px] text-warm-gray uppercase tracking-wider">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add Schedule Form */}
        {showAdd && (
          <Card className="border-[var(--border)] shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Add Compliance Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm"
                  >
                    <option value="">Select a course...</option>
                    {complianceCourses.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Renewal Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm"
                  >
                    <option value="90">Every 90 days</option>
                    <option value="180">Every 6 months</option>
                    <option value="365">Annually</option>
                    <option value="730">Every 2 years</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Auto-Reassign</label>
                  <button
                    onClick={() => setAutoReassign(!autoReassign)}
                    className={`h-9 px-3 rounded-md border text-sm w-full text-left flex items-center gap-2 ${
                      autoReassign ? "border-green-300 bg-green-50 text-green-700" : "border-[var(--border)] text-warm-gray"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {autoReassign ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCreate}
                  disabled={!selectedCourseId || creating}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Schedule
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Schedules */}
        {schedules.length === 0 && !showAdd ? (
          <Card className="border-[var(--border)] shadow-sm">
            <CardContent className="py-16 text-center">
              <Calendar className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
              <h3 className="text-base font-medium text-charcoal mb-1">No compliance schedules</h3>
              <p className="text-sm text-warm-gray mb-4">
                Set up recurring certification requirements for your compliance courses
              </p>
              <Button onClick={() => setShowAdd(true)} className="bg-charcoal text-gold hover:bg-charcoal/90">
                <Plus className="w-4 h-4 mr-2" />
                Add First Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule: any) => {
              const complianceRate = schedule.totalMembers > 0
                ? Math.round((schedule.compliant / schedule.totalMembers) * 100)
                : 0;

              return (
                <Card key={schedule._id} className="border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-charcoal">{schedule.courseTitle}</h3>
                          {schedule.courseCategory && (
                            <Badge variant="secondary" className="text-[10px]">{schedule.courseCategory}</Badge>
                          )}
                          {schedule.autoReassign && (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">
                              <RefreshCw className="w-2.5 h-2.5 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-warm-gray">
                          Renewal every {schedule.recertificationPeriodDays} days
                        </p>

                        {/* Status bar */}
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden flex">
                            {schedule.compliant > 0 && (
                              <div
                                className="h-full bg-green-500"
                                style={{ width: `${(schedule.compliant / schedule.totalMembers) * 100}%` }}
                              />
                            )}
                            {schedule.expiringSoon > 0 && (
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${(schedule.expiringSoon / schedule.totalMembers) * 100}%` }}
                              />
                            )}
                            {schedule.expired > 0 && (
                              <div
                                className="h-full bg-red-500"
                                style={{ width: `${(schedule.expired / schedule.totalMembers) * 100}%` }}
                              />
                            )}
                          </div>
                          <span className="text-xs font-bold text-charcoal">{complianceRate}%</span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-[10px]">
                          <span className="flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            {schedule.compliant} compliant
                          </span>
                          <span className="flex items-center gap-1 text-amber-600">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            {schedule.expiringSoon} expiring
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            {schedule.expired} expired
                          </span>
                          <span className="flex items-center gap-1 text-warm-gray">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            {schedule.notCertified} not started
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeSchedule({ scheduleId: schedule._id })}
                        className="p-1.5 rounded-md hover:bg-red-50 text-warm-gray hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
