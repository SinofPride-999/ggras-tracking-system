import Link from "next/link";
import { Gauge, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const portals = [
  {
    title: "Admin Overseer",
    description:
      "Track all developers by weekly milestones, daily checkpoints, blockers, and progress reports.",
    href: "/overseer",
    icon: Gauge,
    cta: "Open Overseer Dashboard",
  },
  {
    title: "Developer Portal",
    description:
      "View assigned milestones, update daily checkpoints, and submit daily progress reports.",
    href: "/my-milestones",
    icon: ListChecks,
    cta: "Open My Milestones",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-20">
        <div className="mb-10 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            GGRAS Developer Tracker
          </h1>
          <p className="text-muted-foreground">
            Serverless tracker for developer execution: account setup, milestone updates,
            weekly progress visibility, and overseer reporting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {portals.map((portal) => (
            <Card key={portal.href} className="h-full">
              <CardHeader className="space-y-3">
                <portal.icon className="h-6 w-6 text-primary" />
                <CardTitle>{portal.title}</CardTitle>
                <CardDescription>{portal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={portal.href}>{portal.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

