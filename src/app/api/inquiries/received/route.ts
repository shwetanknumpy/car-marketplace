import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInquiriesForSeller } from "@/lib/db/inquiries";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inquiries = await getInquiriesForSeller(session.user.id);
    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("[GET /api/inquiries/received]", error);
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}
