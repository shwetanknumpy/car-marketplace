import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { markInquiryRead } from "@/lib/db/inquiries";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inquiry = await markInquiryRead(params.id, session.user.id);
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("[PATCH /api/inquiries/[id]]", error);
    if (error instanceof Error && error.message.includes("not found or unauthorized")) {
      return NextResponse.json({ error: "Inquiry not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
