"use client";

import { ArrowUpRight, Boxes, FolderKanban, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FleetFeatureArea } from "@/lib/fleet-projects";

const emptyProjects: ProjectSummary[] = [];

interface ProjectSummary {
  slug: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  priority: string;
  featureAreas: FleetFeatureArea[];
  stack: {
    languages: string[];
    frameworks: string[];
    dependenciesCount: number;
  };
}

interface ProjectsResponse {
  projects: ProjectSummary[];
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
};

function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Card className="rounded-lg py-4 shadow-none">
      <CardHeader className="gap-3 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{project.priority}</Badge>
              <Badge variant="secondary">{project.tier}</Badge>
              <Badge variant="outline">{project.category}</Badge>
            </div>
            <CardTitle className="mt-3 truncate text-base">
              <Link href={`/projects/${project.slug}`} className="hover:underline">
                {project.name}
              </Link>
            </CardTitle>
          </div>
          <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${project.name}`}>
            <Link href={`/projects/${project.slug}`}>
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.featureAreas.slice(0, 4).map((feature) => (
            <Badge key={feature.id} variant="outline" className="text-xs">
              {feature.label}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {project.stack.languages.slice(0, 3).map((language) => (
            <Badge key={language} variant="secondary" className="text-xs">
              {language}
            </Badge>
          ))}
          {project.stack.frameworks.slice(0, 3).map((framework) => (
            <Badge key={framework} variant="secondary" className="text-xs">
              {framework}
            </Badge>
          ))}
          <Badge variant="outline" className="text-xs">
            {project.stack.dependenciesCount} deps tracked
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data, error, isLoading } = useSWR<ProjectsResponse>("/api/projects", fetcher, {
    revalidateOnFocus: false,
  });

  if (status === "unauthenticated") {
    router.replace("/");
  }

  const projects = data?.projects ?? emptyProjects;
  const filteredProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) =>
      [
        project.name,
        project.description,
        project.tier,
        project.category,
        project.priority,
        ...project.featureAreas.map((feature) => feature.label),
        ...project.stack.languages,
        ...project.stack.frameworks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [projects, query]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md border">
              <FolderKanban className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">My Projects</h1>
              <p className="text-sm text-muted-foreground">Fleet projects matched against your Starboard repository library.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/stack-builder">
                <Boxes className="mr-1.5 size-4" />
                Stack
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/stars">Library</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="space-y-3 p-4 md:p-6">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
            Projects could not load.
          </div>
        )}
      </section>

      <section className="grid gap-3 px-4 pb-8 md:grid-cols-2 md:px-6 xl:grid-cols-3">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </section>
    </main>
  );
}
