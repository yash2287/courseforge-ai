"use client";

import Link from "next/link";
import { Sparkles, Plus, LayoutDashboard, Award, Building2, ChevronDown, Users, Shield, ClipboardList, Bell, BarChart3, BookOpen, Trophy, CheckCircle, AlertCircle, Mail, Settings, FolderTree, Route, Upload, LayoutGrid, FileImage, Webhook } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const { user, isLoaded } = useUser();
  const userOrgs = useQuery(
    api.organizations.getByUser,
    isLoaded && user?.id ? { userId: user.id } : "skip"
  );
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notifications = useQuery(
    api.notifications.getByUser,
    isLoaded && user?.id ? { userId: user.id, limit: 10 } : "skip"
  );
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isLoaded && user?.id ? { userId: user.id } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const orgs = userOrgs || [];
  const primaryOrg = orgs.length > 0 ? orgs[0] : null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-charcoal text-gold transition-transform duration-300 group-hover:scale-105">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-serif text-xl text-charcoal tracking-tight">CourseForge</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-warm-gray hover:text-charcoal text-sm font-medium transition-colors rounded-lg hover:bg-cream-dark"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/courses/create"
              className="flex items-center gap-2 px-4 py-2 text-warm-gray hover:text-charcoal text-sm font-medium transition-colors rounded-lg hover:bg-cream-dark"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </Link>
            <Link
              href="/templates"
              className="flex items-center gap-2 px-4 py-2 text-warm-gray hover:text-charcoal text-sm font-medium transition-colors rounded-lg hover:bg-cream-dark"
            >
              <LayoutGrid className="w-4 h-4" />
              Templates
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-warm-gray hover:text-charcoal text-sm font-medium transition-colors rounded-lg hover:bg-cream-dark"
            >
              <Award className="w-4 h-4" />
              Certificates
            </Link>

            {/* Org Menu */}
            {primaryOrg && (
              <div className="relative ml-1">
                <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  onBlur={() => setTimeout(() => setOrgMenuOpen(false), 200)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gold/20 bg-gold/5 text-charcoal hover:bg-gold/10 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-gold" />
                  <span className="max-w-[120px] truncate">{primaryOrg.org.name}</span>
                  <ChevronDown className={`w-3 h-3 text-warm-gray transition-transform ${orgMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {orgMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[var(--card)] rounded-xl shadow-lg border border-[var(--border)] py-2 z-50">
                    <Link
                      href={`/org/${primaryOrg.org.slug}/dashboard`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-warm-gray" />
                      Org Dashboard
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/analytics`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <BarChart3 className="w-4 h-4 text-warm-gray" />
                      Analytics
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/members`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Users className="w-4 h-4 text-warm-gray" />
                      Members
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/departments`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <FolderTree className="w-4 h-4 text-warm-gray" />
                      Departments
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/paths`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Route className="w-4 h-4 text-warm-gray" />
                      Learning Paths
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/assign`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-warm-gray" />
                      Assign Courses
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/media`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <FileImage className="w-4 h-4 text-warm-gray" />
                      Media Library
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/import`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Upload className="w-4 h-4 text-warm-gray" />
                      Import Members
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/leaderboard`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Trophy className="w-4 h-4 text-warm-gray" />
                      Leaderboard
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/compliance`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Shield className="w-4 h-4 text-warm-gray" />
                      UK Compliance
                    </Link>
                    <Link
                      href={`/org/${primaryOrg.org.slug}/settings/webhooks`}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal hover:bg-cream transition-colors"
                    >
                      <Webhook className="w-4 h-4 text-warm-gray" />
                      Webhooks
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications & User Button */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  onBlur={() => setTimeout(() => setNotifOpen(false), 200)}
                  className="relative p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount! > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[var(--card)] rounded-xl shadow-lg border border-[var(--border)] z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-charcoal">Notifications</h3>
                      {(unreadCount ?? 0) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAllAsRead({ userId: user.id });
                          }}
                          className="text-xs text-gold hover:text-gold-dark font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {!notifications || notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-warm-gray-light mx-auto mb-2" />
                          <p className="text-xs text-warm-gray">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notif: any) => {
                          const icon = notif.type === 'course_assigned' ? BookOpen :
                                       notif.type === 'course_completed' ? CheckCircle :
                                       notif.type === 'certificate_earned' ? Trophy :
                                       notif.type === 'deadline_reminder' ? AlertCircle :
                                       notif.type === 'org_invite' ? Mail : Bell;
                          const Icon = icon;
                          const timeAgo = getTimeAgo(notif.createdAt);

                          return (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (!notif.read) markAsRead({ notificationId: notif._id });
                                if (notif.linkUrl) window.location.href = notif.linkUrl;
                              }}
                              className={`px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer hover:bg-cream transition-colors ${
                                !notif.read ? 'bg-gold/5' : ''
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  !notif.read ? 'bg-gold/10' : 'bg-cream-dark'
                                }`}>
                                  <Icon className={`w-3.5 h-3.5 ${!notif.read ? 'text-gold' : 'text-warm-gray'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-relaxed ${!notif.read ? 'text-charcoal font-medium' : 'text-warm-gray'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-[10px] text-warm-gray-light mt-0.5">{timeAgo}</p>
                                </div>
                                {!notif.read && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <ThemeToggle />
            {user && (
              <Link
                href="/settings"
                className="p-2 rounded-lg text-warm-gray hover:text-charcoal hover:bg-cream-dark transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </Link>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
