import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getListingById } from "@/lib/db/listings";
import ListingForm from "@/components/listing-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Listing",
};

export const dynamic = "force-dynamic";

interface EditListingPageProps {
  params: { id: string };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const listing = await getListingById(params.id);
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-primary hover:underline font-medium">
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold mt-2">Edit Listing</h1>
          <p className="text-muted-foreground mt-1">Update the details for your listing.</p>
        </div>
        <ListingForm
          mode="edit"
          listingId={params.id}
          defaultValues={{
            title: listing.title,
            brand: listing.brand,
            model: listing.model,
            year: listing.year,
            mileage: listing.mileage,
            price: Number(listing.price),
            description: listing.description,
            status: listing.status,
            images: listing.images,
          }}
        />
      </div>
    </div>
  );
}
