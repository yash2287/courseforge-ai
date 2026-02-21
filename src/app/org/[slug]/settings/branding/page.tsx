"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  Palette,
  Check,
  Image,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function BrandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const updateBranding = useMutation(api.organizations.updateBranding);

  const [primaryColor, setPrimaryColor] = useState("#1a1a1a");
  const [secondaryColor, setSecondaryColor] = useState("#d4a843");
  const [logoUrl, setLogoUrl] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [certificateFooter, setCertificateFooter] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (org?.branding) {
      setPrimaryColor(org.branding.primaryColor || "#1a1a1a");
      setSecondaryColor(org.branding.secondaryColor || "#d4a843");
      setLogoUrl(org.branding.logoUrl || "");
      setCompanyUrl(org.branding.companyUrl || "");
      setCertificateFooter(org.branding.certificateFooter || "");
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
    await updateBranding({
      orgId: org._id,
      userId: user.id,
      branding: {
        primaryColor,
        secondaryColor,
        logoUrl: logoUrl || undefined,
        companyUrl: companyUrl || undefined,
        certificateFooter: certificateFooter || undefined,
      },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              <Palette className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-charcoal">Branding</h1>
              <p className="text-warm-gray text-sm mt-0.5">
                Customize how {org.name} appears on courses and certificates
              </p>
            </div>
          </div>

          {/* Settings nav */}
          <div className="flex items-center gap-4 mt-6 border-b border-[var(--border)] pb-0">
            <span className="text-sm text-charcoal font-medium pb-3 border-b-2 border-gold">
              Branding
            </span>
            <Link
              href={`/org/${slug}/settings/sso`}
              className="text-sm text-warm-gray hover:text-charcoal pb-3 transition-colors"
            >
              SSO
            </Link>
          </div>
        </div>

        {/* Color Settings */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-charcoal mb-4">Brand Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-warm-gray mb-1 block">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 rounded-md border border-[var(--border)] cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="border-[var(--border)] font-mono text-sm"
                    placeholder="#1a1a1a"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-warm-gray mb-1 block">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-12 rounded-md border border-[var(--border)] cursor-pointer"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="border-[var(--border)] font-mono text-sm"
                    placeholder="#d4a843"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-xl border border-[var(--border)]">
              <p className="text-xs text-warm-gray mb-2">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  {org.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {org.name}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  className="px-3 py-1.5 rounded-md text-xs font-medium"
                  style={{ backgroundColor: secondaryColor + "20", color: primaryColor, border: `1px solid ${secondaryColor}` }}
                >
                  Secondary Button
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo & Links */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-charcoal mb-4">Company Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-warm-gray mb-1 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" />
                  Logo URL
                </label>
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="border-[var(--border)]"
                />
                <p className="text-[10px] text-warm-gray mt-1">
                  Displayed on certificates and course pages. Recommended: 200x60px PNG.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-warm-gray mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Company Website
                </label>
                <Input
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="border-[var(--border)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-warm-gray mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Certificate Footer Text
                </label>
                <Input
                  value={certificateFooter}
                  onChange={(e) => setCertificateFooter(e.target.value)}
                  placeholder="e.g. Issued by Acme Corp Training Department"
                  className="border-[var(--border)]"
                />
                <p className="text-[10px] text-warm-gray mt-1">
                  Custom text shown at the bottom of certificates issued for this org.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              "Save Branding"
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
