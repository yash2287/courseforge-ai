'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { TEMPLATE_CATEGORIES, SYSTEM_TEMPLATES } from '@/lib/system-templates';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Loader2,
  BookOpen,
  Layers,
  ArrowRight,
  Sparkles,
  Shield,
  HardHat,
  Users,
  Scale,
  Flame,
  Eye,
  UserPlus,
  Home,
  Briefcase,
  MessageSquare,
  Clock,
  FolderKanban,
  Headphones,
  TrendingUp,
  Crown,
  GraduationCap,
  FileText,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Shield, HardHat, Users, Scale, Flame, Eye,
  UserPlus, Home, Briefcase, MessageSquare, Clock,
  FolderKanban, Headphones, TrendingUp,
  Crown, GraduationCap, FileText, Sparkles, BookOpen,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  intermediate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  advanced: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const isSeeded = useQuery(api.courseTemplates.isSeeded);
  const seedTemplates = useMutation(api.courseTemplates.seedSystemTemplates);
  const recordUsage = useMutation(api.courseTemplates.recordUsage);

  const templates = useQuery(
    api.courseTemplates.list,
    isSeeded === false ? 'skip' : { category: selectedCategory }
  );

  // Auto-seed on first visit
  useEffect(() => {
    if (isSeeded === false) {
      seedTemplates({ templates: SYSTEM_TEMPLATES }).catch(console.error);
    }
  }, [isSeeded, seedTemplates]);

  const filtered = useMemo(() => {
    if (!templates) return [];
    return templates.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty =
        difficultyFilter === 'all' || t.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [templates, searchQuery, difficultyFilter]);

  const handleUseTemplate = async (templateId: string) => {
    await recordUsage({ templateId: templateId as any });
    router.push(`/courses/create?templateId=${templateId}`);
  };

  const loading = isSeeded === undefined || (isSeeded && templates === undefined);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* ── Header ── */}
        <div className="mb-10 animate-fade-up">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-warm-gray hover:text-[var(--foreground)] text-sm transition-colors mb-4"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
                Templates
              </p>
              <h1 className="text-3xl md:text-4xl font-light text-[var(--foreground)] tracking-tight">
                Course <span className="font-serif italic">Library</span>
              </h1>
              <p className="text-warm-gray mt-2 max-w-lg text-sm leading-relaxed">
                Start from a proven template and generate a customised course in
                minutes. Compliance, onboarding, skills — all pre-configured for AI
                generation.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-warm-gray tabular-nums">
              <LayoutGrid className="w-4 h-4 text-gold" />
              <span className="font-medium text-[var(--foreground)]">
                {filtered.length}
              </span>{' '}
              templates
            </div>
          </div>
        </div>

        {/* ── Filters Bar ── */}
        <div className="mb-8 space-y-4 animate-fade-up delay-100">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                      : 'bg-[var(--secondary)] text-warm-gray hover:text-[var(--foreground)] hover:bg-[var(--border)]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search + Difficulty */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-gray-light pointer-events-none" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--card)]"
              />
            </div>

            <div className="flex gap-1.5">
              {['all', 'beginner', 'intermediate', 'advanced'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficultyFilter(d)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                    difficultyFilter === d
                      ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                      : 'text-warm-gray hover:text-[var(--foreground)] hover:bg-[var(--secondary)]'
                  }`}
                >
                  {d === 'all' ? 'Any Level' : d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
            <p className="text-warm-gray text-sm">Loading templates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <BookOpen className="w-8 h-8 text-warm-gray-light" />
            <p className="text-warm-gray text-sm">No templates match your filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
                setSelectedCategory('all');
              }}
              className="text-gold text-sm font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((template, i) => {
              const Icon = ICON_MAP[template.icon] || BookOpen;
              return (
                <div
                  key={template._id}
                  className="card-premium rounded-xl bg-[var(--card)] p-0 overflow-hidden group animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                >
                  {/* Card Top Accent */}
                  <div className="h-1 bg-gradient-to-r from-gold/60 via-gold/20 to-transparent" />

                  <div className="p-6 flex flex-col h-full">
                    {/* Icon + Difficulty */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-11 w-11 rounded-xl bg-[var(--secondary)] flex items-center justify-center transition-colors group-hover:bg-gold/10">
                        <Icon className="w-5 h-5 text-gold" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold uppercase tracking-wider border-0 ${DIFFICULTY_COLORS[template.difficulty]}`}
                      >
                        {template.difficulty}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-1.5 leading-snug">
                      {template.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-warm-gray leading-relaxed mb-4 line-clamp-2 flex-1">
                      {template.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-warm-gray mb-4">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {template.moduleCount} modules
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        {template.lessonCount} lessons
                      </span>
                      {template.estimatedDuration && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {template.estimatedDuration}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[10px] font-medium text-warm-gray"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] text-warm-gray-light">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => handleUseTemplate(template._id)}
                      className="w-full bg-[var(--foreground)] hover:bg-[var(--foreground)]/90 text-[var(--background)] rounded-lg text-sm font-medium gap-2 group/btn"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Use Template
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
