"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, LayoutDashboard, ListTodo, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/projects")
        ]);
        const tasks = await tasksRes.json();
        const projects = await projectsRes.json();

        const todo = tasks.filter((t: any) => t.status === "todo").length;
        const inProgress = tasks.filter((t: any) => t.status === "in-progress").length;
        const done = tasks.filter((t: any) => t.status === "done").length;

        setStats({
          total: tasks.length,
          todo,
          inProgress,
          done,
          projects: projects.length,
        });
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-8 bg-zinc-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-zinc-200 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const chartData = [
    { name: "To Do", value: stats.todo, color: "#94a3b8" },
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
    { name: "Done", value: stats.done, color: "#22c55e" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-2">Welcome back, {session?.user?.name}. Here's an overview of your tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-zinc-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total Projects</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.projects}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Completed</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-900">{stats.done}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm border-zinc-200 col-span-1">
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 col-span-1 flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4">
            <FolderKanban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ready to work?</h3>
          <p className="text-zinc-500 mb-6 max-w-sm">Jump right back into your projects and keep moving your tasks to Done.</p>
          <Link href="/projects">
            <Button size="lg" className="shadow-md">View My Projects</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
