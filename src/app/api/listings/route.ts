import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListings, createListing, getDistinctBrands } from "@/lib/db/listings";
import { listingSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      brand: searchParams.get("brand") ?? undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minYear: searchParams.get("minYear") ? Number(searchParams.get("minYear")) : undefined,
      maxYear: searchParams.get("maxYear") ? Number(searchParams.get("maxYear")) : undefined,
      maxMileage: searchParams.get("maxMileage") ? Number(searchParams.get("maxMileage")) : undefined,
      sellerId: searchParams.get("sellerId") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
    };

    const [result, brands] = await Promise.all([
      getListings(filters),
      getDistinctBrands(),
    ]);

    return NextResponse.json({ ...result, brands });
  } catch (error) {
    console.error("[GET /api/listings]", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = listingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const listing = await createListing({
      ...parsed.data,
      price: parsed.data.price as unknown as import("@prisma/client").Prisma.Decimal,
      sellerId: session.user.id,
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("[POST /api/listings]", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
