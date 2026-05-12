import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInquiry, checkDuplicateInquiry } from "@/lib/db/inquiries";
import { getListingById } from "@/lib/db/listings";
import { inquirySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, listingId } = parsed.data;
    const buyerId = session.user.id;

    // Verify listing exists
    const listing = await getListingById(listingId);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Prevent seller from contacting themselves
    if (listing.sellerId === buyerId) {
      return NextResponse.json(
        { error: "You cannot send an inquiry on your own listing" },
        { status: 400 }
      );
    }

    // Prevent duplicate inquiries
    const isDuplicate = await checkDuplicateInquiry(listingId, buyerId);
    if (isDuplicate) {
      return NextResponse.json(
        { error: "You have already sent an inquiry for this listing" },
        { status: 409 }
      );
    }

    const inquiry = await createInquiry({ message, listingId, buyerId });
    return NextResponse.json(inquiry, { status: 201 });
  } catch (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json({ error: "Failed to send inquiry" }, { status: 500 });
  }
}
