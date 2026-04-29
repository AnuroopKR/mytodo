"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TaskCard } from "./task-card";
import { useKanbanStore } from "@/lib/store";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { TaskDetailModal } from "./task-detail-modal";
import { cn } from "@/lib/utils";

const columns = [
  { id: "todo", title: "To Do", color: "bg-zinc-100 dark:bg-zinc-900/50" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-50 dark:bg-blue-950/20" },
  { id: "done", title: "Done", color: "bg-green-50 dark:bg-green-950/20" },
];

export function KanbanBoard({ initialTaskId }: { initialTaskId?: string | null }) {
  const { tasks, updateTaskStatus } = useKanbanStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId || null);

  // If initialTaskId changes, update selectedTaskId
  useEffect(() => {
    if (initialTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as "todo" | "in-progress" | "done";
    
    // Find the task and it's current index
    const flatTasks = [...tasks];
    const sourceTaskIndex = flatTasks.findIndex(t => t._id === draggableId);
    if (sourceTaskIndex === -1) return;

    const [movedTask] = flatTasks.splice(sourceTaskIndex, 1);
    movedTask.status = newStatus;

    // We need to figure out where to insert it based on destination.index
    // destination.index is relative to the filtered array.
    const destinationTasks = flatTasks.filter(t => t.status === newStatus);
    
    if (destinationTasks.length === 0) {
      flatTasks.push(movedTask);
    } else if (destination.index >= destinationTasks.length) {
      const lastItem = destinationTasks[destinationTasks.length - 1];
      const lastItemFlatIndex = flatTasks.indexOf(lastItem);
      flatTasks.splice(lastItemFlatIndex + 1, 0, movedTask);
    } else {
      const targetItem = destinationTasks[destination.index];
      const targetFlatIndex = flatTasks.indexOf(targetItem);
      flatTasks.splice(targetFlatIndex, 0, movedTask);
    }

    // Update local state immediately with reordered array
    useKanbanStore.getState().setTasks(flatTasks);

    // Persist to DB
    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update task status:", err);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 p-4">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{column.title}</h3>
                <span className="flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 rounded-full h-5 w-5">
                  {tasks.filter((t) => t.status === column.id).length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 dark:text-zinc-500">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "flex-1 min-h-[500px] transition-colors rounded-lg",
                    snapshot.isDraggingOver && "bg-zinc-100/50 dark:bg-zinc-800/20"
                  )}
                >
                  {tasks
                    .filter((task) => task.status === column.id)
                    .map((task, index) => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        index={index} 
                        onClick={(id) => setSelectedTaskId(id)}
                      />
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
      
      <TaskDetailModal 
        taskId={selectedTaskId} 
        isOpen={!!selectedTaskId} 
        onClose={() => setSelectedTaskId(null)} 
      />
    </DragDropContext>
  );
}
