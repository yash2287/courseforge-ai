'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardList,
  CheckCircle,
  Users,
  User,
  Loader2,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

export default function AssignPage() {
  const { user } = useUser();
  const { org, isManager } = useOrg();

  const courses = useQuery(
    api.courses.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const assignToUser = useMutation(api.courseAssignments.assignToUser);
  const assignToAll = useMutation(api.courseAssignments.assignToAll);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignMode, setAssignMode] = useState<'all' | 'individual'>('all');
  const [selectedMember, setSelectedMember] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!org || !isManager) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-charcoal mb-2">Manager Access Required</h2>
          <p className="text-warm-gray text-sm">
            Only owners, admins, and managers can assign courses.
          </p>
        </div>
      </div>
    );
  }

  const coursesArray = (courses || []).filter((c: any) => c.status === 'published');
  const membersArray = members || [];

  const handleAssign = async () => {
    if (!user || !selectedCourse) return;
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;

      if (assignMode === 'all') {
        const count = await assignToAll({
          orgId: org._id,
          courseId: selectedCourse as any,
          assignedBy: user.id,
          dueDate: dueDateTimestamp,
        });
        setSuccess(`Course assigned to ${count} team members.`);
      } else {
        if (!selectedMember) {
          setError('Please select a team member.');
          setIsSubmitting(false);
          return;
        }
        await assignToUser({
          orgId: org._id,
          courseId: selectedCourse as any,
          userId: selectedMember,
          assignedBy: user.id,
          dueDate: dueDateTimestamp,
        });
        const memberName = membersArray.find((m: any) => m.userId === selectedMember)?.name || 'member';
        setSuccess(`Course assigned to ${memberName}.`);
      }

      setSelectedCourse('');
      setSelectedMember('');
      setDueDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to assign course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
          {org.name}
        </p>
        <h1 className="text-3xl font-light text-charcoal tracking-tight">
          Assign <span className="font-serif italic">Courses</span>
        </h1>
        <p className="text-warm-gray mt-1">
          Assign training courses to your team members with optional due dates.
        </p>
      </div>

      <div className="card-premium rounded-xl bg-[var(--card)] p-6 space-y-5">
        {/* Select Course */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">
            Course <span className="text-red-500">*</span>
          </label>
          {coursesArray.length === 0 ? (
            <div className="bg-cream rounded-lg p-4 text-center">
              <BookOpen className="w-5 h-5 text-warm-gray mx-auto mb-2" />
              <p className="text-sm text-warm-gray">
                No published courses available. Create a course first.
              </p>
            </div>
          ) : (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {coursesArray.map((course: any) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Assign Mode */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Assign To</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAssignMode('all')}
              className={`p-4 rounded-lg border text-left transition-colors ${
                assignMode === 'all'
                  ? 'border-gold bg-gold/5'
                  : 'border-[var(--border)] hover:border-gold-light'
              }`}
            >
              <Users className={`w-5 h-5 mb-2 ${assignMode === 'all' ? 'text-gold' : 'text-warm-gray'}`} />
              <h4 className="text-sm font-semibold text-charcoal">All Members</h4>
              <p className="text-xs text-warm-gray mt-0.5">
                {membersArray.length} members
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAssignMode('individual')}
              className={`p-4 rounded-lg border text-left transition-colors ${
                assignMode === 'individual'
                  ? 'border-gold bg-gold/5'
                  : 'border-[var(--border)] hover:border-gold-light'
              }`}
            >
              <User className={`w-5 h-5 mb-2 ${assignMode === 'individual' ? 'text-gold' : 'text-warm-gray'}`} />
              <h4 className="text-sm font-semibold text-charcoal">Individual</h4>
              <p className="text-xs text-warm-gray mt-0.5">
                Select a member
              </p>
            </button>
          </div>
        </div>

        {/* Individual Member Select */}
        {assignMode === 'individual' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
              Team Member <span className="text-red-500">*</span>
            </label>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {membersArray.map((member: any) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name || member.email} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Due Date */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">
            Due Date <span className="text-warm-gray-light">(optional)</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        <Button
          onClick={handleAssign}
          disabled={isSubmitting || !selectedCourse || coursesArray.length === 0}
          className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg py-5"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ClipboardList className="w-4 h-4 mr-2" />
          )}
          Assign Course
        </Button>
      </div>
    </div>
  );
}
