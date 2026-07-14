"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackEvent } from "@/lib/analytics-client";

export default function ProductsSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      trackEvent({ type: "SEARCH", searchTerm: term, path: "/products" });
      window.location.href = `/products?search=${encodeURIComponent(term)}`;
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar - Desktop */}
      <div className="hidden md:flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full border-[#c8d5be] focus:border-[#425733] focus:ring-[#e3ebdd]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#e3ebdd] rounded-full transition-colors"
            >
              <Search className="w-4 h-4 text-[hsl(220,14%,45%)]" />
            </button>
          </div>
        </form>
      </div>

      {/* Mobile Search Toggle */}
      <div className="md:hidden flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full w-10 h-10"
          onClick={() => setShowSearch(!showSearch)}
        >
          <Search className="w-5 h-5 text-[hsl(220,14%,45%)]" />
        </Button>
      </div>

      {/* Mobile Search Bar */}
      {showSearch && (
        <div className="md:hidden absolute top-full left-0 right-0 p-4 bg-white border-b border-[#e3ebdd]">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 rounded-full border-[#c8d5be]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="p-2 hover:bg-[#e3ebdd] rounded-full"
            >
              <X className="w-5 h-5 text-[hsl(220,14%,45%)]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
