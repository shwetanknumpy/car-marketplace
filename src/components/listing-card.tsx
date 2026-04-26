import Link from "next/link";
import Image from "next/image";
import { MapPin, Gauge, Calendar } from "lucide-react";
import { formatPrice, formatMileage } from "@/lib/utils";
import type { ListingWithSeller } from "@/lib/db/listings";

interface ListingCardProps {
  listing: ListingWithSeller;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.images[0] ?? "/placeholder-car.jpg";

  return (
    <div className="group bg-card rounded-2xl border border-border overflow-hidden card-hover shadow-sm">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-muted">
        <Image
          src={primaryImage}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {/* Status badge */}
        {listing.status !== "ACTIVE" && (
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              listing.status === "SOLD"
                ? "bg-red-500 text-white"
                : "bg-amber-500 text-white"
            }`}>
              {listing.status}
            </span>
          </div>
        )}
        {/* Price overlay */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-bold text-xl drop-shadow-lg">
            {formatPrice(listing.price.toString())}
          </span>
        </div>
        {/* Photo count */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
            <span className="text-white text-xs">📷 {listing.images.length}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            {listing.brand}
          </p>
          <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-muted-foreground text-xs mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{listing.year}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            <span>{formatMileage(listing.mileage)}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[80px]">{listing.seller.name}</span>
          </div>
        </div>

        <Link
          href={`/cars/${listing.id}`}
          className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
