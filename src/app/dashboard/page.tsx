'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Plus,
  BookOpen,
  Clock,
  Trophy,
  Trash2,
  ArrowRight,
  Loader2,
  BarChart3,
  Sparkles,
  Building2,
  Mail,
  Check,
  X,
  CalendarClock,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const courses = useQuery(
    api.courses.getByCreator,
    isLoaded && user ? { createdBy: user.id } : 'skip'
  );
  const certificates = useQuery(
    api.certificates.getByUser,
    isLoaded && user ? { userId: user.id } : 'skip'
  );

  // Org-related queries
  const pendingInvites = useQuery(
    api.orgInvites.getPendingForEmail,
    isLoaded && user?.primaryEmailAddress?.emailAddress
      ? { email: user.primaryEmailAddress.emailAddress }
      : 'skip'
  );
  const assignedCourses = useQuery(
    api.courseAssignments.getByUser,
    isLoaded && user ? { userId: user.id } : 'skip'
  );
  const userOrgs = useQuery(
    api.organizations.getByUser,
    isLoaded && user ? { userId: user.id } : 'skip'
  );

  const acceptInvite = useMutation(api.orgInvites.accept);
  const declineInvite = useMutation(api.orgInvites.decline);
  const deleteCourse = useMutation(api.courses.deleteCourse);

  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const coursesArray = courses || [];
  const certificatesArray = certificates || [];
  const invitesArray = pendingInvites || [];
  const assignedArray = assignedCourses || [];
  const orgs = userOrgs || [];

  const filteredCourses = useMemo(() => {
    return coursesArray.filter((course: any) => {
      const matchesSearch = searchQuery === '' ||
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.industry?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesDifficulty = difficultyFilter === 'all' || course.difficulty === difficultyFilter;
      return matchesSearch && matchesStatus && matchesDifficulty;
    });
  }, [coursesArray, searchQuery, statusFilter, difficultyFilter]);

  if (!isLoaded || courses === undefined || certificates === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cream-dark flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
          <p className="text-warm-gray text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-warm-gray">
              Please sign in to access your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalCourses = coursesArray.length;
  const inProgressCourses = coursesArray.filter(
    (course: any) =>
      course.status === 'generating' || course.status === 'draft'
  ).length;
  const publishedCourses = coursesArray.filter(
    (course: any) => course.status === 'published'
  ).length;
  const certificatesCount = certificatesArray.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      await deleteCourse({ courseId: courseId as any });
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!user) return;
    setProcessingInvite(inviteId);
    try {
      await acceptInvite({
        inviteId: inviteId as any,
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || '',
        userName: user.fullName || user.firstName || '',
      });
    } catch (err: any) {
      alert(err.message || 'Failed to accept invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setProcessingInvite(inviteId);
    try {
      await declineInvite({ inviteId: inviteId as any });
    } catch (err: any) {
      alert(err.message || 'Failed to decline invite');
    } finally {
      setProcessingInvite(null);
    }
  };

  const stats = [
    { label: 'Total Courses', value: totalCourses, icon: BookOpen, color: 'text-charcoal' },
    { label: 'In Progress', value: inProgressCourses, icon: Loader2, color: 'text-amber-600' },
    { label: 'Published', value: publishedCourses, icon: BarChart3, color: 'text-emerald-600' },
    { label: 'Certificates', value: certificatesCount, icon: Trophy, color: 'text-gold' },
  ];

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || difficultyFilter !== 'all';

  const hasAssignedCourses = assignedArray.length > 0;
  const tabCount = 2 + (hasAssignedCourses ? 1 : 0);

  return (
    <div className="min-h-screen bg-cream p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Invite Banners */}
        {invitesArray.length > 0 && (
          <div className="space-y-3 animate-fade-up">
            {invitesArray.map((invite: any) => (
              <div
                key={invite._id}
                className="card-premium rounded-xl bg-[var(--card)] border-gold/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">
                      You&apos;re invited to join <span className="text-gold">{invite.orgName}</span>
                    </h4>
                    <p className="text-xs text-warm-gray mt-0.5">
                      Role: <span className="capitalize font-medium">{invite.role}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite._id)}
                    disabled={processingInvite === invite._id}
                    className="bg-charcoal hover:bg-charcoal-light text-cream gap-1.5 rounded-lg text-xs"
                  >
                    {processingInvite === invite._id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvite(invite._id)}
                    disabled={processingInvite === invite._id}
                    className="border-[var(--border)] text-charcoal/70 hover:text-red-600 hover:border-red-200 gap-1.5 rounded-lg text-xs"
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-light text-charcoal tracking-tight">
              Welcome back, <span className="font-serif italic">{user.firstName}</span>
            </h1>
            <p className="text-warm-gray mt-2">
              Create and manage your AI-powered training courses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {orgs.length > 0 && orgs[0]?.org ? (
              <Link href={`/org/${orgs[0].org.slug}/dashboard`}>
                <Button variant="outline" className="border-gold/20 bg-gold/5 text-charcoal hover:bg-gold/10 gap-2 rounded-lg px-4">
                  <Building2 className="w-4 h-4 text-gold" />
                  {orgs[0].org.name}
                </Button>
              </Link>
            ) : (
              <Link href="/org/create">
                <Button variant="outline" className="border-[var(--border)] text-charcoal/70 hover:text-charcoal hover:border-gold-light gap-2 rounded-lg px-4">
                  <Building2 className="w-4 h-4" />
                  Create Organisation
                </Button>
              </Link>
            )}
            <Link href="/courses/create">
              <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg px-5">
                <Plus className="w-4 h-4" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up delay-100">
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

        {/* Tabs Section */}
        <div className="animate-fade-up delay-200">
          <Tabs defaultValue={hasAssignedCourses ? 'assigned' : 'courses'} className="w-full">
            <TabsList className={`grid w-full ${tabCount === 3 ? 'grid-cols-3 lg:w-[480px]' : 'grid-cols-2 lg:w-80'} bg-cream-dark rounded-lg h-11`}>
              {hasAssignedCourses && (
                <TabsTrigger value="assigned" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">
                  Assigned
                  {assignedArray.filter((a: any) => a.status !== 'completed').length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-gold/20 text-gold text-[10px] font-bold">
                      {assignedArray.filter((a: any) => a.status !== 'completed').length}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="courses" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">My Courses</TabsTrigger>
              <TabsTrigger value="certificates" className="rounded-md text-sm font-medium text-charcoal/60 data-[state=active]:bg-[var(--card)] data-[state=active]:text-charcoal data-[state=active]:font-semibold data-[state=active]:shadow-sm">Certificates</TabsTrigger>
            </TabsList>

            {/* Assigned Courses Tab */}
            {hasAssignedCourses && (
              <TabsContent value="assigned" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {assignedArray.map((assignment: any) => {
                    const isOverdue = assignment.dueDate && assignment.status !== 'completed' && assignment.dueDate < Date.now();
                    const progress = assignment.progress || 0;
                    return (
                      <div
                        key={assignment._id}
                        className="card-premium rounded-xl bg-[var(--card)] flex flex-col"
                      >
                        <div className={`h-0.5 rounded-t-xl ${isOverdue ? 'bg-gradient-to-r from-red-400/60 via-red-300/30 to-transparent' : 'bg-gradient-to-r from-gold/40 via-gold/20 to-transparent'}`} />
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={`text-xs font-medium border ${
                              assignment.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : assignment.status === 'in_progress'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {assignment.status === 'in_progress' ? 'In Progress' : assignment.status === 'completed' ? 'Completed' : 'Not Started'}
                            </Badge>
                            {assignment.orgName && (
                              <Badge variant="outline" className="text-[10px] border-gold/20 text-gold font-medium">
                                {assignment.orgName}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-base font-semibold text-charcoal line-clamp-2 mb-1.5">
                            {assignment.courseTitle || 'Untitled Course'}
                          </h3>

                          {/* Due Date */}
                          {assignment.dueDate && (
                            <div className={`flex items-center gap-1.5 text-xs mb-3 ${isOverdue ? 'text-red-600' : 'text-warm-gray'}`}>
                              {isOverdue ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <CalendarClock className="w-3 h-3" />
                              )}
                              Due {new Date(assignment.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-auto space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-warm-gray">Progress</span>
                                <span className="font-semibold text-charcoal">{Math.round(progress)}%</span>
                              </div>
                              <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progress >= 100 ? 'bg-emerald-500' : 'bg-gold'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>

                            <Link href={`/courses/${assignment.courseId}`}>
                              <Button
                                variant="outline"
                                className="w-full gap-2 border-[var(--border)] text-charcoal hover:bg-cream-dark hover:border-gold-light rounded-lg text-sm"
                              >
                                {assignment.status === 'completed' ? 'Review Course' : assignment.status === 'in_progress' ? 'Continue Learning' : 'Start Course'}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {/* My Courses Tab */}
            <TabsContent value="courses" className="mt-6">
              {coursesArray.length === 0 ? (
                <div className="card-premium rounded-xl bg-[var(--card)] p-12">
                  <div className="text-center max-w-sm mx-auto">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cream-dark mb-5">
                      <Sparkles className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      No courses yet
                    </h3>
                    <p className="text-warm-gray mb-6 text-sm leading-relaxed">
                      Create your first AI-powered training course and start building your library.
                    </p>
                    <Link href="/courses/create">
                      <Button className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg">
                        <Plus className="w-4 h-4" />
                        Create Your First Course
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Search & Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray" />
                      <Input
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[var(--card)] border-[var(--border)] rounded-lg h-10 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-charcoal cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="generating">Generating</option>
                        <option value="archived">Archived</option>
                      </select>
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-charcoal cursor-pointer"
                      >
                        <option value="all">All Levels</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDifficultyFilter('all'); }}
                          className="text-warm-gray hover:text-charcoal h-10 px-3"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {filteredCourses.length === 0 ? (
                    <div className="card-premium rounded-xl bg-[var(--card)] p-8 text-center">
                      <Filter className="w-8 h-8 text-warm-gray-light mx-auto mb-3" />
                      <p className="text-warm-gray text-sm">No courses match your filters.</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSearchQuery(''); setStatusFilter('all'); setDifficultyFilter('all'); }}
                        className="text-gold hover:text-gold-dark mt-2"
                      >
                        Clear filters
                      </Button>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCourses.map((course: any) => (
                    <div
                      key={course._id}
                      className="card-premium rounded-xl bg-[var(--card)] flex flex-col"
                    >
                      {/* Gold accent line at top */}
                      <div className="h-0.5 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent rounded-t-xl" />

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={`${getStatusColor(course.status)} text-xs font-medium border`}>
                            {course.status}
                          </Badge>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            className="text-charcoal/40 hover:text-red-500 transition-colors p-1 -m-1"
                            title="Delete course"
                            aria-label="Delete course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h3 className="text-base font-semibold text-charcoal line-clamp-2 mb-1.5">
                          {course.title}
                        </h3>
                        <p className="text-sm text-warm-gray line-clamp-2 mb-4 leading-relaxed">
                          {course.description}
                        </p>

                        <div className="mt-auto space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {course.difficulty && (
                              <Badge variant="outline" className="text-xs border-[var(--border)] text-warm-gray font-normal">
                                {course.difficulty}
                              </Badge>
                            )}
                            {course.industry && (
                              <Badge variant="outline" className="text-xs border-[var(--border)] text-warm-gray font-normal">
                                {course.industry}
                              </Badge>
                            )}
                          </div>
                          {course.estimatedDuration && (
                            <div className="flex items-center gap-1.5 text-xs text-warm-gray-light">
                              <Clock className="w-3 h-3" />
                              {course.estimatedDuration}
                            </div>
                          )}
                          <Link href={`/courses/${course._id}`}>
                            <Button
                              variant="outline"
                              className="w-full gap-2 border-[var(--border)] text-charcoal hover:bg-cream-dark hover:border-gold-light rounded-lg text-sm"
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
                  )}
                </div>
              )}
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="mt-6">
              {certificatesArray.length === 0 ? (
                <div className="card-premium rounded-xl bg-[var(--card)] p-12">
                  <div className="text-center max-w-sm mx-auto">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-cream-dark mb-5">
                      <Trophy className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      No certificates yet
                    </h3>
                    <p className="text-warm-gray text-sm">
                      Your earned certificates will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {certificatesArray.map((certificate: any) => (
                    <div
                      key={certificate._id}
                      className="card-premium rounded-xl bg-[var(--card)] flex flex-col"
                    >
                      <div className="h-0.5 bg-gradient-to-r from-gold via-gold/50 to-transparent rounded-t-xl" />
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gold/10 mb-4">
                          <Award className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="text-base font-semibold text-charcoal line-clamp-2 mb-1">
                          {certificate.courseTitle}
                        </h3>
                        <p className="text-sm text-warm-gray mb-4">
                          {certificate.companyName}
                        </p>

                        <div className="mt-auto space-y-3">
                          {certificate.completionDate && (
                            <div className="text-xs">
                              <p className="text-warm-gray-light uppercase tracking-wider font-medium">Completed</p>
                              <p className="font-medium text-charcoal mt-0.5">
                                {new Date(certificate.completionDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: '2-digit',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          )}
                          {certificate.finalScore !== undefined && (
                            <div className="text-xs">
                              <p className="text-warm-gray-light uppercase tracking-wider font-medium">Score</p>
                              <p className="font-semibold text-charcoal mt-0.5">
                                {certificate.finalScore}%
                              </p>
                            </div>
                          )}
                          <Link
                            href={`/courses/${certificate.courseId}/certificate`}
                          >
                            <Button
                              variant="outline"
                              className="w-full gap-2 border-[var(--border)] text-charcoal hover:bg-cream-dark hover:border-gold-light rounded-lg text-sm"
                            >
                              View Certificate
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Award(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
  );
}
