"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FocusModePage() {
  const { taskId } = useParams();
  const router = useRouter();
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks`); // Hack: fetch all to get one if no single task endpoint exists. Wait, I should make a single task endpoint or fetch from existing. We actually don't have a GET /api/tasks/[id] in this app yet. I will implement a quick fetch by doing GET /api/tasks and filtering or I will add GET /api/tasks/[id]. Let's just fetch all and filter for now since it's cached anyway.
      const data = await res.json();
      return data.find((t: any) => t._id === taskId);
    }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        setIsBreak(true);
        setTimeLeft(5 * 60); // 5 min break
      } else {
        setIsBreak(false);
        setTimeLeft(25 * 60);
      }
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center animate-pulse">Loading focus mode...</div>;
  if (!task) return <div className="h-screen flex flex-col items-center justify-center gap-4">Task not found <Button onClick={() => router.back()}>Go Back</Button></div>;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-3xl mx-auto min-h-screen flex flex-col p-8 animate-in fade-in zoom-in duration-700">
        <header className="flex justify-between items-center mb-12">
          <Button variant="ghost" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Focus Mode
          </Button>
          <div className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Deep Work
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">
          <div className="flex-1 space-y-6 w-full">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              {task.title}
            </h1>
            {task.description && (
              <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {task.description}
              </p>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Subtasks</h3>
                {task.subtasks.map((st: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    {st.isCompleted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />}
                    <span className={cn("font-medium", st.isCompleted && "line-through text-zinc-400")}>{st.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-10 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl min-w-[300px]">
            <div className="text-sm font-semibold tracking-widest uppercase mb-4 text-zinc-500">
              {isBreak ? "Break Time" : "Focus Time"}
            </div>
            <div className={cn(
              "text-7xl font-mono tracking-tighter mb-8 font-bold transition-colors",
              isBreak ? "text-green-500" : "text-primary"
            )}>
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-4">
              <Button size="lg" className="rounded-full w-16 h-16 shadow-lg" onClick={toggleTimer}>
                {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
              <Button size="icon" variant="outline" className="rounded-full w-12 h-12" onClick={resetTimer}>
                <RotateCcw className="h-5 w-5 text-zinc-500" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
