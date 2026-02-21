"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import {
  ArrowLeft,
  Webhook,
  Plus,
  Trash2,
  Play,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const WEBHOOK_EVENTS = [
  { value: "course.assigned", label: "Course Assigned", desc: "When a course is assigned to a user" },
  { value: "course.completed", label: "Course Completed", desc: "When a user completes a course" },
  { value: "quiz.passed", label: "Quiz Passed", desc: "When a user passes a quiz" },
  { value: "certificate.issued", label: "Certificate Issued", desc: "When a certificate is generated" },
  { value: "member.added", label: "Member Added", desc: "When a new member joins the org" },
];

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WebhooksPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const endpoints = useQuery(
    api.webhooks.listByOrg,
    org ? { orgId: org._id } : "skip"
  );

  const createEndpoint = useMutation(api.webhooks.create);
  const updateEndpoint = useMutation(api.webhooks.update);
  const removeEndpoint = useMutation(api.webhooks.remove);
  const rotateSecret = useMutation(api.webhooks.rotateSecret);
  const sendTest = useMutation(api.webhooks.sendTestEvent);

  const [showForm, setShowForm] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isLoaded || org === undefined) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      </>
    );
  }

  if (!org || !user) return null;

  const handleCreate = async () => {
    if (!formUrl || formEvents.length === 0) return;
    setCreating(true);
    try {
      await createEndpoint({
        orgId: org._id,
        url: formUrl,
        events: formEvents,
        description: formDesc || undefined,
        createdBy: user.id,
      });
      setFormUrl("");
      setFormDesc("");
      setFormEvents([]);
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-6 max-w-4xl py-10 space-y-8 animate-fade-up">
        {/* Header */}
        <div>
          <Link
            href={`/org/${slug}/dashboard`}
            className="inline-flex items-center gap-2 text-warm-gray hover:text-[var(--foreground)] text-sm transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold mb-2">
            Integrations
          </p>
          <h1 className="text-3xl md:text-4xl font-light text-[var(--foreground)] tracking-tight">
            Webhook <span className="font-serif italic">Endpoints</span>
          </h1>
          <p className="text-warm-gray text-sm mt-1">
            Receive real-time event notifications via HTTP POST requests.
          </p>
        </div>

        {/* Add Endpoint */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Endpoint
          </Button>
        ) : (
          <div className="card-premium rounded-xl bg-[var(--card)] border border-[var(--border)] p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              New Webhook Endpoint
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-warm-gray block mb-1.5">
                  Endpoint URL
                </label>
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com/webhooks"
                  type="url"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-warm-gray block mb-1.5">
                  Description (optional)
                </label>
                <Input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Production webhook for Slack notifications"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-warm-gray block mb-1.5">
                  Events to subscribe
                </label>
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((evt) => (
                    <label
                      key={evt.value}
                      className="flex items-start gap-3 p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formEvents.includes(evt.value)}
                        onChange={() => toggleEvent(evt.value)}
                        className="mt-0.5 accent-[var(--gold)]"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--foreground)]">
                          {evt.label}
                        </span>
                        <p className="text-xs text-warm-gray">{evt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleCreate}
                disabled={!formUrl || formEvents.length === 0 || creating}
                className="bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Endpoint
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setFormUrl("");
                  setFormDesc("");
                  setFormEvents([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Endpoints List */}
        {!endpoints ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : endpoints.length === 0 && !showForm ? (
          <div className="text-center py-16 card-premium rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <Webhook className="w-10 h-10 text-warm-gray mx-auto mb-3 opacity-40" />
            <p className="text-warm-gray text-sm">No webhook endpoints configured.</p>
            <p className="text-warm-gray text-xs mt-1 opacity-70">
              Add an endpoint to start receiving event notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {endpoints.map((ep) => (
              <EndpointCard
                key={ep._id}
                endpoint={ep}
                expanded={expandedId === ep._id}
                onToggle={() =>
                  setExpandedId(expandedId === ep._id ? null : ep._id)
                }
                onUpdate={updateEndpoint}
                onRemove={() => {
                  if (confirm("Delete this webhook endpoint and all its delivery history?")) {
                    removeEndpoint({ endpointId: ep._id });
                  }
                }}
                onRotateSecret={() => rotateSecret({ endpointId: ep._id })}
                onSendTest={() => sendTest({ endpointId: ep._id })}
                orgId={org._id}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function EndpointCard({
  endpoint,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
  onRotateSecret,
  onSendTest,
  orgId,
}: {
  endpoint: any;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: any;
  onRemove: () => void;
  onRotateSecret: () => void;
  onSendTest: () => void;
  orgId: Id<"organizations">;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const deliveries = useQuery(
    api.webhooks.getDeliveries,
    expanded ? { endpointId: endpoint._id, limit: 20 } : "skip"
  );

  const handleTest = async () => {
    setTesting(true);
    try {
      await onSendTest();
    } finally {
      setTimeout(() => setTesting(false), 2000);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(endpoint.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-premium rounded-xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--secondary)] transition-colors"
        onClick={onToggle}
      >
        <div
          className={`h-2 w-2 rounded-full flex-shrink-0 ${
            endpoint.active ? "bg-emerald-500" : "bg-warm-gray"
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--foreground)] truncate">
            {endpoint.url}
          </p>
          {endpoint.description && (
            <p className="text-xs text-warm-gray truncate">
              {endpoint.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {endpoint.events.map((evt: string) => (
            <span
              key={evt}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/10 text-gold"
            >
              {evt.split(".")[1]}
            </span>
          ))}
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-warm-gray flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-warm-gray flex-shrink-0" />
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[var(--border)] p-4 space-y-4">
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate({
                  endpointId: endpoint._id,
                  active: !endpoint.active,
                });
              }}
            >
              {endpoint.active ? "Disable" : "Enable"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleTest();
              }}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 mr-1.5" />
              )}
              Send Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Rotate the signing secret? The old secret will stop working immediately.")) {
                  onRotateSecret();
                }
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Rotate Secret
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>

          {/* Signing Secret */}
          <div className="bg-[var(--secondary)] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-warm-gray">
                Signing Secret
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1 rounded text-warm-gray hover:text-[var(--foreground)]"
                >
                  {showSecret ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={handleCopySecret}
                  className="p-1 rounded text-warm-gray hover:text-[var(--foreground)]"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <code className="text-xs font-mono text-[var(--foreground)]">
              {showSecret ? endpoint.secret : "whsec_" + "\u2022".repeat(32)}
            </code>
          </div>

          {/* Delivery Log */}
          <div>
            <h4 className="text-xs font-semibold text-[var(--foreground)] mb-2">
              Recent Deliveries
            </h4>
            {!deliveries ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-warm-gray" />
              </div>
            ) : deliveries.length === 0 ? (
              <p className="text-xs text-warm-gray py-4 text-center">
                No deliveries yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {deliveries.map((d: any) => (
                  <div
                    key={d._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--secondary)] text-xs"
                  >
                    {d.status === "delivered" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    ) : d.status === "failed" ? (
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-[var(--foreground)] min-w-[120px]">
                      {d.event}
                    </span>
                    <span className="text-warm-gray">
                      {d.statusCode ? `HTTP ${d.statusCode}` : "Pending"}
                    </span>
                    <span className="text-warm-gray">
                      {d.attempts} attempt{d.attempts !== 1 ? "s" : ""}
                    </span>
                    <span className="text-warm-gray ml-auto">
                      {timeAgo(d.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
