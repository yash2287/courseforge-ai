"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  Shield,
  Check,
  Plus,
  X,
  Globe,
  Info,
  Users,
} from "lucide-react";
import Link from "next/link";

const SSO_PROVIDERS = [
  { value: "okta", label: "Okta Workforce" },
  { value: "azure_ad", label: "Microsoft Azure AD" },
  { value: "google_workspace", label: "Google Workspace" },
  { value: "custom", label: "Custom SAML Provider" },
];

export default function SsoSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const domains = useQuery(
    api.sso.getDomainsByOrg,
    org ? { orgId: org._id } : "skip"
  );
  const departments = useQuery(
    api.sso.getSsoConfig,
    org ? { orgId: org._id } : "skip"
  );

  const updateSsoConfig = useMutation(api.sso.updateSsoConfig);
  const addDomain = useMutation(api.sso.addDomain);
  const removeDomain = useMutation(api.sso.removeDomain);

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<string>("");
  const [defaultRole, setDefaultRole] = useState<"admin" | "manager" | "learner">("learner");
  const [autoProvision, setAutoProvision] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");

  useEffect(() => {
    if (org?.ssoConfig) {
      setEnabled(org.ssoConfig.enabled);
      setProvider(org.ssoConfig.provider || "");
      setDefaultRole(org.ssoConfig.defaultRole);
      setAutoProvision(org.ssoConfig.autoProvision);
    }
  }, [org]);

  if (!isLoaded || org === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (!org || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSsoConfig({
        orgId: org._id,
        userId: user.id,
        ssoConfig: {
          enabled,
          provider: provider || undefined,
          defaultRole,
          autoProvision,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to update SSO config:", err);
    }
    setSaving(false);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setDomainError("");
    setAddingDomain(true);
    try {
      await addDomain({
        orgId: org._id,
        userId: user.id,
        domain: newDomain.trim(),
      });
      setNewDomain("");
    } catch (err: any) {
      setDomainError(err.message || "Failed to add domain");
    }
    setAddingDomain(false);
  };

  const handleRemoveDomain = async (domainId: any) => {
    try {
      await removeDomain({
        orgId: org._id,
        userId: user.id,
        domainId,
      });
    } catch (err) {
      console.error("Failed to remove domain:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/org/${slug}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-warm-gray hover:text-charcoal transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-charcoal">
                Single Sign-On (SSO)
              </h1>
              <p className="text-warm-gray text-sm mt-0.5">
                Configure enterprise SSO for {org.name}
              </p>
            </div>
          </div>

          {/* Settings nav */}
          <div className="flex items-center gap-4 mt-6 border-b border-[var(--border)] pb-0">
            <Link
              href={`/org/${slug}/settings/branding`}
              className="text-sm text-warm-gray hover:text-charcoal pb-3 transition-colors"
            >
              Branding
            </Link>
            <span className="text-sm text-charcoal font-medium pb-3 border-b-2 border-gold">
              SSO
            </span>
          </div>
        </div>

        {/* Enable/Disable SSO */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-charcoal">
                  Enable SSO
                </h2>
                <p className="text-xs text-warm-gray mt-1">
                  Allow members to sign in using your corporate identity
                  provider
                </p>
              </div>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled ? "bg-gold" : "bg-warm-gray-light/30"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-[var(--card)] shadow-sm transition-transform ${
                    enabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {enabled && (
          <>
            {/* Provider Selection */}
            <Card className="border-[var(--border)] shadow-sm mb-6">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold text-charcoal mb-4">
                  Identity Provider
                </h2>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="border-[var(--border)]">
                    <SelectValue placeholder="Select your identity provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {SSO_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-warm-gray mt-2">
                  You must also configure the SAML connection in your Clerk
                  Dashboard under Enterprise Connections.
                </p>
              </CardContent>
            </Card>

            {/* Domain Management */}
            <Card className="border-[var(--border)] shadow-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-warm-gray" />
                  <h2 className="text-sm font-semibold text-charcoal">
                    Email Domains
                  </h2>
                </div>
                <p className="text-xs text-warm-gray mb-4">
                  Users with these email domains will be auto-provisioned into
                  your organization when they sign in via SSO.
                </p>

                {/* Existing domains */}
                {domains && domains.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {domains.map((d) => (
                      <div
                        key={d._id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-cream-dark/50 border border-[var(--border)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-charcoal font-mono">
                            {d.domain}
                          </span>
                          {d.verified ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-green-200 text-green-700 bg-green-50"
                            >
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-200 text-amber-700 bg-amber-50"
                            >
                              Pending
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveDomain(d._id)}
                          className="text-warm-gray hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new domain */}
                <div className="flex items-center gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => {
                      setNewDomain(e.target.value);
                      setDomainError("");
                    }}
                    placeholder="acme.com"
                    className="border-[var(--border)] font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddDomain();
                    }}
                  />
                  <Button
                    onClick={handleAddDomain}
                    disabled={addingDomain || !newDomain.trim()}
                    variant="outline"
                    className="border-[var(--border)] shrink-0"
                  >
                    {addingDomain ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {domainError && (
                  <p className="text-xs text-red-500 mt-2">{domainError}</p>
                )}
              </CardContent>
            </Card>

            {/* Provisioning Settings */}
            <Card className="border-[var(--border)] shadow-sm mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-warm-gray" />
                  <h2 className="text-sm font-semibold text-charcoal">
                    Auto-Provisioning
                  </h2>
                </div>

                {/* Auto-provision toggle */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-charcoal">
                      Automatically add users
                    </p>
                    <p className="text-xs text-warm-gray mt-0.5">
                      When a user with a matching email domain signs in via SSO,
                      automatically add them as a member
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoProvision(!autoProvision)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoProvision ? "bg-gold" : "bg-warm-gray-light/30"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-[var(--card)] shadow-sm transition-transform ${
                        autoProvision ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Default role */}
                <div>
                  <label className="text-xs font-medium text-warm-gray mb-1 block">
                    Default Role for SSO Users
                  </label>
                  <Select
                    value={defaultRole}
                    onValueChange={(v) =>
                      setDefaultRole(v as "admin" | "manager" | "learner")
                    }
                  >
                    <SelectTrigger className="border-[var(--border)] max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-warm-gray mt-1">
                    Users with existing invites will receive the higher of the
                    two roles.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Setup Instructions */}
            <Card className="border-[var(--border)] shadow-sm mb-6 bg-blue-50/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h2 className="text-sm font-semibold text-charcoal mb-2">
                      Clerk Dashboard Setup Required
                    </h2>
                    <p className="text-xs text-warm-gray mb-3">
                      SSO connections are configured in your Clerk Dashboard.
                      Complete these steps to finish setup:
                    </p>
                    <ol className="text-xs text-warm-gray space-y-1.5 list-decimal list-inside">
                      <li>
                        Go to your{" "}
                        <span className="font-medium text-charcoal">
                          Clerk Dashboard
                        </span>{" "}
                        &rarr; SSO Connections
                      </li>
                      <li>
                        Click{" "}
                        <span className="font-medium text-charcoal">
                          Add Enterprise Connection
                        </span>
                      </li>
                      <li>
                        Select your identity provider (
                        {SSO_PROVIDERS.find((p) => p.value === provider)
                          ?.label || "your provider"}
                        )
                      </li>
                      <li>
                        Enter your email domain(s):{" "}
                        <span className="font-mono text-charcoal">
                          {domains && domains.length > 0
                            ? domains.map((d) => d.domain).join(", ")
                            : "your-domain.com"}
                        </span>
                      </li>
                      <li>
                        Copy the SSO URL and certificate from your IdP and paste
                        them in Clerk
                      </li>
                      <li>
                        Add the{" "}
                        <span className="font-medium text-charcoal">
                          Webhook endpoint
                        </span>{" "}
                        URL in Clerk Dashboard &rarr; Webhooks for{" "}
                        <span className="font-mono text-charcoal">
                          user.created
                        </span>{" "}
                        events
                      </li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-charcoal text-gold hover:bg-charcoal/90"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save SSO Settings"
            )}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
