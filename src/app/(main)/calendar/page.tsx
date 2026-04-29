"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["calendar-tasks", formattedDate],
    queryFn: async () => {
      // Need a wide date range to catch all tasks for the day, or we just fetch tasks with dueDate = selectedDate
      // For simplicity, we fetch all for now and filter, or we pass startDate/endDate.
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);
      
      const res = await fetch(`/api/tasks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
        cache: "no-store"
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update task");
      }
      return res.json();
    }
  });

  const handleDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      return;
    }

    let newStartTime = null;
    if (destination.droppableId !== "unscheduled") {
      newStartTime = parseInt(destination.droppableId.replace("time-", ""));
    }

    // Capture previous state
    await queryClient.cancelQueries({ queryKey: ["calendar-tasks", formattedDate] });
    const previousTasks = queryClient.getQueryData(["calendar-tasks", formattedDate]);

    // Synchronously update the cache to prevent drag-and-drop snapback
    queryClient.setQueryData(["calendar-tasks", formattedDate], (old: any) => {
      if (!old) return old;
      return old.map((t: any) => t._id === draggableId ? { ...t, startTime: newStartTime } : t);
    });

    try {
      await updateTaskMutation.mutateAsync({
        id: draggableId,
        updates: { startTime: newStartTime }
      });
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["calendar-tasks", formattedDate] });
    } catch (err: any) {
      console.error(err);
      alert("Failed to save: " + err.message);
      // Rollback
      queryClient.setQueryData(["calendar-tasks", formattedDate], previousTasks);
    }
  };

  const unscheduledTasks = tasks.filter((t: any) => t.startTime === undefined || t.startTime === null);
  const getTasksForHour = (hour: number) => tasks.filter((t: any) => t.startTime === hour);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!isMounted) return null;

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-zinc-100">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Daily Planner</h1>
            <p className="text-sm text-zinc-500">Schedule your tasks into time blocks</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-semibold min-w-[120px] text-center">
            {isSameDay(selectedDate, new Date()) ? "Today" : format(selectedDate, "MMM d, yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          
          {/* Backlog Sidebar */}
          <div className="w-80 flex flex-col bg-zinc-50/50 rounded-xl border border-zinc-200 overflow-hidden shrink-0">
            <div className="p-4 border-b border-zinc-200 bg-white">
              <h3 className="font-bold text-zinc-800 flex items-center justify-between">
                Unscheduled 
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-600">{unscheduledTasks.length}</Badge>
              </h3>
            </div>
            
            <Droppable droppableId="unscheduled">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar",
                    snapshot.isDraggingOver && "bg-zinc-100/50"
                  )}
                >
                  {unscheduledTasks.map((task: any, index: number) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "bg-white p-3 rounded-lg shadow-sm border border-zinc-200 cursor-grab active:cursor-grabbing",
                            snapshot.isDragging && "shadow-md ring-2 ring-primary/20 border-primary/30 rotate-1 scale-105"
                          )}
                        >
                          <h4 className="text-sm font-semibold text-zinc-800 line-clamp-1">{task.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px] uppercase h-5 px-1.5">{task.priority}</Badge>
                            {task.projectId && <span className="text-[10px] text-zinc-400 font-medium">Project Task</span>}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Timeline */}
          <div className="flex-1 bg-white rounded-xl border border-zinc-200 overflow-y-auto custom-scrollbar relative shadow-sm">
            <div className="absolute top-0 left-16 bottom-0 w-px bg-zinc-100 pointer-events-none" />
            
            <div className="py-4">
              {hours.map((hour) => {
                const hourTasks = getTasksForHour(hour);
                return (
                  <div key={hour} className="flex min-h-[100px] border-b border-zinc-100 last:border-0 relative group">
                    <div className="w-16 flex-shrink-0 flex justify-center py-3 text-xs font-semibold text-zinc-400 group-hover:text-primary transition-colors">
                      {format(new Date().setHours(hour, 0), "h a")}
                    </div>
                    
                    <Droppable droppableId={`time-${hour}`}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 p-2 transition-colors grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 content-start",
                            snapshot.isDraggingOver && "bg-primary/5"
                          )}
                        >
                          {hourTasks.map((task: any, index: number) => (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "bg-white p-3 rounded-lg shadow-sm border border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow h-20",
                                    snapshot.isDragging && "shadow-lg ring-2 ring-primary/20 scale-[1.02]",
                                    task.priority === 'high' ? 'border-l-red-500 border-zinc-200' : 
                                    task.priority === 'medium' ? 'border-l-orange-500 border-zinc-200' : 
                                    'border-l-blue-500 border-zinc-200'
                                  )}
                                >
                                  <div className="flex justify-between items-start gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-tight">{task.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                                    <Clock className="w-3 h-3" /> 1 hr
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </DragDropContext>
    </div>
  );
}
