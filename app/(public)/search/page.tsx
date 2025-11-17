import { Suspense } from "react";
import { Metadata } from "next";
import { AdvancedSearchForm } from "@/components/search/advanced-search-form";

export const metadata: Metadata = {
  title: "Advanced Search - Chant d'Espérance",
  description: "Search for hymns by title, lyrics, author, theme, and more",
};

export default function SearchPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Advanced Search</h1>
          <p className="text-gray-600">
            Search for hymns by title, lyrics, author, theme, and more
          </p>
        </div>

        <Suspense fallback={<SearchFallback />}>
          <AdvancedSearchForm />
        </Suspense>
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
