"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

interface CarsFilterProps {
  brands: string[];
  currentFilters: {
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    maxMileage?: string;
  };
  mobile?: boolean;
}

export default function CarsFilter({ brands, currentFilters, mobile = false }: CarsFilterProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [brand, setBrand] = useState(currentFilters.brand ?? "");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice ?? "");
  const [minYear, setMinYear] = useState(currentFilters.minYear ?? "");
  const [maxYear, setMaxYear] = useState(currentFilters.maxYear ?? "");
  const [maxMileage, setMaxMileage] = useState(currentFilters.maxMileage ?? "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minYear) params.set("minYear", minYear);
    if (maxYear) params.set("maxYear", maxYear);
    if (maxMileage) params.set("maxMileage", maxMileage);
    router.push(`/cars?${params.toString()}`);
    setMobileOpen(false);
  }, [brand, minPrice, maxPrice, minYear, maxYear, maxMileage, router]);

  function clearAll() {
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setMaxMileage("");
    router.push("/cars");
    setMobileOpen(false);
  }

  const filterContent = (
    <div className="space-y-6">
      {/* Brand */}
      <div>
        <label className="block text-sm font-semibold mb-2">Brand</label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold mb-2">Price Range</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min $"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min={0}
            className="w-1/2 h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Max $"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min={0}
            className="w-1/2 h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-semibold mb-2">Year</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="From"
            value={minYear}
            onChange={(e) => setMinYear(e.target.value)}
            min={1900}
            max={2025}
            className="w-1/2 h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="To"
            value={maxYear}
            onChange={(e) => setMaxYear(e.target.value)}
            min={1900}
            max={2025}
            className="w-1/2 h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Max Mileage */}
      <div>
        <label className="block text-sm font-semibold mb-2">Max Mileage</label>
        <input
          type="number"
          placeholder="e.g. 50000"
          value={maxMileage}
          onChange={(e) => setMaxMileage(e.target.value)}
          min={0}
          className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={applyFilters}
          className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Apply Filters
        </button>
        <button
          onClick={clearAll}
          className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative z-10 bg-card rounded-t-3xl sm:rounded-2xl border border-border p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 sticky top-24">
      <h2 className="text-base font-bold mb-5 flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </h2>
      {filterContent}
    </div>
  );
}
