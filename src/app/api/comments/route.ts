import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Comment from "@/models/Comment";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  taskId: z.string().min(1, "Task ID is required"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const comments = await Comment.find({ taskId }).sort({ createdAt: 1 }).populate("userId", "name");

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, taskId } = commentSchema.parse(body);

    await connectToDatabase();
    const newComment = await Comment.create({
      content,
      taskId,
      userId: session.user.id,
    });

    const populatedComment = await newComment.populate("userId", "name");

    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
