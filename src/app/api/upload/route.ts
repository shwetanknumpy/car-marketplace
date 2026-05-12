import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImages } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { images } = body as { images: string[] };

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > 6) {
      return NextResponse.json({ error: "Maximum 6 images allowed" }, { status: 400 });
    }

    const urls = await uploadImages(images, "car-marketplace");
    return NextResponse.json({ urls });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ error: "Failed to upload images" }, { status: 500 });
  }
}

// Route segment config
export const maxDuration = 30;
