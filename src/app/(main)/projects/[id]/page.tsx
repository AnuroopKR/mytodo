"use client";

import { useEffect, useState, use } from "react";
import { KanbanBoard } from "@/components/kanban/board";
import { useKanbanStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

export default function ProjectDetailPage({ 
  params: paramsPromise,
  searchParams: searchParamsPromise
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ taskId?: string }>
}) {
  const params = use(paramsPromise);
  const searchParams = use(searchParamsPromise);
  const router = useRouter();
  const { setTasks, addTask } = useKanbanStore();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    priority: "medium" as const,
    status: "todo" as const
  });
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectRes, tasksRes] = await Promise.all([
          fetch(`/api/projects/${params.id}`),
          fetch(`/api/tasks?projectId=${params.id}`)
        ]);

        if (projectRes.status === 404) {
          router.push("/projects");
          return;
        }

        const projectData = await projectRes.json();
        const tasksData = await tasksRes.json();

        setProject(projectData);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, setTasks, router]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTask, projectId: params.id }),
      });

      if (res.ok) {
        const data = await res.json();
        addTask(data);
        setIsTaskModalOpen(false);
        setNewTask({ title: "", description: "", priority: "medium", status: "todo" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project? All tasks will be permanently removed.")) return;
    
    try {
      const res = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[600px] bg-zinc-100 dark:bg-zinc-900/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="icon" className="rounded-lg dark:border-zinc-800">
              <ChevronLeft className="h-4 w-4 dark:text-zinc-400" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 group flex items-center gap-2">
              {project?.name}
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="h-3 w-3 dark:text-zinc-500" />
              </Button>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{project?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDeleteProject} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/30">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger render={<Button size="sm" className="shadow-sm font-semibold rounded-lg" />}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] overflow-hidden p-0 rounded-2xl dark:bg-zinc-900 dark:border-zinc-800">
              <form onSubmit={handleCreateTask}>
                <div className="bg-zinc-50/50 dark:bg-zinc-950/30 p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create New Task</DialogTitle>
                  <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    What do you need to get done?
                  </DialogDescription>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="task-title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Title</Label>
                    <Input 
                      id="task-title" 
                      value={newTask.title} 
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      required 
                      placeholder="e.g. Redesign landing page"
                      className="h-10 text-sm shadow-sm border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 focus-visible:ring-primary/20 dark:text-zinc-100"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Priority</Label>
                      <Select 
                        value={newTask.priority} 
                        onValueChange={(v: any) => setNewTask({...newTask, priority: v})}
                      >
                        <SelectTrigger id="priority" className="h-10 text-sm shadow-sm border-zinc-200 dark:border-zinc-800 capitalize bg-white dark:bg-zinc-950 dark:text-zinc-100">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="status" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Status</Label>
                      <Select 
                        value={newTask.status} 
                        onValueChange={(v: any) => setNewTask({...newTask, status: v})}
                      >
                        <SelectTrigger id="status" className="h-10 text-sm shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 dark:text-zinc-100">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="task-desc" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Description <span className="text-zinc-400 dark:text-zinc-500 font-normal lowercase">(optional)</span></Label>
                    <Textarea 
                      id="task-desc" 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      rows={3}
                      placeholder="Add any extra details here..."
                      className="resize-none shadow-sm border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 focus-visible:ring-primary/20 text-sm dark:text-zinc-100"
                    />
                  </div>
                </div>
                
                <div className="p-6 pt-0 flex justify-end gap-2 bg-white dark:bg-zinc-900">
                  <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">Cancel</Button>
                  <Button type="submit" disabled={creatingTask} className="shadow-sm font-semibold px-6">
                    {creatingTask ? "Adding..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard initialTaskId={searchParams.taskId} />
      </div>
    </div>
  );
}
