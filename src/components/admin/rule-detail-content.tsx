"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/formatters";
import {
  ArrowLeft,
  Check,
  X,
  Calendar,
  User,
  Clock,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  Archive,
  AlertTriangle,
  MessageSquare,
  Trophy,
  Dices,
  Ticket,
  Gamepad2,
  Layers,
  ArrowUpRight,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { TaxRule, RuleVersion } from "@/types";

/* ── status config ─────────────────────────────────────────── */
const statusConfig: Record<
  string,
  { label: string; dot: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  active: { label: "Active", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ShieldCheck },
  pending_approval: { label: "Pending Approval", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: ShieldAlert },
  draft: { label: "Draft", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: AlertTriangle },
  deprecated: { label: "Deprecated", dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", icon: Archive },
  approved: { label: "Approved", dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: Check },
  pending: { label: "Pending", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  rejected: { label: "Rejected", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: Ban },
};

const gameTypeIcons: Record<string, React.ElementType> = {
  sports_betting: Trophy,
  casino: Dices,
  lottery: Ticket,
  virtual: Gamepad2,
};

const gameTypeLabels: Record<string, string> = {
  sports_betting: "Sports Betting",
  casino: "Casino",
  lottery: "Lottery",
  virtual: "Virtual Games",
};

/* ── version timeline node ─────────────────────────────────── */
function VersionNode({ version, isLatest, isFirst }: { version: RuleVersion; isLatest: boolean; isFirst: boolean }) {
  const sc = statusConfig[version.status] ?? statusConfig.approved;
  const StatusIcon = sc.icon;

  return (
    <div className="relative flex gap-4 group">
      {/* timeline rail */}
      <div className="flex flex-col items-center pt-0.5">
        <div
          className={`z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 transition-shadow ${
            isLatest
              ? `${sc.bg} ${sc.border} shadow-sm`
              : "bg-muted border-muted-foreground/20"
          }`}
        >
          <StatusIcon className={`h-3.5 w-3.5 ${isLatest ? sc.text : "text-muted-foreground"}`} />
        </div>
        {!isFirst && <div className="w-px flex-1 bg-border -mt-0" />}
      </div>

      {/* content */}
      <div className={`flex-1 pb-6 ${isLatest ? "" : "opacity-80"}`}>
        {/* header row */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-sm font-semibold ${isLatest ? "text-foreground" : "text-muted-foreground"}`}>
            v{version.version}
          </span>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${sc.border} ${sc.text}`}>
            {sc.label}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatDate(version.changedAt)}
          </span>
        </div>

        {/* change description */}
        <p className="text-sm leading-relaxed">{version.changes}</p>

        {/* author + approver */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {version.changedBy}
          </span>
          {version.approvedBy && (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-600" />
              Approved by {version.approvedBy}
            </span>
          )}
        </div>

        {/* comment */}
        {version.comment && (
          <div className="mt-2 flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border/60">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              &ldquo;{version.comment}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main component ────────────────────────────────────────── */
interface RuleDetailContentProps {
  rule: TaxRule;
}

export function RuleDetailContent({ rule }: RuleDetailContentProps) {
  const sc = statusConfig[rule.status] ?? statusConfig.active;
  const GameIcon = gameTypeIcons[rule.gameType] ?? Layers;

  const handleApprove = () => {
    toast.success("Rule approved successfully", {
      description: `${rule.name} is now active`,
    });
  };

  const handleReject = () => {
    toast.error("Rule rejected", {
      description: "The rule has been sent back for revision",
    });
  };

  // reverse versions so latest is on top
  const sortedVersions = [...(rule.versions ?? [])].reverse();

  return (
    <div className="space-y-6">
      {/* ── back + header ──────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link href="/rules">
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Back to rules">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <PageHeader title={rule.name} description={rule.description}>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${sc.bg} ${sc.border} ${sc.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
          </PageHeader>
        </div>
      </div>

      {/* ── quick stats strip ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* tax rate */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Tax Rate</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold tabular-nums">{Math.round(rule.taxRate * 100)}</span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">of GGR</p>
        </Card>

        {/* game type */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Game Type</p>
          <div className="flex items-center gap-2">
            <GameIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold text-sm">{gameTypeLabels[rule.gameType] ?? rule.gameType.replace("_", " ")}</span>
          </div>
        </Card>

        {/* effective dates */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Effective</p>
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{formatDate(rule.effectiveFrom)}</span>
          </div>
          {rule.effectiveTo && (
            <p className="text-[11px] text-destructive mt-0.5">
              Ends {formatDate(rule.effectiveTo)}
            </p>
          )}
        </Card>

        {/* version count */}
        <Card className="p-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Revisions</p>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold tabular-nums">{rule.versions?.length ?? 0}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">version{(rule.versions?.length ?? 0) !== 1 ? "s" : ""}</p>
        </Card>
      </div>

      {/* ── two-column layout ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* left: details (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* exemptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                Exemptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rule.exemptions && rule.exemptions.length > 0 ? (
                <div className="space-y-2">
                  {rule.exemptions.map((exemption, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10 text-primary shrink-0">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{exemption.description}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1 h-5 px-1.5 py-0">
                          {exemption.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Ban className="h-4 w-4" />
                  No exemptions configured for this rule
                </div>
              )}
            </CardContent>
          </Card>

          {/* provenance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Provenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Created by</p>
                  <p className="font-medium">{rule.createdBy || "System"}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Created on</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{formatDate(rule.createdAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* right: version timeline (2/5) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                Version History
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 py-0 ml-auto">
                  {sortedVersions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* continuous rail behind the nodes */}
                <div className="absolute left-[15px] top-4 bottom-0 w-px bg-border" />

                {sortedVersions.map((version, index) => (
                  <VersionNode
                    key={version.version}
                    version={version}
                    isLatest={index === 0}
                    isFirst={index === sortedVersions.length - 1}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── approval CTA ───────────────────────────────── */}
      {rule.status === "pending_approval" && (
        <Card className="border-2 border-amber-200 bg-amber-50/60 overflow-hidden relative">
          <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
          <CardContent className="py-5 pl-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100">
                  <ShieldAlert className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">Approval Required</p>
                  <p className="text-sm text-amber-700/80">
                    Review the changes in the version timeline and take action.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
