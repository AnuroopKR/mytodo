"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, MessageSquare, Send } from "lucide-react";
import { useKanbanStore } from "@/lib/store";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, isOpen, onClose }: TaskDetailModalProps) {
  const { tasks, updateTask, removeTask } = useKanbanStore();
  const task = tasks.find((t) => t._id === taskId);
  
  const [editedTask, setEditedTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedTask({ 
        ...task,
        subtasks: task.subtasks || [],
        notes: task.notes || "",
        recurring: task.recurring || { frequency: "none", nextInstanceGenerated: false }
      });
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSave = async () => {
    if (!editedTask) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedTask),
      });
      if (res.ok) {
        updateTask(editedTask);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        removeTask(taskId!);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, taskId }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([...comments, data]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!task || !editedTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-800">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold border-0">
                {task.status.replace("-", " ")}
              </Badge>
              {task.projectId && (
                <Badge variant="outline" className="px-2.5 py-0.5 text-zinc-400 dark:text-zinc-500 font-medium border-zinc-200 dark:border-zinc-800">
                  Project Task
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 rounded-full" onClick={handleDelete} title="Delete Task">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-xl">
             <Input 
               value={editedTask.title} 
               className="text-2xl font-bold border-transparent px-0 hover:border-zinc-200 dark:hover:border-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-300 dark:focus-visible:border-zinc-700 shadow-none h-auto py-1 rounded-none bg-transparent dark:text-zinc-100" 
               onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
               placeholder="Task Title"
             />
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit task details
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-7 py-2 px-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50/50 dark:bg-zinc-950/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Status
              </Label>
              <Select 
                value={editedTask.status} 
                onValueChange={(v: any) => setEditedTask({...editedTask, status: v})}
              >
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm font-medium dark:text-zinc-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectItem value="todo" className="text-xs">To Do</SelectItem>
                  <SelectItem value="in-progress" className="text-xs">In Progress</SelectItem>
                  <SelectItem value="done" className="text-xs">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Priority
              </Label>
              <Select 
                value={editedTask.priority} 
                onValueChange={(v: any) => setEditedTask({...editedTask, priority: v})}
              >
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm font-medium capitalize dark:text-zinc-300">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectItem value="low" className="text-xs">Low</SelectItem>
                  <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="high" className="text-xs">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-zinc-400 dark:text-zinc-500" /> Due Date
              </Label>
              <div className="relative">
                <Input 
                  type="date"
                  value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ""} 
                  onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
                  className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm font-medium px-2 dark:text-zinc-300"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Recurring
              </Label>
              <Select 
                value={editedTask.recurring?.frequency || "none"} 
                onValueChange={(v: any) => setEditedTask({...editedTask, recurring: { ...editedTask.recurring, frequency: v }})}
              >
                <SelectTrigger className="h-8 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm font-medium capitalize dark:text-zinc-300">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  <SelectItem value="none" className="text-xs">None</SelectItem>
                  <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                  <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
              Description
            </Label>
            <Textarea 
              value={editedTask.description || ""} 
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              placeholder="Add more details about this task..."
              className="resize-none min-h-[80px] border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
              Tags
            </Label>
            <Input 
              value={editedTask.tags?.join(", ") || ""} 
              onChange={(e) => {
                const tagsArray = e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean);
                setEditedTask({...editedTask, tags: tagsArray});
              }}
              placeholder="e.g. frontend, urgent, bug (comma separated)"
              className="h-9 text-sm border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 shadow-sm dark:bg-zinc-950 dark:text-zinc-200"
            />
            {editedTask.tags && editedTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {editedTask.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium px-2 py-0.5 border-0">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
                Subtasks
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditedTask({...editedTask, subtasks: [...(editedTask.subtasks || []), { title: "", isCompleted: false }]})}
                className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary font-semibold"
              >
                + Add Subtask
              </Button>
            </div>
            <div className="space-y-2">
              {editedTask.subtasks?.length === 0 ? (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 text-center">No subtasks added yet.</div>
              ) : (
                editedTask.subtasks?.map((st: any, i: number) => (
                  <div key={i} className="flex gap-3 items-center group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1.5 pl-3 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/30 hover:border-zinc-300 dark:hover:border-zinc-700">
                    <input 
                      type="checkbox" 
                      checked={st.isCompleted} 
                      onChange={(e) => {
                        const newSubtasks = [...editedTask.subtasks];
                        newSubtasks[i].isCompleted = e.target.checked;
                        setEditedTask({...editedTask, subtasks: newSubtasks});
                      }}
                      className="w-4 h-4 text-primary rounded-sm border-zinc-300 dark:border-zinc-700 focus:ring-primary cursor-pointer transition-all bg-transparent"
                    />
                    <Input 
                      value={st.title} 
                      onChange={(e) => {
                        const newSubtasks = [...editedTask.subtasks];
                        newSubtasks[i].title = e.target.value;
                        setEditedTask({...editedTask, subtasks: newSubtasks});
                      }}
                      placeholder="What needs to be done?"
                      className={cn(
                        "h-7 text-sm border-transparent px-1 focus-visible:ring-0 shadow-none bg-transparent flex-1 transition-all dark:text-zinc-200",
                        st.isCompleted && "line-through text-zinc-400 dark:text-zinc-500"
                      )}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-zinc-300 dark:text-zinc-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newSubtasks = editedTask.subtasks.filter((_: any, idx: number) => idx !== i);
                        setEditedTask({...editedTask, subtasks: newSubtasks});
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
              Personal Notes
            </Label>
            <Textarea 
              value={editedTask.notes || ""} 
              onChange={(e) => setEditedTask({...editedTask, notes: e.target.value})}
              placeholder="Add personal notes, links, or references here..."
              className="resize-none min-h-[100px] border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20 bg-amber-50/30 dark:bg-amber-950/10 text-sm shadow-sm dark:text-zinc-200"
            />
          </div>

          <Separator className="my-1 dark:bg-zinc-800" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </div>

            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingComments ? (
                <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-center text-zinc-400 dark:text-zinc-500 py-4 italic">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 dark:bg-primary/20 text-primary">
                        {comment.userId?.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg p-3 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{comment.userId?.name}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input 
                placeholder="Write a comment..." 
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 h-9 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-200"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="border-zinc-200 dark:border-zinc-800 dark:text-zinc-300">Close</Button>
          <Button onClick={handleSave} disabled={saving} className="shadow-sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
