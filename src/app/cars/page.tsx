import type { Metadata } from "next";
import { getListings, getDistinctBrands } from "@/lib/db/listings";
import ListingCard from "@/components/listing-card";
import CarsFilter from "@/components/cars-filter";
import { Car, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse Cars",
  description: "Browse all available cars on AutoMarket. Filter by brand, price, year, and mileage.",
};

interface CarsPageProps {
  searchParams: {
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    maxMileage?: string;
    page?: string;
  };
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const currentPage = Number(searchParams.page) || 1;

  const filters = {
    brand: searchParams.brand,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    minYear: searchParams.minYear ? Number(searchParams.minYear) : undefined,
    maxYear: searchParams.maxYear ? Number(searchParams.maxYear) : undefined,
    maxMileage: searchParams.maxMileage ? Number(searchParams.maxMileage) : undefined,
    page: currentPage,
    limit: 12,
  };

  const [{ listings, total, pages }, brands] = await Promise.all([
    getListings(filters),
    getDistinctBrands(),
  ]);

  const hasFilters = Object.entries(searchParams).some(
    ([key, val]) => key !== "page" && val !== undefined && val !== ""
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Browse Cars</h1>
              <p className="text-muted-foreground mt-1">
                {total > 0 ? (
                  <>Showing <span className="font-semibold text-foreground">{listings.length}</span> of <span className="font-semibold text-foreground">{total}</span> vehicles</>
                ) : (
                  "No vehicles found"
                )}
              </p>
            </div>
            {hasFilters && (
              <a
                href="/cars"
                className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
              >
                Clear all filters ✕
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 lg:items-start">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <CarsFilter brands={brands} currentFilters={searchParams} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter row */}
            <div className="lg:hidden mb-6">
              <CarsFilter brands={brands} currentFilters={searchParams} mobile />
            </div>

            {listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                      const params = new URLSearchParams(
                        Object.entries(searchParams).filter(([, v]) => v !== undefined) as [string, string][]
                      );
                      params.set("page", String(p));
                      return (
                        <a
                          key={p}
                          href={`/cars?${params.toString()}`}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            p === currentPage
                              ? "gradient-brand text-white shadow-md"
                              : "border border-border hover:bg-muted"
                          }`}
                        >
                          {p}
                        </a>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Car className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-bold mb-2">No cars found</h2>
                <p className="text-muted-foreground max-w-sm">
                  Try adjusting your filters or{" "}
                  <a href="/cars" className="text-primary font-medium hover:underline">
                    clear all filters
                  </a>{" "}
                  to see all available cars.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
