import { create } from "zustand";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  projectId: string;
  subtasks?: Array<{ title: string; isCompleted: boolean }>;
  tags?: string[];
  notes?: string;
  recurring?: {
    frequency: "none" | "daily" | "weekly" | "monthly";
    nextInstanceGenerated: boolean;
  };
  startTime?: number;
}

interface KanbanState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, newStatus: "todo" | "in-progress" | "done") => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  updateTaskStatus: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
    })),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
    })),
  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) })),
}));
