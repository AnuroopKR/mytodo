import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubtask {
  _id?: Types.ObjectId;
  title: string;
  isCompleted: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  subtasks: ISubtask[];
  tags: string[];
  notes?: string;
  recurring?: {
    frequency: "none" | "daily" | "weekly" | "monthly";
    nextInstanceGenerated: boolean;
  };
  startTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    dueDate: { type: Date },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subtasks: [
      {
        title: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
      },
    ],
    tags: [{ type: String }],
    notes: { type: String },
    recurring: {
      frequency: { type: String, enum: ["none", "daily", "weekly", "monthly"], default: "none" },
      nextInstanceGenerated: { type: Boolean, default: false },
    },
    startTime: { type: Number, min: 0, max: 23 },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
