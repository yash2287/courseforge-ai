"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import {
  Loader2,
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Download,
  Users,
} from "lucide-react";
import Link from "next/link";

interface ParsedMember {
  email: string;
  name?: string;
  role: "admin" | "manager" | "learner";
  valid: boolean;
  error?: string;
}

export default function ImportPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isLoaded } = useUser();

  const org = useQuery(api.organizations.getBySlug, { slug });
  const members = useQuery(
    api.orgMembers.getByOrg,
    org ? { orgId: org._id } : "skip"
  );

  const bulkInvite = useMutation(api.orgInvites.bulkInvite);

  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ invited: number; skipped: number; errors: string[] } | null>(null);

  const existingEmails = useMemo(() => {
    if (!members) return new Set<string>();
    return new Set(members.map((m: any) => m.email.toLowerCase()));
  }, [members]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      setResult(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: ParsedMember[] = results.data.map((row: any) => {
            const email = (row.email || row.Email || row.EMAIL || "").trim().toLowerCase();
            const name = (row.name || row.Name || row.NAME || row["Full Name"] || "").trim();
            const rawRole = (row.role || row.Role || row.ROLE || "learner").trim().toLowerCase();

            const validRoles = ["admin", "manager", "learner"];
            const role = validRoles.includes(rawRole) ? rawRole as "admin" | "manager" | "learner" : "learner";

            let valid = true;
            let error: string | undefined;

            if (!email || !email.includes("@")) {
              valid = false;
              error = "Invalid email address";
            } else if (existingEmails.has(email)) {
              valid = false;
              error = "Already a member";
            }

            return { email, name: name || undefined, role, valid, error };
          });

          setParsedMembers(parsed);
        },
        error: (err) => {
          console.error("CSV parse error:", err);
        },
      });
    },
    [existingEmails]
  );

  const validMembers = parsedMembers.filter((m) => m.valid);
  const invalidMembers = parsedMembers.filter((m) => !m.valid);

  const handleImport = async () => {
    if (!user || !org || validMembers.length === 0) return;
    setImporting(true);

    try {
      const res = await bulkInvite({
        orgId: org._id,
        members: validMembers.map((m) => ({
          email: m.email,
          name: m.name,
          role: m.role,
        })),
        invitedBy: user.id,
      });
      setResult(res);
    } catch (err: any) {
      setResult({ invited: 0, skipped: 0, errors: [err.message] });
    }

    setImporting(false);
  };

  const downloadTemplate = () => {
    const csv = "name,email,role\nJane Smith,jane@company.com,learner\nBob Jones,bob@company.com,manager\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "members-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isLoaded || org === undefined) {
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
          <h1 className="text-2xl font-serif text-charcoal">Import Members</h1>
          <p className="text-warm-gray text-sm mt-1">
            Bulk invite members to {org.name} by uploading a CSV file
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-[var(--border)] shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-charcoal mb-1">Upload CSV File</h2>
                <p className="text-xs text-warm-gray">
                  Your CSV should have columns: <code className="px-1 py-0.5 bg-cream-dark rounded text-[10px]">name</code>,{" "}
                  <code className="px-1 py-0.5 bg-cream-dark rounded text-[10px]">email</code>,{" "}
                  <code className="px-1 py-0.5 bg-cream-dark rounded text-[10px]">role</code> (admin, manager, or learner)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-center px-4 py-8 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-gold hover:bg-gold/5 cursor-pointer transition-colors">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-warm-gray mx-auto mb-2" />
                    <p className="text-sm text-charcoal font-medium">
                      {fileName || "Click to upload CSV"}
                    </p>
                    <p className="text-xs text-warm-gray mt-1">or drag and drop</p>
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dark font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV template
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Table */}
        {parsedMembers.length > 0 && !result && (
          <Card className="border-[var(--border)] shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-charcoal">
                  Preview ({parsedMembers.length} rows)
                </h3>
                <div className="flex items-center gap-3">
                  {validMembers.length > 0 && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      {validMembers.length} valid
                    </Badge>
                  )}
                  {invalidMembers.length > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      {invalidMembers.length} invalid
                    </Badge>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="text-left py-2 px-3 text-xs font-medium text-warm-gray">Status</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-warm-gray">Name</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-warm-gray">Email</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-warm-gray">Role</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-warm-gray">Issue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedMembers.map((member, i) => (
                      <tr
                        key={i}
                        className={`border-b border-[var(--border)] last:border-0 ${
                          !member.valid ? "bg-red-50/50" : ""
                        }`}
                      >
                        <td className="py-2 px-3">
                          {member.valid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="py-2 px-3 text-charcoal">{member.name || "—"}</td>
                        <td className="py-2 px-3 text-charcoal">{member.email}</td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {member.role}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-red-600">{member.error || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  onClick={handleImport}
                  disabled={validMembers.length === 0 || importing}
                  className="bg-charcoal text-gold hover:bg-charcoal/90"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Invite {validMembers.length} Member{validMembers.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedMembers([]);
                    setFileName("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="border-[var(--border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-charcoal">Import Complete</h3>
                  <p className="text-xs text-warm-gray">
                    {result.invited} invited, {result.skipped} skipped
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <p className="text-xs font-medium text-amber-800">Some issues occurred:</p>
                  </div>
                  <ul className="text-xs text-amber-700 ml-5 list-disc">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedMembers([]);
                    setFileName("");
                    setResult(null);
                  }}
                >
                  Import More
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
