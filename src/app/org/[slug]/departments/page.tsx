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
  Users,
  ArrowLeft,
  Pencil,
  Trash2,
  FolderTree,
  UserPlus,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function DepartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const departments = useQuery(
    api.departments.getByOrg,
    org ? { orgId: org._id } : "skip"
  );
  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : "skip"
  );

  const createDept = useMutation(api.departments.create);
  const updateDept = useMutation(api.departments.update);
  const removeDept = useMutation(api.departments.remove);
  const assignMember = useMutation(api.departments.assignMember);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newManagerId, setNewManagerId] = useState("");
  const [editingId, setEditingId] = useState<Id<"departments"> | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [assigningDeptId, setAssigningDeptId] = useState<Id<"departments"> | null>(null);
  const [creating, setCreating] = useState(false);

  const myMembership = useMemo(() => {
    if (!members || !user) return null;
    return members.find((m: any) => m.userId === user.id);
  }, [members, user]);

  const isAdmin = myMembership && ["owner", "admin"].includes(myMembership.role);

  // Members not in any department
  const unassignedMembers = useMemo(() => {
    if (!members || !departments) return [];
    return members.filter((m: any) => !m.departmentId);
  }, [members, departments]);

  if (!isLoaded || org === undefined || departments === undefined || members === undefined) {
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
    if (!newName.trim() || !user) return;
    setCreating(true);
    await createDept({
      orgId: org._id,
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      managerId: newManagerId || undefined,
      callerUserId: user.id,
    });
    setNewName("");
    setNewDescription("");
    setNewManagerId("");
    setShowCreate(false);
    setCreating(false);
  };

  const handleUpdate = async (deptId: Id<"departments">) => {
    if (!user) return;
    await updateDept({
      departmentId: deptId,
      name: editName.trim() || undefined,
      description: editDescription.trim() || undefined,
      callerUserId: user.id,
    });
    setEditingId(null);
  };

  const handleDelete = async (deptId: Id<"departments">) => {
    if (!user) return;
    await removeDept({ departmentId: deptId, callerUserId: user.id });
  };

  const handleAssignMember = async (memberId: Id<"orgMembers">, deptId: Id<"departments"> | undefined) => {
    if (!user) return;
    await assignMember({
      memberId,
      departmentId: deptId,
      callerUserId: user.id,
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
              <h1 className="text-2xl font-serif text-charcoal">Departments</h1>
              <p className="text-warm-gray text-sm mt-1">
                Organize your team into departments for targeted course assignments
              </p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-charcoal text-gold hover:bg-charcoal/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Department
              </Button>
            )}
          </div>
        </div>

        {/* Create Department Form */}
        {showCreate && (
          <Card className="border-[var(--border)] shadow-sm mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-charcoal mb-4">Create Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Name *</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="border-[var(--border)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Manager</label>
                  <select
                    value={newManagerId}
                    onChange={(e) => setNewManagerId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--card)] text-sm"
                  >
                    <option value="">No manager</option>
                    {members
                      .filter((m: any) => ["owner", "admin", "manager"].includes(m.role))
                      .map((m: any) => (
                        <option key={m._id} value={m.userId}>
                          {m.name ?? m.email}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-warm-gray mb-1 block">Description</label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of this department"
                    className="border-[var(--border)]"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Department Cards */}
        {departments.length === 0 && !showCreate ? (
          <Card className="border-[var(--border)] shadow-sm">
            <CardContent className="py-16 text-center">
              <FolderTree className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
              <h3 className="text-base font-medium text-charcoal mb-1">No departments yet</h3>
              <p className="text-sm text-warm-gray mb-4">
                Create departments to organize your team and target course assignments
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Department
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {departments.map((dept: any) => {
              const isEditing = editingId === dept._id;
              const isAssigning = assigningDeptId === dept._id;

              return (
                <Card key={dept._id} className="border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border-[var(--border)] max-w-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(dept._id)}
                              className="bg-charcoal text-gold hover:bg-charcoal/90 h-8"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              className="h-8"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-base font-semibold text-charcoal">{dept.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {dept.memberCount} member{dept.memberCount !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                        {dept.description && !isEditing && (
                          <p className="text-sm text-warm-gray mb-2">{dept.description}</p>
                        )}
                        {dept.managerName && (
                          <p className="text-xs text-warm-gray">
                            Manager: <span className="font-medium text-charcoal">{dept.managerName}</span>
                          </p>
                        )}
                      </div>

                      {isAdmin && !isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setAssigningDeptId(isAssigning ? null : dept._id)}
                            className="p-1.5 rounded-md hover:bg-cream-dark text-warm-gray hover:text-charcoal transition-colors"
                            title="Add members"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(dept._id);
                              setEditName(dept.name);
                              setEditDescription(dept.description || "");
                            }}
                            className="p-1.5 rounded-md hover:bg-cream-dark text-warm-gray hover:text-charcoal transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dept._id)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-warm-gray hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Department Members */}
                    {dept.memberCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <div className="flex flex-wrap gap-2">
                          {members
                            .filter((m: any) => m.departmentId === dept._id)
                            .map((m: any) => (
                              <div
                                key={m._id}
                                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cream-dark text-xs"
                              >
                                <div className="h-5 w-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
                                  {(m.name ?? m.email).charAt(0).toUpperCase()}
                                </div>
                                <span className="text-charcoal font-medium">{m.name ?? m.email}</span>
                                <span className="text-warm-gray">{m.role}</span>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleAssignMember(m._id, undefined)}
                                    className="text-warm-gray hover:text-red-500 transition-colors"
                                    title="Remove from department"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Assign Members Panel */}
                    {isAssigning && (
                      <div className="mt-3 pt-3 border-t border-[var(--border)]">
                        <p className="text-xs font-medium text-warm-gray mb-2">Add unassigned members:</p>
                        {unassignedMembers.length === 0 ? (
                          <p className="text-xs text-warm-gray">All members are assigned to departments</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {unassignedMembers.map((m: any) => (
                              <button
                                key={m._id}
                                onClick={() => handleAssignMember(m._id, dept._id)}
                                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border)] hover:border-gold hover:bg-gold/5 text-xs transition-colors"
                              >
                                <Plus className="w-3 h-3 text-warm-gray" />
                                <span className="text-charcoal">{m.name ?? m.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Unassigned Members Card */}
            {unassignedMembers.length > 0 && (
              <Card className="border-[var(--border)] shadow-sm border-dashed">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-warm-gray" />
                    <h3 className="text-sm font-medium text-warm-gray">
                      Unassigned Members ({unassignedMembers.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {unassignedMembers.map((m: any) => (
                      <div
                        key={m._id}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cream-dark text-xs"
                      >
                        <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-warm-gray">
                          {(m.name ?? m.email).charAt(0).toUpperCase()}
                        </div>
                        <span className="text-charcoal">{m.name ?? m.email}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
