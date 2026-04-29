import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();

    let task = await Task.findOne({ _id: id, userId: session.user.id });
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    if (body.startTime === null) {
      task.startTime = undefined;
      delete body.startTime;
    }
    
    task.set(body);

    // Recurring task spawning logic
    if (
      task.status === "done" &&
      task.recurring?.frequency &&
      task.recurring.frequency !== "none" &&
      !task.recurring.nextInstanceGenerated
    ) {
      const nextDueDate = new Date(task.dueDate || new Date());
      if (task.recurring.frequency === "daily") {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (task.recurring.frequency === "weekly") {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (task.recurring.frequency === "monthly") {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      await Task.create({
        title: task.title,
        description: task.description,
        status: "todo",
        priority: task.priority,
        dueDate: nextDueDate,
        projectId: task.projectId,
        userId: task.userId,
        subtasks: task.subtasks.map((st: any) => ({ title: st.title, isCompleted: false })),
        tags: task.tags,
        notes: task.notes,
        recurring: { frequency: task.recurring.frequency, nextInstanceGenerated: false },
      });

      task.recurring.nextInstanceGenerated = true;
    }

    await task.save();
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const task = await Task.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
