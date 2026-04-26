"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/cars?brand=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/cars");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl">
      <div className="flex items-center glass rounded-2xl p-1.5 shadow-xl">
        <Search className="ml-3 h-5 w-5 text-white/60 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand (BMW, Tesla, Porsche...)"
          className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-white/50 focus:outline-none text-sm"
        />
        <button
          type="submit"
          className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
