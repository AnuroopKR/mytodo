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
  };
  index: number;
  onClick: (taskId: string) => void;
}

const priorityColors = {
  low: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
  medium: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
  high: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task._id)}
          className={cn(
            "mb-3 last:mb-0 transition-all cursor-pointer",
            snapshot.isDragging && "scale-[1.02] shadow-xl"
          )}
        >
          <Card className={cn(
            "border-zinc-200/60 bg-white hover:border-primary/30 transition-colors shadow-sm",
            snapshot.isDragging && "ring-2 ring-primary/20"
          )}>
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
              <Badge 
                variant="outline" 
                className={cn("capitalize text-[10px] h-5 px-1.5 font-semibold", priorityColors[task.priority])}
              >
                {task.priority}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 mb-1">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                  {task.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-auto">
                {task.dueDate && (
                  <div className="flex items-center text-[10px] text-zinc-400">
                    <Calendar className="mr-1 h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
                <div className="flex -space-x-2">
                  {/* Avatar placeholders can go here */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
