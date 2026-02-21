"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Trophy,
  Flame,
  Award,
  Star,
  Medal,
} from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const leaderboard = useQuery(
    api.gamification.getLeaderboard,
    org ? { orgId: org._id, limit: 20 } : "skip"
  );
  const myStats = useQuery(
    api.gamification.getUserStats,
    isLoaded && user ? { userId: user.id } : "skip"
  );

  if (!isLoaded || org === undefined || leaderboard === undefined) {
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-warm-gray w-5 text-center">{index + 1}</span>;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "silver": return "bg-[var(--secondary)] text-warm-gray border-[var(--border)]";
      case "bronze": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-cream-dark text-warm-gray";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/org/${slug}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-serif text-charcoal">Leaderboard</h1>
          <p className="text-warm-gray text-sm mt-1">
            Top learners in {org.name}
          </p>
        </div>

        {/* My Stats (if logged in) */}
        {myStats && (
          <Card className="border-[var(--border)] shadow-sm mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-warm-gray font-medium">Your Stats</p>
                  <p className="text-2xl font-bold text-charcoal">{myStats.totalPoints} pts</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-lg font-bold text-charcoal">{myStats.currentStreak}</span>
                    </div>
                    <p className="text-[10px] text-warm-gray">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Award className="w-4 h-4 text-gold" />
                      <span className="text-lg font-bold text-charcoal">{myStats.achievements.length}</span>
                    </div>
                    <p className="text-[10px] text-warm-gray">Badges Earned</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-lg font-bold text-charcoal">{myStats.longestStreak}</span>
                    </div>
                    <p className="text-[10px] text-warm-gray">Best Streak</p>
                  </div>
                </div>
              </div>

              {/* Achievement badges */}
              {myStats.allAchievements.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs font-medium text-warm-gray mb-2">Achievements</p>
                  <div className="flex flex-wrap gap-2">
                    {myStats.allAchievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ${
                          achievement.earned
                            ? getTierColor(achievement.tier)
                            : "bg-[var(--secondary)] text-warm-gray-light border-[var(--border)] opacity-40"
                        }`}
                        title={achievement.description}
                      >
                        <span className="font-medium">{achievement.name}</span>
                        {achievement.earned && <span className="text-[10px]">+{achievement.points}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card className="border-[var(--border)] shadow-sm">
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="py-16 text-center">
                <Trophy className="w-10 h-10 text-warm-gray-light mx-auto mb-3" />
                <p className="text-sm text-warm-gray">No activity yet. Start learning to earn points!</p>
              </div>
            ) : (
              <div>
                {leaderboard.map((entry, index) => {
                  const isMe = user?.id === entry.userId;
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-0 ${
                        isMe ? "bg-gold/5" : index < 3 ? "bg-cream/50" : ""
                      }`}
                    >
                      <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                      <div className="h-8 w-8 rounded-full bg-cream-dark flex items-center justify-center text-sm font-bold text-charcoal">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isMe ? "text-gold" : "text-charcoal"}`}>
                          {entry.name} {isMe && "(You)"}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-warm-gray">
                          <span className="flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />
                            {entry.currentStreak}d streak
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Award className="w-3 h-3" />
                            {entry.achievementCount} badges
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-charcoal">{entry.totalPoints}</p>
                        <p className="text-[10px] text-warm-gray">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
