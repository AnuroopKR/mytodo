"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewProject({ name: "", description: "" });
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Projects</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your projects and their tasks.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger render={<Button className="shadow-sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] dark:bg-zinc-900 dark:border-zinc-800">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="dark:text-zinc-100">Create Project</DialogTitle>
                <DialogDescription className="dark:text-zinc-400">
                  Add a new project to organize your tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="dark:text-zinc-300">Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    required
                    autoFocus
                    className="dark:bg-zinc-950 dark:border-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="dark:text-zinc-300">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className="dark:bg-zinc-950 dark:border-zinc-800"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="dark:border-zinc-800">Cancel</Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/50">
          <Folder className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">No projects yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">Get started by creating your first project to start organizing tasks.</p>
          <Button className="mt-6 dark:border-zinc-800" variant="outline" onClick={() => setIsModalOpen(true)} >
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project._id} className={cn(
              "group hover:shadow-md transition-all border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900",
              project.dueSoonTasks > 0 && "border-red-300 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/20"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="truncate dark:text-zinc-100">{project.name}</CardTitle>
                  {project.dueSoonTasks > 0 && (
                    <div className="flex items-center text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Due soon
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px] dark:text-zinc-400">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="mr-1.5 h-3.5 w-3.5" />
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </div>

                  {project.totalTasks !== undefined && (
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Progress ({project.completedTasks}/{project.totalTasks})</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-b-xl">
                <Link href={`/projects/${project._id}`} className="w-full">
                  <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-primary">
                    View Board
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
