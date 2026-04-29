"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, AlertCircle, Plus, Calendar as CalendarIcon, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      return res.json();
    }
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks?limit=100");
      return res.json();
    }
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      return res.json();
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const projectId = projects?.[0]?._id;
      if (!projectId) throw new Error("No project available");
      
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectId, priority: "medium", status: "todo", dueDate: new Date().toISOString() })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setNewTaskTitle("");
    }
  });

  const toggleTaskStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    }
  });

  if (tasksLoading || analyticsLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const overdueTasks = safeTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < today && t.status !== "done");
  const todayTasks = safeTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < tomorrow);
  const upcomingTasks = safeTasks.filter((t: any) => t.dueDate && new Date(t.dueDate) >= tomorrow && new Date(t.dueDate) <= nextWeek && t.status !== "done");

  const todayCompleted = todayTasks.filter((t: any) => t.status === "done").length;
  const todayProgress = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate(newTaskTitle);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Welcome back, {session?.user?.name}. Here's your productivity overview.</p>
        </div>
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2 max-w-sm w-full">
          <Input 
            placeholder="Quick add today's task..." 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            disabled={createTaskMutation.isPending || !projects?.length}
            className="flex-1 bg-white dark:bg-zinc-950"
          />
          <Button type="submit" size="icon" disabled={createTaskMutation.isPending || !projects?.length}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {projects?.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg text-sm">
          Please create a project first before adding tasks! <Link href="/projects" className="underline font-semibold">Go to Projects</Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Today's Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{todayProgress}%</div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${todayProgress}%` }} />
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{todayCompleted} of {todayTasks.length} tasks completed today</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Overdue Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">{overdueTasks.length}</div>
            <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-2">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Upcoming (7 days)</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{upcomingTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{analytics?.statusBreakdown?.pending || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Tasks List */}
        <Card className="lg:col-span-1 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="dark:text-zinc-100">Today's Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No tasks scheduled for today.</p>
            ) : (
              todayTasks.map((task: any) => (
                <div key={task._id} className="flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 rounded-lg transition-colors group">
                  <button onClick={() => toggleTaskStatus.mutate({ id: task._id, status: task.status === "done" ? "todo" : "done" })}>
                    {task.status === "done" ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-600" />
                    )}
                  </button>
                  <span className={cn("text-sm font-medium flex-1 truncate dark:text-zinc-200", task.status === "done" && "line-through text-zinc-400 dark:text-zinc-500")}>
                    {task.title}
                  </span>
                  <Link href={`/focus/${task._id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase text-zinc-500 hover:text-primary dark:text-zinc-400">Focus</Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Analytics Chart */}
        <Card className="lg:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="dark:text-zinc-100">Weekly Activity (Completed Tasks)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] min-w-0">
            {isMounted && analytics?.weeklyActivity ? (
              <div className="h-full w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyActivity} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      allowDecimals={false} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(148, 163, 184, 0.1)'}} 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'hsl(var(--card))',
                        color: 'hsl(var(--foreground))'
                      }} 
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
