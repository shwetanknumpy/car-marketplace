import Link from "next/link";
import { Search, Shield, Star, TrendingUp, ArrowRight, Car } from "lucide-react";
import { getFeaturedListings } from "@/lib/db/listings";
import ListingCard from "@/components/listing-card";
import SearchBar from "@/components/search-bar";

export default async function HomePage() {
  const featuredListings = await getFeaturedListings(6);

  const stats = [
    { label: "Active Listings", value: "10,000+", icon: Car },
    { label: "Trusted Sellers", value: "2,500+", icon: Shield },
    { label: "Happy Buyers", value: "50,000+", icon: Star },
    { label: "Cars Sold", value: "35,000+", icon: TrendingUp },
  ];

  const brands = ["BMW", "Mercedes-Benz", "Audi", "Tesla", "Porsche", "Ford", "Toyota", "Honda"];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(221,83%,20%)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(252,50%,15%)_0%,_transparent_60%)]" />
        
        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(hsl(221,83%,53%) 1px, transparent 1px), linear-gradient(90deg, hsl(221,83%,53%) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white/80 text-sm mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Over 10,000 cars listed this month
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
              Find Your
              <span className="block text-gradient">Perfect Drive</span>
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-xl leading-relaxed">
              Browse thousands of verified pre-owned vehicles from trusted sellers. 
              Your dream car is just a search away.
            </p>

            {/* Search bar */}
            <div className="mb-10">
              <SearchBar />
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/cars"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg hover:opacity-90 hover:shadow-blue-500/30 transition-all"
              >
                Browse All Cars
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 bg-white/10 text-white font-semibold backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Sell Your Car
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative blur circles */}
        <div className="absolute right-[-100px] top-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute right-[200px] bottom-[-100px] w-[300px] h-[300px] rounded-full bg-purple-600/20 blur-3xl" />
      </section>

      {/* Stats */}
      <section className="bg-muted/50 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-brand mb-3 shadow-md">
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Brands */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Explore by Brand</p>
            <h2 className="text-3xl font-bold">Top Brands</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/cars?brand=${encodeURIComponent(brand)}`}
              className="px-5 py-2.5 rounded-full border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary font-medium text-sm transition-all shadow-sm hover:shadow-md"
            >
              {brand}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Just Listed</p>
              <h2 className="text-3xl font-bold">Featured Cars</h2>
            </div>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 text-primary font-semibold text-sm hover:underline"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Car className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No listings yet</p>
              <p className="text-sm mt-1">Be the first to post a car!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl overflow-hidden gradient-brand p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Sell Your Car?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              List your car in minutes and reach thousands of serious buyers. 
              It&apos;s free to get started.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-white/90 shadow-xl transition-all"
            >
              Start Selling Today
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-brand">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-sm">AutoMarket</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} AutoMarket. All rights reserved. Buy and sell with confidence.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
