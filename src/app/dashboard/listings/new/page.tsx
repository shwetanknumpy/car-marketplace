import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ListingForm from "@/components/listing-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a New Car",
};

export default async function NewListingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-primary hover:underline font-medium">
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold mt-2">Post a New Car</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details below to list your car on AutoMarket.
          </p>
        </div>
        <ListingForm mode="create" />
      </div>
    </div>
  );
}
