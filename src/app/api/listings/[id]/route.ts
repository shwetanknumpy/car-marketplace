import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById, updateListing, deleteListing } from "@/lib/db/listings";
import { listingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const listing = await getListingById(params.id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch (error) {
    console.error("[GET /api/listings/[id]]", error);
    return NextResponse.json({ error: "Failed to fetch listing" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = listingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const listing = await updateListing(params.id, session.user.id, parsed.data);
    return NextResponse.json(listing);
  } catch (error) {
    console.error("[PUT /api/listings/[id]]", error);
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteListing(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/listings/[id]]", error);
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Listing not found or unauthorized" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
  }
}
