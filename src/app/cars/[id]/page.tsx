import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById } from "@/lib/db/listings";
import { formatPrice, formatMileage, formatDate } from "@/lib/utils";
import { Calendar, Gauge, Tag, FileText, User, Info } from "lucide-react";
import InquiryForm from "@/components/inquiry-form";
import ImageGallery from "@/components/image-gallery";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface CarDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: CarDetailPageProps): Promise<Metadata> {
  const listing = await getListingById(params.id);
  if (!listing) return { title: "Car Not Found" };
  return {
    title: `${listing.year} ${listing.brand} ${listing.model} — ${formatPrice(listing.price.toString())}`,
    description: `${listing.description.slice(0, 160)}...`,
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.images[0] ? [{ url: listing.images[0] }] : [],
    },
  };
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const [listing, session] = await Promise.all([
    getListingById(params.id),
    getServerSession(authOptions),
  ]);

  if (!listing) notFound();

  const isSeller = session?.user?.id === listing.sellerId;
  const isLoggedIn = !!session?.user;

  const statusVariant = listing.status === "ACTIVE" ? "active" : listing.status === "SOLD" ? "sold" : "draft";

  const specs = [
    { label: "Brand", value: listing.brand, icon: Tag },
    { label: "Model", value: listing.model, icon: Info },
    { label: "Year", value: String(listing.year), icon: Calendar },
    { label: "Mileage", value: formatMileage(listing.mileage), icon: Gauge },
    { label: "Listed by", value: listing.seller.name, icon: User },
    { label: "Listed", value: formatDate(listing.createdAt), icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-foreground transition-colors">Home</a>
          <span>/</span>
          <a href="/cars" className="hover:text-foreground transition-colors">Cars</a>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Title & Price */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {listing.brand}
                    </span>
                    <Badge variant={statusVariant as "active" | "sold" | "draft"}>
                      {listing.status}
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{listing.title}</h1>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-extrabold text-gradient">
                    {formatPrice(listing.price.toString())}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Asking price</p>
                </div>
              </div>

              {/* Quick specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50">
                    <spec.icon className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                      <p className="text-sm font-semibold">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Right: Inquiry + Seller */}
          <div className="space-y-4">
            {/* Price card sticky */}
            <div className="bg-card rounded-2xl border border-border p-6 sticky top-24">
              <div className="mb-4">
                <p className="text-3xl font-extrabold text-foreground">
                  {formatPrice(listing.price.toString())}
                </p>
                <p className="text-sm text-muted-foreground">{listing.year} · {formatMileage(listing.mileage)}</p>
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-brand text-white font-bold">
                  {listing.seller.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="font-semibold text-sm">{listing.seller.name}</p>
                </div>
              </div>

              {/* Inquiry section */}
              {listing.status !== "ACTIVE" ? (
                <div className="p-4 rounded-xl bg-muted text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    This car is no longer available.
                  </p>
                </div>
              ) : isSeller ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <p className="text-sm font-medium text-blue-700">
                    ✓ This is your listing
                  </p>
                  <a
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="mt-2 block text-sm text-blue-600 hover:underline font-medium"
                  >
                    Edit listing →
                  </a>
                </div>
              ) : isLoggedIn ? (
                <InquiryForm listingId={listing.id} />
              ) : (
                <div className="p-4 rounded-xl bg-muted text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sign in to contact the seller
                  </p>
                  <a
                    href={`/auth/login?callbackUrl=/cars/${listing.id}`}
                    className="block w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Login to Send Inquiry
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
