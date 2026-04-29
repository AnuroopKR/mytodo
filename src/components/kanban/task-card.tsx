"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    dueDate?: string;
    subtasks?: Array<{ isCompleted: boolean }>;
    tags?: string[];
  };
  index: number;
  onClick: (taskId: string) => void;
}

const priorityColors = {
  low: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50",
  medium: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50",
  high: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50",
};

const priorityDotColors = {
  low: "bg-blue-500",
  medium: "bg-orange-500",
  high: "bg-red-500",
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const isDueSoon = task.dueDate ? new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : false;
  
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const progressPercentage = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  let remainingDaysText = "";
  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) remainingDaysText = "Today";
    else if (diffDays === 1) remainingDaysText = "Tomorrow";
    else if (diffDays < 0) remainingDaysText = `${Math.abs(diffDays)}d overdue`;
    else remainingDaysText = `${diffDays}d left`;
  }

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task._id)}
          className={cn(
            "mb-3 last:mb-0 group cursor-pointer",
            snapshot.isDragging ? "opacity-100" : ""
          )}
        >
          <Card className={cn(
            "relative overflow-hidden bg-white/70 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-300 shadow-sm border-zinc-200/50 dark:border-zinc-800 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700",
            snapshot.isDragging && "scale-[1.02] shadow-xl rotate-1 z-50 border-primary/30 ring-1 ring-primary/20",
            isDueSoon && "border-red-200/80 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/5"
          )}>
            {/* Left accent line for priority */}
            <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", priorityDotColors[task.priority])} />
            
            <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between space-y-0 gap-2">
              <div className="flex flex-wrap gap-1.5 items-center pl-1">
                <Badge
                  variant="outline"
                  className={cn("capitalize text-[9px] h-4.5 px-1.5 font-medium tracking-wide shadow-none", priorityColors[task.priority])}
                >
                  {task.priority}
                </Badge>
                {task.tags?.slice(0, 2).map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] h-4.5 px-1.5 bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium border-0 shadow-none">
                    {tag}
                  </Badge>
                ))}
                {task.tags && task.tags.length > 2 && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">+{task.tags.length - 2}</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 -mr-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-3.5 pt-0 pl-4">
              <h4 className="text-[13px] leading-snug font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 mb-1.5">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                  {task.description}
                </p>
              )}
              
              {/* Progress Bar for Subtasks */}
              {totalSubtasks > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                      {completedSubtasks}/{totalSubtasks}
                    </span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-zinc-400 dark:bg-zinc-500 transition-all duration-300 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {task.dueDate && (
                    <div className={cn(
                      "flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md",
                      isDueSoon 
                        ? "bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" 
                        : "bg-zinc-50 text-zinc-500 border border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800"
                    )}>
                      <Calendar className="mr-1.5 h-3 w-3 opacity-70" />
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      <span className="ml-1 opacity-80 font-bold">({remainingDaysText})</span>
                    </div>
                  )}
                </div>
                
                {/* Fake Avatar */}
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-primary/80 to-primary flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900">
                  {task.title.substring(0, 1).toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
