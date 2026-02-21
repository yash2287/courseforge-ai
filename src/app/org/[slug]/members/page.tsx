'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  X,
  Loader2,
  ShieldAlert,
  Shield,
} from 'lucide-react';

export default function MembersPage() {
  const { user } = useUser();
  const { org, isAdmin } = useOrg();

  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const invites = useQuery(
    api.orgInvites.getByOrg,
    org ? { orgId: org._id } : 'skip'
  );

  const createInvite = useMutation(api.orgInvites.create);
  const revokeInvite = useMutation(api.orgInvites.revoke);
  const updateRole = useMutation(api.orgMembers.updateRole);
  const removeMember = useMutation(api.orgMembers.removeMember);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('learner');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  if (!org || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-premium rounded-xl bg-[var(--card)] p-8 w-full max-w-md text-center">
          <ShieldAlert className="w-10 h-10 text-warm-gray-light mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-charcoal mb-2">Admin Access Required</h2>
          <p className="text-warm-gray text-sm">
            Only owners and admins can manage members.
          </p>
        </div>
      </div>
    );
  }

  const membersArray = members || [];
  const pendingInvites = (invites || []).filter((i: any) => i.status === 'pending');

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteError('');

    try {
      await createInvite({
        orgId: org._id,
        email: inviteEmail.trim(),
        role: inviteRole as 'admin' | 'manager' | 'learner',
        invitedBy: user.id,
      });
      setInviteEmail('');
      setInviteRole('learner');
      setShowInviteDialog(false);
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: any) => {
    if (!user) return;
    try {
      await revokeInvite({ inviteId, callerUserId: user.id, orgId: org._id });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    if (!user) return;
    try {
      await updateRole({
        orgId: org._id,
        targetUserId,
        newRole: newRole as 'admin' | 'manager' | 'learner',
        callerUserId: user.id,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (!user) return;
    if (!confirm(`Remove ${name} from the organization?`)) return;
    try {
      await removeMember({
        orgId: org._id,
        targetUserId,
        callerUserId: user.id,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

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
            {org.name}
          </p>
          <h1 className="text-3xl font-light text-charcoal tracking-tight">
            Team <span className="font-serif italic">Members</span>
          </h1>
          <p className="text-warm-gray mt-1">
            {membersArray.length} members &middot; {pendingInvites.length} pending invites
          </p>
        </div>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-charcoal hover:bg-charcoal-light text-cream gap-2 rounded-lg"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
          Active Members
        </h3>
        {membersArray.map((member: any) => (
          <div key={member._id} className="card-premium rounded-xl bg-[var(--card)] p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-cream-dark flex items-center justify-center text-charcoal font-semibold text-sm">
                {(member.name || member.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-charcoal">
                    {member.name || 'No name'}
                  </h4>
                  {member.provisionedVia === 'sso' && (
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 px-1.5 py-0">
                      <Shield className="w-2.5 h-2.5 mr-0.5" />
                      SSO
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-warm-gray">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {member.role === 'owner' ? (
                <Badge className={`${getRoleBadgeColor('owner')} text-xs font-medium border`}>
                  Owner
                </Badge>
              ) : (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.userId, value)}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="learner">Learner</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.name || member.email)}
                    className="text-charcoal/40 hover:text-red-500 transition-colors p-1"
                    title="Remove member"
                    aria-label="Remove member"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
            Pending Invites
          </h3>
          {pendingInvites.map((invite: any) => (
            <div key={invite._id} className="card-premium rounded-xl bg-[var(--card)] p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-cream-dark flex items-center justify-center">
                  <Mail className="w-4 h-4 text-warm-gray" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-charcoal">{invite.email}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={`${getRoleBadgeColor(invite.role)} text-[10px] font-medium border`}>
                      {invite.role}
                    </Badge>
                    <span className="text-[10px] text-warm-gray-light flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      Expires {new Date(invite.expiresAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRevokeInvite(invite._id)}
                className="text-charcoal/40 hover:text-red-500 transition-colors p-1"
                title="Revoke invite"
                aria-label="Revoke invite"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-charcoal">Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter their email address and select a role. They&apos;ll see the invite on their dashboard when they sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError('');
                }}
                placeholder="colleague@company.co.uk"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-charcoal">Role</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin — Full org management</SelectItem>
                  <SelectItem value="manager">Manager — Create & assign courses</SelectItem>
                  <SelectItem value="learner">Learner — Take assigned courses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-red-600">{inviteError}</p>
            )}
            <Button
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
              className="w-full bg-charcoal hover:bg-charcoal-light text-cream rounded-lg"
            >
              {isInviting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
