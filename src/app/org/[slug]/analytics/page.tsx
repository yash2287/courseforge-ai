'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrg } from '@/contexts/OrgContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users,
  BookOpen,
  Trophy,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Download,
  Search,
  Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function AnalyticsPage() {
  const { org, membership, isManager } = useOrg();
  const [memberSearch, setMemberSearch] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const overview = useQuery(
    api.analytics.getOrgOverview,
    org ? { orgId: org._id } : 'skip'
  );
  const memberReports = useQuery(
    api.analytics.getMemberReports,
    org ? { orgId: org._id } : 'skip'
  );
  const coursePerformance = useQuery(
    api.analytics.getCoursePerformance,
    org ? { orgId: org._id } : 'skip'
  );
  const complianceStatus = useQuery(
    api.analytics.getComplianceStatus,
    org ? { orgId: org._id } : 'skip'
  );

  if (!org || !membership || !isManager) return null;

  if (!overview || !memberReports || !coursePerformance) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
          <p className="text-warm-gray text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const filteredMembers = memberReports.filter(
    (m) =>
      memberSearch === '' ||
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleExportCSV = (type: string) => {
    setExportMenuOpen(false);
    window.open(`/api/export/analytics?org=${org.slug}&type=${type}`, '_blank');
  };

  const stats = [
    { label: 'Active Learners', value: overview.activeLearners, icon: Users, color: 'text-charcoal', subtext: `of ${overview.totalMembers} members` },
    { label: 'Completion Rate', value: `${overview.avgCompletion}%`, icon: TrendingUp, color: 'text-emerald-600', subtext: `${overview.completedAssignments} completed` },
    { label: 'Avg Score', value: overview.avgScore > 0 ? `${overview.avgScore}%` : '—', icon: BarChart3, color: 'text-amber-600', subtext: `across ${overview.totalCertificates} certs` },
    { label: 'Overdue', value: overview.overdueAssignments, icon: AlertCircle, color: overview.overdueAssignments > 0 ? 'text-red-600' : 'text-emerald-600', subtext: overview.overdueAssignments > 0 ? 'needs attention' : 'all on track' },
    { label: 'Certificates', value: overview.certificatesThisMonth, icon: Trophy, color: 'text-gold', subtext: 'this month' },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <Link href={`/org/${org.slug}/dashboard`} className="inline-flex items-center gap-2 text-warm-gray hover:text-charcoal text-sm transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
            Analytics
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight">
            Team <span className="font-serif italic">Performance</span>
          </h1>
        </div>
        <div className="relative">
          <Button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            onBlur={() => setTimeout(() => setExportMenuOpen(false), 200)}
            variant="outline"
            className="gap-2 border-[var(--border)] text-charcoal rounded-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[var(--card)] rounded-xl shadow-lg border border-[var(--border)] py-2 z-50">
              {[
                { type: 'members', label: 'Member Reports' },
                { type: 'courses', label: 'Course Performance' },
                { type: 'compliance', label: 'Compliance Status' },
                { type: 'audit', label: 'Audit Log' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleExportCSV(item.type)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5 text-warm-gray" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card-premium rounded-xl bg-[var(--card)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs font-medium uppercase tracking-wider text-warm-gray">
                  {stat.label}
                </span>
              </div>
              <div className={`text-3xl font-semibold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-warm-gray mt-1">{stat.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Assignment Overview Bar */}
      {overview.totalAssignments > 0 && (
        <div className="card-premium rounded-xl bg-[var(--card)] p-6">
          <h3 className="text-sm font-semibold text-charcoal mb-4">Assignment Overview</h3>
          <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden bg-cream-dark">
            {overview.completedAssignments > 0 && (
              <div
                className="h-full bg-emerald-500 rounded-l-full"
                style={{ width: `${(overview.completedAssignments / overview.totalAssignments) * 100}%` }}
                title={`Completed: ${overview.completedAssignments}`}
              />
            )}
            {overview.inProgressAssignments > 0 && (
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(overview.inProgressAssignments / overview.totalAssignments) * 100}%` }}
                title={`In Progress: ${overview.inProgressAssignments}`}
              />
            )}
            {overview.overdueAssignments > 0 && (
              <div
                className="h-full bg-red-400"
                style={{ width: `${(overview.overdueAssignments / overview.totalAssignments) * 100}%` }}
                title={`Overdue: ${overview.overdueAssignments}`}
              />
            )}
          </div>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-warm-gray">Completed ({overview.completedAssignments})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-warm-gray">In Progress ({overview.inProgressAssignments})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-warm-gray">Overdue ({overview.overdueAssignments})</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-cream-dark border border-[var(--border)]" />
              <span className="text-warm-gray">Not Started ({overview.totalAssignments - overview.completedAssignments - overview.inProgressAssignments - overview.overdueAssignments})</span>
            </div>
          </div>
        </div>
      )}

      <div className="gold-line" />

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[480px] bg-cream-dark rounded-lg h-11">
          <TabsTrigger value="members" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">
            Team Members
          </TabsTrigger>
          <TabsTrigger value="courses" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">
            Course Performance
          </TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9 bg-[var(--card)] border-[var(--border)] rounded-lg h-9 text-sm"
            />
          </div>

          <div className="card-premium rounded-xl bg-[var(--card)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Member</th>
                    <th className="text-left text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Role</th>
                    <th className="text-center text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Assigned</th>
                    <th className="text-center text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Completed</th>
                    <th className="text-center text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Overdue</th>
                    <th className="text-center text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Rate</th>
                    <th className="text-center text-xs font-semibold text-warm-gray uppercase tracking-wider px-5 py-3">Avg Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.userId} className="border-b border-[var(--border)] last:border-0 hover:bg-cream/50 transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-charcoal">{member.name}</p>
                          <p className="text-xs text-warm-gray">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="text-xs border-[var(--border)] text-warm-gray capitalize">
                          {member.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-charcoal font-medium">
                        {member.totalAssigned}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-emerald-600">{member.completed}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {member.overdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {member.overdue}
                          </span>
                        ) : (
                          <span className="text-sm text-warm-gray">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-cream-dark overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                member.completionRate >= 80 ? 'bg-emerald-500' :
                                member.completionRate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${member.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-charcoal w-8">{member.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-sm font-medium text-charcoal">
                        {member.avgScore !== null ? `${member.avgScore}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Course Performance Tab */}
        <TabsContent value="courses" className="mt-6 space-y-4">
          {coursePerformance.length === 0 ? (
            <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
              <BookOpen className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
              <h3 className="text-base font-semibold text-charcoal mb-2">No course data yet</h3>
              <p className="text-warm-gray text-sm">Publish and assign courses to see performance analytics.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coursePerformance.map((course) => (
                <div key={course.courseId} className="card-premium rounded-xl bg-[var(--card)] p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-charcoal">{course.title}</h4>
                        {course.isCompliance && (
                          <Badge className="bg-violet-50 text-violet-700 border-violet-200 border text-[10px]">
                            <Shield className="w-2.5 h-2.5 mr-1" />
                            Compliance
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-warm-gray">
                        <span>{course.totalAssigned} assigned</span>
                        <span className="text-emerald-600">{course.completed} completed</span>
                        <span className="text-amber-600">{course.inProgress} in progress</span>
                        {course.overdue > 0 && (
                          <span className="text-red-600">{course.overdue} overdue</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-warm-gray">Completion</p>
                        <p className={`text-lg font-semibold ${
                          course.completionRate >= 80 ? 'text-emerald-600' :
                          course.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'
                        }`}>{course.completionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-warm-gray">Avg Score</p>
                        <p className="text-lg font-semibold text-charcoal">
                          {course.avgScore !== null ? `${course.avgScore}%` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Completion bar */}
                  {course.totalAssigned > 0 && (
                    <div className="mt-3 h-1.5 rounded-full bg-cream-dark overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          course.completionRate >= 80 ? 'bg-emerald-500' :
                          course.completionRate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${course.completionRate}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="mt-6 space-y-4">
          {!complianceStatus || complianceStatus.length === 0 ? (
            <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
              <Shield className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
              <h3 className="text-base font-semibold text-charcoal mb-2">No compliance courses</h3>
              <p className="text-warm-gray text-sm mb-6">Create compliance courses from templates to track regulatory training.</p>
              <Link href={`/org/${org.slug}/compliance`}>
                <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg">
                  <Shield className="w-4 h-4" />
                  Browse Templates
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complianceStatus.map((item) => {
                const isFullyCompliant = item.assigned > 0 && item.completed === item.assigned;
                const hasOverdue = item.overdue > 0;
                return (
                  <div key={item.courseId} className="card-premium rounded-xl bg-[var(--card)] p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-charcoal">{item.title}</h4>
                        <Badge variant="outline" className="text-[10px] border-[var(--border)] text-warm-gray mt-1">
                          {item.category}
                        </Badge>
                      </div>
                      {isFullyCompliant ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Compliant
                        </Badge>
                      ) : hasOverdue ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200 border text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Action Required
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-warm-gray">Assigned</p>
                        <p className="text-lg font-semibold text-charcoal">{item.assigned}</p>
                      </div>
                      <div>
                        <p className="text-xs text-warm-gray">Completed</p>
                        <p className="text-lg font-semibold text-emerald-600">{item.completed}</p>
                      </div>
                      <div>
                        <p className="text-xs text-warm-gray">Overdue</p>
                        <p className={`text-lg font-semibold ${item.overdue > 0 ? 'text-red-600' : 'text-warm-gray'}`}>{item.overdue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-warm-gray">Not Assigned</p>
                        <p className={`text-lg font-semibold ${item.notAssigned > 0 ? 'text-amber-600' : 'text-warm-gray'}`}>{item.notAssigned}</p>
                      </div>
                    </div>
                    {item.assigned > 0 && (
                      <div className="mt-3 h-1.5 rounded-full bg-cream-dark overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
