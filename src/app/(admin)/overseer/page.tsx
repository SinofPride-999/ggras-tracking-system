"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ApiRequestError,
  getAdminOverview,
  getCurrentUser,
  getDevelopers,
  getMilestones,
  getProgressReports,
  inviteDeveloper,
  login,
  seedFromMdPlans,
  startProject,
  submitProgressReport,
} from "@/lib/tracker/api";
import { TRACKER_TOKEN_KEY } from "@/lib/tracker/constants";
import type {
  AdminOverview,
  Milestone,
  ProgressReport,
  RiskLevel,
  SnapshotStatus,
  TrackerDeveloper,
  TrackerProjectState,
  TrackerUser,
} from "@/types/tracker";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldAlert,
  Timer,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

const statusBadgeMap: Record<SnapshotStatus, string> = {
  on_track: "bg-emerald-100 text-emerald-700 border-emerald-200",
  watch: "bg-amber-100 text-amber-700 border-amber-200",
  at_risk: "bg-red-100 text-red-700 border-red-200",
  not_started: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusLabelMap: Record<SnapshotStatus, string> = {
  on_track: "On Track",
  watch: "Watch",
  at_risk: "At Risk",
  not_started: "Not Started",
};

const riskOptions: RiskLevel[] = ["low", "medium", "high", "critical"];

interface ReportFormState {
  developerId: string;
  reportDate: string;
  summary: string;
  achievements: string;
  blockers: string;
  plannedNext: string;
  hoursWorked: string;
  completionRate: string;
  riskLevel: RiskLevel;
}

function parseLines(input: string) {
  return input
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatShortDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function getCountdownLabel(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (Number.isNaN(diff)) return "N/A";
  if (diff <= 0) return "expired";

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}

export default function OverseerPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<TrackerUser | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [project, setProject] = useState<TrackerProjectState | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [developers, setDevelopers] = useState<TrackerDeveloper[]>([]);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const [email, setEmail] = useState("admin@ggras.gov.gh");
  const [password, setPassword] = useState("Admin@123");

  const [reportForm, setReportForm] = useState<ReportFormState>({
    developerId: "",
    reportDate: new Date().toISOString().slice(0, 10),
    summary: "",
    achievements: "",
    blockers: "",
    plannedNext: "",
    hoursWorked: "8",
    completionRate: "50",
    riskLevel: "medium",
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteDeveloperId, setInviteDeveloperId] = useState("");
  const [inviteSalaryMonthly, setInviteSalaryMonthly] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [seedLoading, setSeedLoading] = useState(false);
  const [startProjectLoading, setStartProjectLoading] = useState(false);
  const [projectStartDate, setProjectStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const developerMap = useMemo(() => {
    return new Map(developers.map((developer) => [developer.id, developer]));
  }, [developers]);

  const inviteDeveloperOptions = useMemo(
    () =>
      [...developers].sort((a, b) => {
        const assignedDelta = Number(Boolean(a.assignedUserId)) - Number(Boolean(b.assignedUserId));
        if (assignedDelta !== 0) return assignedDelta;
        return a.id.localeCompare(b.id);
      }),
    [developers],
  );

  const selectedInviteDeveloper = useMemo(
    () => developers.find((developer) => developer.id === inviteDeveloperId) || null,
    [developers, inviteDeveloperId],
  );

  const hasOpenInviteSlot = useMemo(
    () => inviteDeveloperOptions.some((developer) => !developer.assignedUserId),
    [inviteDeveloperOptions],
  );

  const loadDashboard = useCallback(
    async (accessToken: string, requestedWeek?: string) => {
      setLoading(true);
      try {
        const overviewPayload = await getAdminOverview(accessToken, requestedWeek);
        const effectiveWeekStart = overviewPayload.weekStart;

        const [milestonesPayload, developersPayload, reportsPayload] = await Promise.all([
          getMilestones(accessToken, effectiveWeekStart),
          getDevelopers(accessToken),
          getProgressReports(accessToken, effectiveWeekStart),
        ]);

        setOverview(overviewPayload);
        setProject(overviewPayload.project);
        setMilestones(milestonesPayload.items);
        setDevelopers(developersPayload.items);
        setReports(reportsPayload.items);
        setWeekStart(effectiveWeekStart);
        setInviteDeveloperId((previous) => {
          const hasCurrent = developersPayload.items.some(
            (developer) => developer.id === previous && !developer.assignedUserId,
          );
          if (hasCurrent) return previous;
          const nextAvailable = developersPayload.items.find(
            (developer) => !developer.assignedUserId,
          );
          return nextAvailable?.id || "";
        });

        setReportForm((previous) => ({
          ...previous,
          developerId:
            previous.developerId ||
            developersPayload.items[0]?.id ||
            milestonesPayload.items[0]?.developerId ||
            "",
        }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load dashboard data.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedInviteDeveloper) return;
    setInviteName(selectedInviteDeveloper.name || "");
    setInviteSalaryMonthly(
      selectedInviteDeveloper.salaryMonthly
        ? String(selectedInviteDeveloper.salaryMonthly)
        : "",
    );
  }, [selectedInviteDeveloper]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TRACKER_TOKEN_KEY);
    if (!storedToken) {
      setBooting(false);
      return;
    }

    setToken(storedToken);

    (async () => {
      try {
        const userPayload = await getCurrentUser(storedToken);
        setUser(userPayload.user);
        if (userPayload.user.role !== "admin") {
          toast.error("Only admins can access the overseer dashboard.");
          window.localStorage.removeItem(TRACKER_TOKEN_KEY);
          setToken("");
          setUser(null);
          return;
        }
        await loadDashboard(storedToken);
      } catch {
        window.localStorage.removeItem(TRACKER_TOKEN_KEY);
        setToken("");
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [loadDashboard]);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const loginPayload = await login(email, password);
      if (!loginPayload.token || !loginPayload.user) {
        toast.error("Invalid admin login response.");
        return;
      }

      if (loginPayload.user.role !== "admin") {
        toast.error("This login is not an admin account.");
        return;
      }

      window.localStorage.setItem(TRACKER_TOKEN_KEY, loginPayload.token);
      setToken(loginPayload.token);
      setUser(loginPayload.user);
      toast.success("Signed in successfully.");
      await loadDashboard(loginPayload.token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      toast.error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(TRACKER_TOKEN_KEY);
    setToken("");
    setUser(null);
    setOverview(null);
    setProject(null);
    setMilestones([]);
    setReports([]);
    setDevelopers([]);
    setWeekStart("");
  };

  const handleRefresh = async () => {
    if (!token) return;
    await loadDashboard(token, weekStart || undefined);
  };

  const handleWeekChange = async (nextWeekStart: string) => {
    setWeekStart(nextWeekStart);
    if (!token) return;
    await loadDashboard(token, nextWeekStart);
  };

  const handleSubmitReport = async () => {
    if (!token) return;
    if (!reportForm.developerId || !reportForm.summary.trim()) {
      toast.error("Developer and summary are required.");
      return;
    }

    try {
      await submitProgressReport(token, {
        developerId: reportForm.developerId,
        reportDate: reportForm.reportDate,
        summary: reportForm.summary.trim(),
        achievements: parseLines(reportForm.achievements),
        blockers: parseLines(reportForm.blockers),
        plannedNext: reportForm.plannedNext.trim(),
        hoursWorked: Number(reportForm.hoursWorked || 0),
        completionRate: Number(reportForm.completionRate || 0),
        riskLevel: reportForm.riskLevel,
      });

      toast.success("Progress report submitted.");
      setReportForm((previous) => ({
        ...previous,
        summary: "",
        achievements: "",
        blockers: "",
        plannedNext: "",
      }));

      await loadDashboard(token, weekStart || undefined);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit progress report.";
      toast.error(message);
    }
  };

  const handleInviteDeveloper = async () => {
    if (!token) return;
    if (!inviteDeveloperId) {
      toast.error("Select a developer slot from the dropdown.");
      return;
    }
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error("Developer name and email are required.");
      return;
    }
    if (!Number.isFinite(Number(inviteSalaryMonthly)) || Number(inviteSalaryMonthly) <= 0) {
      toast.error("Monthly salary is required and must be greater than 0.");
      return;
    }
    if (selectedInviteDeveloper?.assignedUserId) {
      toast.error("Selected developer already has an account.");
      return;
    }

    setInviteLoading(true);
    try {
      await inviteDeveloper(token, {
        email: inviteEmail.trim(),
        name: inviteName.trim(),
        salaryMonthly: Number(inviteSalaryMonthly),
        developerId: inviteDeveloperId,
        role: "developer",
      });

      setInviteEmail("");
      setInviteName("");
      setInviteSalaryMonthly("");
      toast.success("Developer invited. They can now set their password with email only.");
      await loadDashboard(token, weekStart || undefined);
    } catch (error) {
      const apiError = error as ApiRequestError;
      toast.error(apiError.message || "Failed to invite developer.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSeedFromMd = async () => {
    if (!token) return;
    setSeedLoading(true);
    try {
      const response = await seedFromMdPlans(token);
      toast.success(
        `Seeded ${response.summary.filesProcessed} files, ${response.summary.milestonesCreated} created, ${response.summary.milestonesUpdated} updated.`,
      );
      if (response.summary.warnings.length > 0) {
        toast.warning(response.summary.warnings[0]);
      }
      await loadDashboard(token, weekStart || undefined);
    } catch (error) {
      const apiError = error as ApiRequestError;
      toast.error(apiError.message || "Failed to seed markdown plans.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleStartProject = async () => {
    if (!token) return;
    setStartProjectLoading(true);
    try {
      const response = await startProject(token, projectStartDate);
      setProject(response.project);
      toast.success("Project started. Milestone countdown is now active.");
      await loadDashboard(token, weekStart || undefined);
    } catch (error) {
      const apiError = error as ApiRequestError;
      toast.error(apiError.message || "Failed to start project.");
    } finally {
      setStartProjectLoading(false);
    }
  };

  const projectActive = project?.status === "active";

  if (booting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Initializing tracker dashboard...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="max-w-md mx-auto py-16">
        <Card>
          <CardHeader>
            <CardTitle>Overseer Sign In</CardTitle>
            <CardDescription>
              Use admin credentials to access the developer tracker.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@ggras.gov.gh"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button onClick={handleLogin} className="w-full" disabled={authLoading}>
              {authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Seeded local admin: <strong>admin@ggras.gov.gh / Admin@123</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Overseer Dashboard"
        description="Track weekly and daily milestones, progress rates, blockers, and report submissions."
      >
        <Input
          type="date"
          className="w-[180px]"
          value={weekStart}
          onChange={(event) => handleWeekChange(event.target.value)}
        />
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
        <Button variant="ghost" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Invite Developer</CardTitle>
            <CardDescription>
              Add a developer account by selecting a predefined developer slot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Developer Slot</label>
              <Select value={inviteDeveloperId} onValueChange={setInviteDeveloperId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select developer slot" />
                </SelectTrigger>
                <SelectContent>
                  {inviteDeveloperOptions.map((developer) => {
                    const assigned = Boolean(developer.assignedUserId);
                    const slotLabel = `${developer.id} - ${developer.name} (${developer.team})`;
                    return (
                      <SelectItem key={developer.id} value={developer.id} disabled={assigned}>
                        {assigned
                          ? `${slotLabel} - assigned to ${developer.assignedEmail || "another user"}`
                          : slotLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedInviteDeveloper && (
              <p className="text-xs text-muted-foreground">
                Selected role: {selectedInviteDeveloper.role}
              </p>
            )}
            <Input
              placeholder="Developer full name"
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
            />
            <Input
              placeholder="Developer email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <Input
              type="number"
              min={1}
              placeholder="Monthly salary (e.g. 7500)"
              value={inviteSalaryMonthly}
              onChange={(event) => setInviteSalaryMonthly(event.target.value)}
            />
            {!hasOpenInviteSlot && (
              <p className="text-xs text-muted-foreground">
                All developer slots already have invited accounts.
              </p>
            )}
            <Button onClick={handleInviteDeveloper} disabled={inviteLoading || !hasOpenInviteSlot}>
              {inviteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Inviting...
                </>
              ) : !hasOpenInviteSlot ? (
                "No Available Slots"
              ) : (
                "Create Invite"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed Milestones from MD</CardTitle>
            <CardDescription>
              Generate and seed all milestones from source plan markdown files.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Source plans:
              <span className="font-semibold ml-1">
                6 files (AI1, AI2, BE1, FE1, FE2, LEAD)
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Baseline week start for seeding:
              <span className="font-semibold ml-1">auto-preserved from existing milestones</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Seeding updates existing milestones (upsert) and preserves existing progress data.
            </p>
            <Button onClick={handleSeedFromMd} disabled={seedLoading}>
              {seedLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Seeding...
                </>
              ) : (
                "Seed Database from Source Plans"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Start Control</CardTitle>
            <CardDescription>
              Countdown only begins after admin starts the project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={projectActive ? "default" : "outline"}>
                {project?.status || "not_started"}
              </Badge>
            </div>
            <Input
              type="date"
              value={projectStartDate}
              onChange={(event) => setProjectStartDate(event.target.value)}
              disabled={projectActive}
            />
            <Button
              onClick={handleStartProject}
              disabled={startProjectLoading || projectActive}
            >
              {startProjectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                "Start Project"
              )}
            </Button>
            {project?.startedAt && (
              <p className="text-xs text-muted-foreground">
                Started at: {new Date(project.startedAt).toLocaleString("en-GB")}
              </p>
            )}
            {projectActive && (
              <p className="text-xs text-muted-foreground">
                Week window countdown is active for all milestones.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Developers</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold mt-2">{overview.summary.developerCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Progress</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold mt-2">{overview.summary.averageProgressRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Track</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold mt-2 text-emerald-600">
                {overview.summary.onTrackCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">At Risk</span>
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-3xl font-bold mt-2 text-red-600">
                {overview.summary.atRiskCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reports</span>
                <Clock3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold mt-2">{overview.summary.reportsSubmitted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Developer Progress Matrix</CardTitle>
            <CardDescription>
              Weekly completion trends, workload and risk posture across the team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Done / Total</TableHead>
                  <TableHead>Blocked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview?.developerSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.developerId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{snapshot.developerName}</p>
                        <p className="text-xs text-muted-foreground">{snapshot.role}</p>
                        {developerMap.get(snapshot.developerId)?.salaryMonthly ? (
                          <p className="text-[11px] text-muted-foreground">
                            Salary: {developerMap.get(snapshot.developerId)?.salaryMonthly?.toLocaleString("en-US")}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusBadgeMap[snapshot.status]}
                      >
                        {statusLabelMap[snapshot.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-2">
                        <Progress value={snapshot.progressRate} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {snapshot.progressRate}% completion
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {snapshot.doneItems}/{snapshot.totalItems}
                    </TableCell>
                    <TableCell>
                      {snapshot.blockedItems > 0 ? (
                        <span className="text-red-600 font-medium">
                          {snapshot.blockedItems}
                        </span>
                      ) : (
                        "0"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Blockers</CardTitle>
            <CardDescription>Most repeated issues this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview?.topBlockers.length ? (
              overview.topBlockers.map((blocker) => (
                <div
                  key={blocker.label}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm capitalize">{blocker.label}</span>
                  </div>
                  <Badge variant="outline">{blocker.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No blockers have been reported for this week.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Milestone Tracker</CardTitle>
          <CardDescription>
            Daily execution details by developer for the selected week.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone) => {
            const developer = developerMap.get(milestone.developerId);
            return (
              <div key={milestone.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">
                      {developer?.name || milestone.developerId}
                    </h3>
                    <p className="text-sm text-muted-foreground">{milestone.weeklyGoal}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      Target {milestone.targetCompletionRate}%
                    </Badge>
                    <Badge variant="secondary">
                      Current {milestone.stats.progressRate}%
                    </Badge>
                    {projectActive && (
                      <Badge variant="outline" className="gap-1">
                        <Timer className="h-3 w-3" />
                        Week ends in {getCountdownLabel(`${milestone.weekEnd}T23:59:59.999Z`)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-5">
                  {milestone.dailyMilestones.map((daily) => (
                    <div key={daily.id} className="rounded-md border p-3 bg-muted/20">
                      <p className="text-xs text-muted-foreground">{formatShortDate(daily.date)}</p>
                      <p className="text-sm font-medium mt-1">{daily.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="outline">{daily.status.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {daily.completionRate}%
                        </span>
                      </div>
                      {projectActive && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Due in {getCountdownLabel(`${daily.date}T23:59:59.999Z`)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!milestones.length && (
            <p className="text-sm text-muted-foreground">
              No milestones available for the selected week.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Progress Report</CardTitle>
            <CardDescription>
              Log daily progress updates and blockers for any developer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Developer</label>
                <Select
                  value={reportForm.developerId}
                  onValueChange={(value) =>
                    setReportForm((previous) => ({ ...previous, developerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select developer" />
                  </SelectTrigger>
                  <SelectContent>
                    {developers.map((developer) => (
                      <SelectItem key={developer.id} value={developer.id}>
                        {developer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Date</label>
                <Input
                  type="date"
                  value={reportForm.reportDate}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      reportDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Summary</label>
              <Textarea
                value={reportForm.summary}
                onChange={(event) =>
                  setReportForm((previous) => ({ ...previous, summary: event.target.value }))
                }
                placeholder="What was accomplished today?"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Achievements (one per line)</label>
              <Textarea
                value={reportForm.achievements}
                onChange={(event) =>
                  setReportForm((previous) => ({
                    ...previous,
                    achievements: event.target.value,
                  }))
                }
                className="min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Blockers (one per line)</label>
              <Textarea
                value={reportForm.blockers}
                onChange={(event) =>
                  setReportForm((previous) => ({
                    ...previous,
                    blockers: event.target.value,
                  }))
                }
                className="min-h-[90px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Planned Next</label>
              <Textarea
                value={reportForm.plannedNext}
                onChange={(event) =>
                  setReportForm((previous) => ({
                    ...previous,
                    plannedNext: event.target.value,
                  }))
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hours Worked</label>
                <Input
                  type="number"
                  min={0}
                  max={24}
                  value={reportForm.hoursWorked}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      hoursWorked: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Completion %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={reportForm.completionRate}
                  onChange={(event) =>
                    setReportForm((previous) => ({
                      ...previous,
                      completionRate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Level</label>
                <Select
                  value={reportForm.riskLevel}
                  onValueChange={(value: RiskLevel) =>
                    setReportForm((previous) => ({ ...previous, riskLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {riskOptions.map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSubmitReport}>
              <Target className="mr-2 h-4 w-4" />
              Submit Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Progress Reports</CardTitle>
            <CardDescription>Latest report submissions for the week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.slice(0, 10).map((report) => {
              const developer = developerMap.get(report.developerId);
              return (
                <div key={report.id} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{developer?.name || report.developerId}</p>
                    <Badge variant="outline">{report.riskLevel}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatShortDate(report.reportDate)}</span>
                    <span>{report.completionRate}%</span>
                  </div>
                </div>
              );
            })}
            {!reports.length && (
              <p className="text-sm text-muted-foreground">
                No reports submitted yet for this week.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
