"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  getCurrentUser,
  getDeveloperOverview,
  getMilestones,
  getProgressReports,
  login,
  setupPassword,
  submitProgressReport,
  updateDailyMilestone,
  type ApiRequestError,
} from "@/lib/tracker/api";
import type {
  Milestone,
  MilestoneStatus,
  ProgressReport,
  TrackerProjectState,
  TrackerUser,
} from "@/types/tracker";
import { Loader2, Save, Target, Timer } from "lucide-react";

const TOKEN_KEY = "ggras_tracker_token";

type UpdateDraft = {
  status: MilestoneStatus;
  completionRate: number;
  notes: string;
};

const statusOptions: MilestoneStatus[] = ["pending", "in_progress", "done", "blocked"];

function formatShortDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function parseLines(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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

export default function DeveloperMilestonesPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<TrackerUser | null>(null);
  const [project, setProject] = useState<TrackerProjectState | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const [email, setEmail] = useState("amina@ggras.gov.gh");
  const [password, setPassword] = useState("Dev@123");
  const [setupToken, setSetupToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [reportSummary, setReportSummary] = useState("");
  const [reportAchievements, setReportAchievements] = useState("");
  const [reportBlockers, setReportBlockers] = useState("");
  const [reportNext, setReportNext] = useState("");

  const [drafts, setDrafts] = useState<Record<string, UpdateDraft>>({});

  const loadData = useCallback(async (accessToken: string, requestedWeek?: string) => {
    setLoading(true);
    try {
      const [overviewPayload, milestonePayload, reportsPayload] = await Promise.all([
        getDeveloperOverview(accessToken, requestedWeek),
        getMilestones(accessToken, requestedWeek),
        getProgressReports(accessToken, requestedWeek),
      ]);

      setWeekStart(overviewPayload.weekStart);
      setProject(overviewPayload.project || milestonePayload.project || null);
      const activeMilestone = milestonePayload.items[0] || null;
      setMilestone(activeMilestone);
      setReports(reportsPayload.items);

      const nextDrafts: Record<string, UpdateDraft> = {};
      for (const daily of activeMilestone?.dailyMilestones || []) {
        nextDrafts[daily.id] = {
          status: daily.status,
          completionRate: daily.completionRate,
          notes: daily.notes || "",
        };
      }
      setDrafts(nextDrafts);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load milestones.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setBooting(false);
      return;
    }

    setToken(stored);
    (async () => {
      try {
        const me = await getCurrentUser(stored);
        if (me.user.role !== "developer") {
          window.localStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
          setProject(null);
          return;
        }
        setUser(me.user);
        await loadData(stored);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setProject(null);
      } finally {
        setBooting(false);
      }
    })();
  }, [loadData]);

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const payload = await login(email, password);
      if (payload.requiresSetup || payload.setupRequired) {
        setRequiresSetup(true);
        toast.info("Account setup required. Use setup token from admin.");
        return;
      }

      if (!payload.token || !payload.user) {
        toast.error("Unexpected login response.");
        return;
      }

      if (payload.user.role !== "developer") {
        toast.error("This account is not a developer account.");
        return;
      }

      window.localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setRequiresSetup(false);
      await loadData(payload.token);
    } catch (error) {
      const apiError = error as ApiRequestError;
      toast.error(apiError.message || "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetupPassword = async () => {
    setAuthLoading(true);
    try {
      const payload = await setupPassword({
        email,
        setupToken,
        password: newPassword,
        confirmPassword,
      });

      if (!payload.token || !payload.user) {
        toast.error("Setup completed but login payload missing.");
        return;
      }

      window.localStorage.setItem(TOKEN_KEY, payload.token);
      setToken(payload.token);
      setUser(payload.user);
      setRequiresSetup(false);
      toast.success("Account setup completed.");
      await loadData(payload.token);
    } catch (error) {
      const apiError = error as ApiRequestError;
      toast.error(apiError.message || "Could not set password.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveCheckpoint = async (dailyId: string) => {
    if (!token || !milestone) return;
    const draft = drafts[dailyId];
    if (!draft) return;

    try {
      await updateDailyMilestone(token, milestone.id, dailyId, {
        status: draft.status,
        completionRate: draft.completionRate,
        notes: draft.notes,
      });
      toast.success("Checkpoint updated.");
      await loadData(token, weekStart || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update checkpoint.";
      toast.error(message);
    }
  };

  const handleSubmitReport = async () => {
    if (!token || !user?.developerId) return;
    if (!reportSummary.trim()) {
      toast.error("Report summary is required.");
      return;
    }

    try {
      await submitProgressReport(token, {
        developerId: user.developerId,
        reportDate: new Date().toISOString().slice(0, 10),
        summary: reportSummary.trim(),
        achievements: parseLines(reportAchievements),
        blockers: parseLines(reportBlockers),
        plannedNext: reportNext.trim(),
        hoursWorked: 8,
        completionRate: milestone?.stats.progressRate || 0,
        riskLevel: "medium",
      });

      setReportSummary("");
      setReportAchievements("");
      setReportBlockers("");
      setReportNext("");
      toast.success("Progress report submitted.");
      await loadData(token, weekStart || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit report.";
      toast.error(message);
    }
  };

  const weeklyProgress = useMemo(() => milestone?.stats.progressRate || 0, [milestone]);
  const projectActive = project?.status === "active";

  if (booting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Loading developer portal...</span>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Developer Login</CardTitle>
            <CardDescription>
              Login with your assigned email. On first login, complete account setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Developer email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {!requiresSetup && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}
            {requiresSetup && (
              <>
                <Input
                  placeholder="Setup token from admin"
                  value={setupToken}
                  onChange={(event) => setSetupToken(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </>
            )}
            <Button
              className="w-full"
              onClick={requiresSetup ? handleSetupPassword : handleLogin}
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : requiresSetup ? (
                "Set Password"
              ) : (
                "Login"
              )}
            </Button>
            {!requiresSetup && (
              <p className="text-xs text-muted-foreground">
                Demo login: <strong>amina@ggras.gov.gh / Dev@123</strong>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Weekly Milestones"
        description="Track and update your daily checkpoints for the current week."
      >
        <Input
          type="date"
          className="w-[180px]"
          value={weekStart}
          onChange={(event) => {
            const value = event.target.value;
            setWeekStart(value);
            if (token) {
              void loadData(token, value);
            }
          }}
        />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>
            Milestone countdown starts only after admin activates the project.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Badge variant={projectActive ? "default" : "outline"}>
            {project?.status || "not_started"}
          </Badge>
          {project?.startedAt ? (
            <span className="text-xs text-muted-foreground">
              Started: {new Date(project.startedAt).toLocaleString("en-GB")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Waiting for admin to start the project.
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
          <CardDescription>{milestone?.weeklyGoal || "No weekly goal assigned yet."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={weeklyProgress} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span>{weeklyProgress}% complete</span>
            <Badge variant="outline">
              {milestone?.stats.doneItems || 0}/{milestone?.stats.totalItems || 0} checkpoints done
            </Badge>
          </div>
          {projectActive && milestone?.weekEnd && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Week ends in {getCountdownLabel(`${milestone.weekEnd}T23:59:59.999Z`)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Checkpoints</CardTitle>
          <CardDescription>Update your daily execution status and progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Refreshing milestones...
            </div>
          )}

          {(milestone?.dailyMilestones || []).map((daily) => {
            const draft = drafts[daily.id] || {
              status: daily.status,
              completionRate: daily.completionRate,
              notes: daily.notes || "",
            };

            return (
              <div key={daily.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{daily.title}</p>
                    <p className="text-xs text-muted-foreground">{formatShortDate(daily.date)}</p>
                  </div>
                  <Badge variant="outline">{draft.status.replace("_", " ")}</Badge>
                </div>
                {projectActive && (
                  <p className="text-[11px] text-muted-foreground">
                    Due in {getCountdownLabel(`${daily.date}T23:59:59.999Z`)}
                  </p>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select
                      className="w-full rounded-md border bg-background px-2 py-2 text-sm"
                      value={draft.status}
                      onChange={(event) => {
                        const value = event.target.value as MilestoneStatus;
                        setDrafts((previous) => ({
                          ...previous,
                          [daily.id]: { ...draft, status: value },
                        }));
                      }}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Completion %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.completionRate}
                      onChange={(event) =>
                        setDrafts((previous) => ({
                          ...previous,
                          [daily.id]: {
                            ...draft,
                            completionRate: Number(event.target.value || 0),
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Input
                      value={draft.notes}
                      onChange={(event) =>
                        setDrafts((previous) => ({
                          ...previous,
                          [daily.id]: { ...draft, notes: event.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <Button size="sm" onClick={() => handleSaveCheckpoint(daily.id)}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Checkpoint
                </Button>
              </div>
            );
          })}

          {!milestone && !loading && (
            <p className="text-sm text-muted-foreground">
              No milestones assigned for this week yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Submit Daily Report</CardTitle>
            <CardDescription>Log today&apos;s work summary and blockers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Summary of work completed today"
              value={reportSummary}
              onChange={(event) => setReportSummary(event.target.value)}
            />
            <Textarea
              placeholder="Achievements (one per line)"
              value={reportAchievements}
              onChange={(event) => setReportAchievements(event.target.value)}
            />
            <Textarea
              placeholder="Blockers (one per line)"
              value={reportBlockers}
              onChange={(event) => setReportBlockers(event.target.value)}
            />
            <Textarea
              placeholder="Planned next steps"
              value={reportNext}
              onChange={(event) => setReportNext(event.target.value)}
            />
            <Button onClick={handleSubmitReport}>
              <Target className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Your latest submitted updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.slice(0, 8).map((report) => (
              <div key={report.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{formatShortDate(report.reportDate)}</p>
                  <Badge variant="outline">{report.completionRate}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{report.summary}</p>
              </div>
            ))}
            {!reports.length && (
              <p className="text-sm text-muted-foreground">
                No reports submitted yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
