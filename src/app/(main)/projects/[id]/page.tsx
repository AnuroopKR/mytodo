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

export default function ProjectDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
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
        setTasks(tasksData);
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
          <div className="h-10 w-10 bg-zinc-200 rounded-lg"></div>
          <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[600px] bg-zinc-100 rounded-xl"></div>
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
            <Button variant="outline" size="icon" className="rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 group flex items-center gap-2">
              {project?.name}
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="h-3 w-3" />
              </Button>
            </h1>
            <p className="text-sm text-zinc-500">{project?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDeleteProject} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogTrigger render={<Button size="sm" className="shadow-sm" />}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTask}>
                <DialogHeader>
                  <DialogTitle>Create Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to your board.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Title</Label>
                    <Input 
                      id="task-title" 
                      value={newTask.title} 
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      required 
                      placeholder="Fix sidebar responsiveness"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={newTask.priority} 
                        onValueChange={(v: any) => setNewTask({...newTask, priority: v})}
                      >
                        <SelectTrigger id="priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Initial Status</Label>
                      <Select 
                        value={newTask.status} 
                        onValueChange={(v: any) => setNewTask({...newTask, status: v})}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-desc">Description</Label>
                    <Textarea 
                      id="task-desc" 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      rows={3}
                      placeholder="Briefly describe the task..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creatingTask}>
                    {creatingTask ? "Adding..." : "Add Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  );
}
