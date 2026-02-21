"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  ArrowLeft,
  Route,
  BookOpen,
  Users,
  Trash2,
  Check,
  X,
  ChevronRight,
  GraduationCap,
  Eye,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function LearningPathsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const paths = useQuery(
    api.learningPaths.getByOrg,
    org ? { orgId: org._id } : "skip"
  );
  const orgCourses = useQuery(
    api.courses.getByOrg,
    org ? { orgId: org._id } : "skip"
  );
  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : "skip"
  );

  const createPath = useMutation(api.learningPaths.create);
  const updatePath = useMutation(api.learningPaths.update);
  const removePath = useMutation(api.learningPaths.remove);
  const assignToUser = useMutation(api.learningPaths.assignToUser);
  const assignToAll = useMutation(api.learningPaths.assignToAll);

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Id<"courses">[]>([]);
  const [creating, setCreating] = useState(false);
  const [assigningPathId, setAssigningPathId] = useState<Id<"learningPaths"> | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  const myMembership = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.userId === user.id);
  }, [members, user]);

  const canManage = myMembership && ["owner", "admin", "manager"].includes(myMembership.role);

  const publishedCourses = useMemo(() => {
    if (!orgCourses) return [];
    return orgCourses.filter((c: any) => c.status === "published");
  }, [orgCourses]);

  if (!isLoaded || org === undefined || paths === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-warm-gray">Organization not found</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || selectedCourseIds.length === 0 || !user) return;
    setCreating(true);
    await createPath({
      orgId: org._id,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      courseIds: selectedCourseIds,
      callerUserId: user.id,
    });
    setNewTitle("");
    setNewDescription("");
    setSelectedCourseIds([]);
    setShowCreate(false);
    setCreating(false);
  };

  const toggleCourse = (courseId: Id<"courses">) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handlePublish = async (pathId: Id<"learningPaths">, currentStatus: string) => {
    await updatePath({
      pathId,
      status: currentStatus === "published" ? "draft" : "published",
    });
  };

  const handleAssignUser = async (pathId: Id<"learningPaths">) => {
    if (!assignUserId || !user) return;
    await assignToUser({
      pathId,
      orgId: org._id,
      userId: assignUserId,
      assignedBy: user.id,
    });
    setAssignUserId("");
  };

  const handleAssignAll = async (pathId: Id<"learningPaths">) => {
    if (!user) return;
    await assignToAll({
      pathId,
      orgId: org._id,
      assignedBy: user.id,
    });
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
              <h1 className="text-2xl font-serif text-charcoal">Learning Paths</h1>
              <p className="text-warm-gray text-sm mt-1">
                Create sequential course bundles for structured training programs
              </p>
            </div>
            {canManage && (
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-charcoal text-gold hover:bg-charcoal/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Path
              </Button>
            )}
          </div>
        </div>

        {/* Create Form */}
        {showCreate && (
          <Card className="border-[var(--border)] shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Create Learning Path</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Title *</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. New Hire Onboarding"
                    className="border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Description</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What learners will achieve by completing this path"
                    className="border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">
                    Select Courses (in order) *
                  </label>
                  {publishedCourses.length === 0 ? (
                    <p className="text-xs text-warm-gray">No published courses available</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Selected courses in order */}
                      {selectedCourseIds.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {selectedCourseIds.map((courseId, index) => {
                            const course = publishedCourses.find((c: any) => c._id === courseId);
                            if (!course) return null;
                            return (
                              <div
                                key={courseId}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20"
                              >
                                <span className="text-xs font-bold text-gold w-5 text-center">
                                  {index + 1}
                                </span>
                                <span className="text-sm text-charcoal flex-1">{course.title}</span>
                                <button
                                  onClick={() => toggleCourse(courseId)}
                                  className="text-warm-gray hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Available courses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {publishedCourses
                          .filter((c: any) => !selectedCourseIds.includes(c._id))
                          .map((course: any) => (
                            <button
                              key={course._id}
                              onClick={() => toggleCourse(course._id)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border)] hover:border-gold hover:bg-gold/5 text-left transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-warm-gray flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-charcoal truncate">{course.title}</p>
                                <p className="text-[10px] text-warm-gray">{course.difficulty}</p>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || selectedCourseIds.length === 0 || creating}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Path
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false);
                    setSelectedCourseIds([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Learning Paths List */}
        {paths.length === 0 && !showCreate ? (
          <Card className="border-[var(--border)] shadow-sm">
            <CardContent className="py-16 text-center">
              <Route className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
              <h3 className="text-base font-medium text-charcoal mb-1">No learning paths yet</h3>
              <p className="text-sm text-warm-gray mb-4">
                Bundle courses into structured learning journeys for your team
              </p>
              {canManage && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Path
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paths.map((path: any) => {
              const isAssigning = assigningPathId === path._id;

              return (
                <Card key={path._id} className="border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-charcoal">{path.title}</h3>
                          <Badge
                            variant={path.status === "published" ? "default" : "secondary"}
                            className={`text-[10px] ${path.status === "published" ? "bg-green-100 text-green-700" : ""}`}
                          >
                            {path.status}
                          </Badge>
                        </div>
                        {path.description && (
                          <p className="text-sm text-warm-gray mb-2">{path.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-warm-gray">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {path.courses.length} course{path.courses.length !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {path.assignedCount} assigned
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {path.completedCount} completed
                          </span>
                        </div>
                      </div>

                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handlePublish(path._id, path.status)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium hover:bg-cream-dark transition-colors"
                            title={path.status === "published" ? "Unpublish" : "Publish"}
                          >
                            {path.status === "published" ? (
                              <Eye className="w-4 h-4 text-warm-gray" />
                            ) : (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </button>
                          <button
                            onClick={() => setAssigningPathId(isAssigning ? null : path._id)}
                            className="p-1.5 rounded-md hover:bg-cream-dark text-warm-gray hover:text-charcoal transition-colors"
                            title="Assign"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removePath({ pathId: path._id })}
                            className="p-1.5 rounded-md hover:bg-red-50 text-warm-gray hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Course sequence */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {path.courses.map((course: any, i: number) => (
                        <div key={course._id} className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream-dark text-xs">
                            <span className="font-bold text-gold">{i + 1}</span>
                            <span className="text-charcoal">{course.title}</span>
                          </div>
                          {i < path.courses.length - 1 && (
                            <ChevronRight className="w-3.5 h-3.5 text-warm-gray-light" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Assignment Panel */}
                    {isAssigning && (
                      <div className="mt-4 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-3">
                          <select
                            value={assignUserId}
                            onChange={(e) => setAssignUserId(e.target.value)}
                            className="flex-1 h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm"
                          >
                            <option value="">Select a member...</option>
                            {members?.map((m: any) => (
                              <option key={m._id} value={m.userId}>
                                {m.name ?? m.email}
                              </option>
                            ))}
                          </select>
                          <Button
                            onClick={() => handleAssignUser(path._id)}
                            disabled={!assignUserId}
                            size="sm"
                            className="bg-charcoal text-gold hover:bg-charcoal/90"
                          >
                            Assign
                          </Button>
                          <Button
                            onClick={() => handleAssignAll(path._id)}
                            size="sm"
                            variant="outline"
                          >
                            Assign All
                          </Button>
                        </div>
                      </div>
                    )}
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
