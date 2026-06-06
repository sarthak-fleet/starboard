"use client";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  FlaskConical,
  FolderKanban,
  Loader2,
  SearchCheck,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  FleetProjectRecommendationReport,
  FleetRecommendation,
  FleetRecommendationAction,
} from "@/lib/fleet-projects";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
}

function actionLabel(action: FleetRecommendationAction): string {
  if (action === "use-now") return "Use now";
  if (action === "prototype") return "Prototype";
  if (action === "research") return "Research";
  return "Skip";
}

function actionClass(action: FleetRecommendationAction): string {
  if (action === "use-now") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (action === "prototype") return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  if (action === "research") return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "border-muted bg-muted/30 text-muted-foreground";
}

function actionIcon(action: FleetRecommendationAction) {
  if (action === "use-now") return <CheckCircle2 className="size-3.5" />;
  if (action === "prototype") return <FlaskConical className="size-3.5" />;
  if (action === "research") return <SearchCheck className="size-3.5" />;
  return <AlertTriangle className="size-3.5" />;
}

function RecommendationCard({ recommendation }: { recommendation: FleetRecommendation }) {
  return (
    <Card className="rounded-lg py-4 shadow-none">
      <CardHeader className="gap-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className={actionClass(recommendation.action)}>
                {actionIcon(recommendation.action)}
                {actionLabel(recommendation.action)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                score {recommendation.score}
              </Badge>
              {recommendation.language && (
                <Badge variant="secondary" className="text-xs">
                  {recommendation.language}
                </Badge>
              )}
            </div>
            <CardTitle className="mt-3 truncate text-base">
              <Link href={`/explore/${recommendation.fullName}`} className="hover:underline">
                {recommendation.fullName}
              </Link>
            </CardTitle>
          </div>
          <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${recommendation.fullName} on GitHub`}>
            <Link href={recommendation.htmlUrl} target="_blank" rel="noreferrer">
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {recommendation.description ?? "No description available."}
        </p>
        <div className="rounded-md border bg-background/60 p-3 text-sm">
          {recommendation.suggestedUse}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {recommendation.reasons.map((reason) => (
            <Badge key={reason} variant="outline" className="text-xs text-muted-foreground">
              {reason}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {formatNumber(recommendation.stargazersCount)} stars
          </Badge>
          {recommendation.semanticDistance !== null && (
            <Badge variant="outline" className="text-xs">
              semantic {recommendation.semanticDistance.toFixed(2)}
            </Badge>
          )}
          {recommendation.cautions.map((caution) => (
            <Badge key={caution} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300">
              {caution}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectRecommendationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, error, isLoading } = useSWR<FleetProjectRecommendationReport>(
    slug ? `/api/projects/${slug}/recommendations?limit=30` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (status === "unauthenticated") {
    router.replace("/");
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const exportMarkdown = () => {
    if (!data?.markdown) return;
    const blob = new Blob([data.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `starboard-${data.project.slug}-recommendations.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back to projects">
              <Link href="/projects">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div className="flex size-9 items-center justify-center rounded-md border">
              <FolderKanban className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{data?.project.name ?? slug}</h1>
              <p className="text-sm text-muted-foreground">
                Top repositories from your Starboard library, grouped by fleet feature area.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportMarkdown} disabled={!data?.markdown}>
              <ArrowDownToLine className="mr-1.5 size-4" />
              Markdown
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/stars">Library</Link>
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <div className="m-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300 md:m-6">
          Recommendations could not load.
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-3 p-4 md:grid-cols-5 md:p-6">
            <Card className="rounded-lg py-4 shadow-none md:col-span-2">
              <CardContent className="space-y-3 px-4">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">{data.project.priority}</Badge>
                  <Badge variant="secondary">{data.project.tier}</Badge>
                  <Badge variant="outline">{data.project.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{data.project.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.project.stack.frameworks.slice(0, 5).map((framework) => (
                    <Badge key={framework} variant="secondary" className="text-xs">
                      {framework}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-lg py-4 shadow-none">
              <CardContent className="px-4">
                <div className="text-2xl font-semibold">{data.summary.returned}</div>
                <div className="text-sm text-muted-foreground">repos returned</div>
              </CardContent>
            </Card>
            <Card className="rounded-lg py-4 shadow-none">
              <CardContent className="px-4">
                <div className="text-2xl font-semibold">{data.summary.useNow}</div>
                <div className="text-sm text-muted-foreground">use now</div>
              </CardContent>
            </Card>
            <Card className="rounded-lg py-4 shadow-none">
              <CardContent className="px-4">
                <div className="text-2xl font-semibold">{data.suppressed.dependencyMatches}</div>
                <div className="text-sm text-muted-foreground">already in use</div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6 px-4 pb-8 md:px-6">
            {data.byFeatureArea
              .filter((group) => group.recommendations.length > 0)
              .map((group) => (
                <div key={group.featureArea.id} className="space-y-3">
                  <div>
                    <h2 className="text-base font-semibold">{group.featureArea.label}</h2>
                    <p className="text-sm text-muted-foreground">{group.featureArea.description}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.recommendations.map((recommendation) => (
                      <RecommendationCard key={recommendation.id} recommendation={recommendation} />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        </>
      )}
    </main>
  );
}
