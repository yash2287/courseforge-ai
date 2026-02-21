'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrg } from '@/contexts/OrgContext';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Users,
  BookOpen,
  Trophy,
  BarChart3,
  Plus,
  Shield,
  UserPlus,
  ClipboardList,
  ArrowRight,
  Clock,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function OrgDashboardPage() {
  const { org, membership, isAdmin, isManager } = useOrg();

  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const courses = useQuery(
    api.courses.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const assignments = useQuery(
    api.courseAssignments.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const certificates = useQuery(
    api.certificates.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const [courseSearch, setCourseSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [progressFilter, setProgressFilter] = useState<string>('all');

  if (!org || !membership) return null;

  const membersArray = members || [];
  const coursesArray = courses || [];
  const assignmentsArray = assignments || [];
  const certificatesArray = certificates || [];

  const completedAssignments = assignmentsArray.filter((a) => a.status === 'completed').length;
  const totalAssignments = assignmentsArray.length;
  const avgCompletion = totalAssignments > 0
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;

  const filteredAssignments = useMemo(() => {
    return assignmentsArray.filter((a: any) => {
      const matchesSearch = progressFilter === 'all' || a.status === progressFilter;
      return matchesSearch;
    });
  }, [assignmentsArray, progressFilter]);

  const filteredCourses = useMemo(() => {
    return coursesArray.filter((course: any) => {
      return courseSearch === '' ||
        course.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.description?.toLowerCase().includes(courseSearch.toLowerCase());
    });
  }, [coursesArray, courseSearch]);

  const filteredMembers = useMemo(() => {
    return membersArray.filter((member: any) => {
      return memberSearch === '' ||
        member.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
        member.email?.toLowerCase().includes(memberSearch.toLowerCase());
    });
  }, [membersArray, memberSearch]);

  const stats = [
    { label: 'Team Members', value: membersArray.length, icon: Users, color: 'text-charcoal' },
    { label: 'Courses', value: coursesArray.length, icon: BookOpen, color: 'text-emerald-600' },
    { label: 'Avg Completion', value: `${avgCompletion}%`, icon: BarChart3, color: 'text-amber-600' },
    { label: 'Certificates', value: certificatesArray.length, icon: Trophy, color: 'text-gold' },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-gold/10 text-gold border-gold/20';
      case 'admin': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'manager': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'learner': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
            Organization
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight">
            {org.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`${getRoleBadgeColor(membership.role)} text-xs font-medium border`}>
              {membership.role}
            </Badge>
            {org.industry && (
              <Badge variant="outline" className="text-xs border-[var(--border)] text-warm-gray">
                {org.industry}
              </Badge>
            )}
            {org.ssoConfig?.enabled && (
              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                <Shield className="w-3 h-3 mr-1" />
                SSO Enabled
              </Badge>
            )}
          </div>
        </div>
        {isManager && (
          <div className="flex gap-3">
            <Link href={`/org/${org.slug}/compliance`}>
              <Button variant="outline" className="gap-2 border-[var(--border)] text-charcoal rounded-lg">
                <Shield className="w-4 h-4" />
                Compliance Templates
              </Button>
            </Link>
            <Link href={`/courses/create?orgId=${org._id}`}>
              <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg">
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href={`/org/${org.slug}/analytics`} className="card-premium rounded-xl bg-[var(--card)] p-5 hover:border-gold-light transition-colors">
            <BarChart3 className="w-5 h-5 text-gold mb-3" />
            <h3 className="text-sm font-semibold text-charcoal mb-1">Analytics</h3>
            <p className="text-xs text-warm-gray">View team performance and compliance reports</p>
          </Link>
          {isAdmin && (
            <Link href={`/org/${org.slug}/members`} className="card-premium rounded-xl bg-[var(--card)] p-5 hover:border-gold-light transition-colors">
              <UserPlus className="w-5 h-5 text-gold mb-3" />
              <h3 className="text-sm font-semibold text-charcoal mb-1">Manage Members</h3>
              <p className="text-xs text-warm-gray">Invite team members and manage roles</p>
            </Link>
          )}
          <Link href={`/org/${org.slug}/assign`} className="card-premium rounded-xl bg-[var(--card)] p-5 hover:border-gold-light transition-colors">
            <ClipboardList className="w-5 h-5 text-gold mb-3" />
            <h3 className="text-sm font-semibold text-charcoal mb-1">Assign Courses</h3>
            <p className="text-xs text-warm-gray">Assign training courses to team members</p>
          </Link>
          <Link href={`/org/${org.slug}/compliance`} className="card-premium rounded-xl bg-[var(--card)] p-5 hover:border-gold-light transition-colors">
            <Shield className="w-5 h-5 text-gold mb-3" />
            <h3 className="text-sm font-semibold text-charcoal mb-1">UK Compliance</h3>
            <p className="text-xs text-warm-gray">Generate mandatory UK training courses</p>
          </Link>
        </div>
      )}

      <div className="gold-line" />

      {/* Tabs */}
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[420px] bg-cream-dark rounded-lg h-11">
          <TabsTrigger value="progress" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Team Progress</TabsTrigger>
          <TabsTrigger value="courses" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Courses</TabsTrigger>
          <TabsTrigger value="members" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Members</TabsTrigger>
        </TabsList>

        {/* Team Progress Tab */}
        <TabsContent value="progress" className="mt-6">
          {assignmentsArray.length === 0 ? (
            <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
              <ClipboardList className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
              <h3 className="text-base font-semibold text-charcoal mb-2">No assignments yet</h3>
              <p className="text-warm-gray text-sm mb-6">
                Assign courses to your team to start tracking progress.
              </p>
              {isManager && (
                <Link href={`/org/${org.slug}/assign`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg">
                    <ClipboardList className="w-4 h-4" />
                    Assign Courses
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Filter */}
              <div className="flex gap-2">
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-charcoal cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="assigned">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
                {progressFilter !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={() => setProgressFilter('all')} className="text-warm-gray hover:text-charcoal h-9 px-2">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
                <span className="ml-auto text-xs text-warm-gray self-center">
                  {filteredAssignments.length} of {assignmentsArray.length} assignments
                </span>
              </div>
            <div className="space-y-3">
              {filteredAssignments.map((assignment: any) => (
                <div key={assignment._id} className="card-premium rounded-xl bg-[var(--card)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-charcoal">
                        {assignment.userName}
                      </h4>
                      <p className="text-xs text-warm-gray">{assignment.courseTitle}</p>
                    </div>
                    <Badge className={`text-xs border font-medium ${
                      assignment.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : assignment.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : assignment.status === 'overdue'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {assignment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-warm-gray mb-2">
                      <Clock className="w-3 h-3" />
                      Due: {new Date(assignment.dueDate).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>
              ))}
            </div>
            </div>
          )}
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-6">
          {coursesArray.length === 0 ? (
            <div className="card-premium rounded-xl bg-[var(--card)] p-12 text-center">
              <BookOpen className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
              <h3 className="text-base font-semibold text-charcoal mb-2">No courses yet</h3>
              <p className="text-warm-gray text-sm mb-6">
                Create your first organization course.
              </p>
              {isManager && (
                <Link href={`/courses/create?orgId=${org._id}`}>
                  <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg">
                    <Plus className="w-4 h-4" />
                    Create Course
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                <Input
                  placeholder="Search courses..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="pl-9 bg-[var(--card)] border-[var(--border)] rounded-lg h-9 text-sm"
                />
              </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourses.map((course: any) => (
                <div key={course._id} className="card-premium rounded-xl bg-[var(--card)] flex flex-col">
                  <div className="h-0.5 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent rounded-t-xl" />
                  <div className="p-6 flex-1 flex flex-col">
                    <Badge className={`self-start text-xs font-medium border mb-3 ${
                      course.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {course.status}
                    </Badge>
                    <h3 className="text-base font-semibold text-charcoal line-clamp-2 mb-1.5">
                      {course.title}
                    </h3>
                    <p className="text-sm text-warm-gray line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <div className="mt-auto">
                      <Link href={`/courses/${course._id}`}>
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-[var(--border)] text-charcoal hover:bg-cream-dark rounded-lg text-sm"
                        >
                          View Course
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
              <Input
                placeholder="Search members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9 bg-[var(--card)] border-[var(--border)] rounded-lg h-9 text-sm"
              />
            </div>
          <div className="space-y-3">
            {filteredMembers.map((member: any) => (
              <div key={member._id} className="card-premium rounded-xl bg-[var(--card)] p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-charcoal">
                    {member.name || member.email}
                  </h4>
                  <p className="text-xs text-warm-gray">{member.email}</p>
                </div>
                <Badge className={`${getRoleBadgeColor(member.role)} text-xs font-medium border`}>
                  {member.role}
                </Badge>
              </div>
            ))}
            {isAdmin && (
              <Link href={`/org/${org.slug}/members`}>
                <Button variant="outline" className="w-full gap-2 border-[var(--border)] text-charcoal rounded-lg mt-3">
                  <UserPlus className="w-4 h-4" />
                  Manage Members
                </Button>
              </Link>
            )}
          </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
