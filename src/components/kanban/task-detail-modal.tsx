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
      setEditedTask({ ...task });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <Badge variant="secondary" className="capitalize">
              {task.status.replace("-", " ")}
            </Badge>
            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-xl">
             <Input 
               value={editedTask.title} 
               className="text-xl font-bold border-none px-0 focus-visible:ring-0 shadow-none h-auto" 
               onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
             />
          </DialogTitle>
          <DialogDescription>
            {task.projectId ? "Task in project" : "Personal task"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Status</Label>
              <Select 
                value={editedTask.status} 
                onValueChange={(v: any) => setEditedTask({...editedTask, status: v})}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Priority</Label>
              <Select 
                value={editedTask.priority} 
                onValueChange={(v: any) => setEditedTask({...editedTask, priority: v})}
              >
                <SelectTrigger className="h-9">
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
              <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Due Date</Label>
              <div className="relative">
                <Input 
                  type="date"
                  value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ""} 
                  onChange={(e) => setEditedTask({...editedTask, dueDate: e.target.value})}
                  className="h-9 pl-9"
                />
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Description</Label>
            <Textarea 
              value={editedTask.description || ""} 
              onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
              placeholder="Add more details about this task..."
              className="resize-none min-h-[100px] border-zinc-200 focus-visible:ring-primary/20"
            />
          </div>

          <Separator className="my-2" />

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <MessageSquare className="h-4 w-4" />
              Comments ({comments.length})
            </div>

            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {loadingComments ? (
                <p className="text-xs text-center text-zinc-400 py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-center text-zinc-400 py-4 italic">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {comment.userId?.name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-zinc-50 rounded-lg p-3 border border-zinc-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-zinc-900">{comment.userId?.name}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed">{comment.content}</p>
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
                className="flex-1 h-9"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="border-zinc-200">Close</Button>
          <Button onClick={handleSave} disabled={saving} className="shadow-sm">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
