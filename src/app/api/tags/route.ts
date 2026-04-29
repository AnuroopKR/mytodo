import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Tag from "@/models/Tag";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const tags = await Tag.find({ userId: session.user.id }).sort({ name: 1 });

    return NextResponse.json(tags);
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
    const parsed = tagSchema.parse(body);

    await connectToDatabase();
    
    // check if tag with same name exists for this user
    const existingTag = await Tag.findOne({ name: parsed.name, userId: session.user.id });
    if (existingTag) {
      return NextResponse.json({ message: "Tag already exists" }, { status: 400 });
    }

    const newTag = await Tag.create({
      ...parsed,
      userId: session.user.id,
    });

    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
