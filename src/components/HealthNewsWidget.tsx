"use client";

import React, { useState, useEffect } from "react";
import { 
  Newspaper, Search, RefreshCw, ExternalLink, 
  Clock, BookOpen, Flame, ShieldAlert, Globe
} from "lucide-react";

export interface HealthNewsItem {
  id: string;
  title: string;
  summary: string;
  category: "wabah" | "kronis" | "pencegahan" | "riset";
  categoryLabel: string;
  source: string;
  sourceUrl: string;
  author: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  diseaseTags: string[];
  urgency: "Tinggi" | "Sedang" | "Info";
}

const CATEGORIES = [
  { id: "semua", label: "Semua Berita" },
  { id: "wabah", label: "Wabah & Infeksi" },
  { id: "kronis", label: "Penyakit Kronis" },
  { id: "pencegahan", label: "Pencegahan & Nutrisi" },
  { id: "riset", label: "Riset Medis" }
];

export default function HealthNewsWidget() {
  const [articles, setArticles] = useState<HealthNewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/health-news", window.location.origin);
      if (activeCategory !== "semua") {
        url.searchParams.set("category", activeCategory);
      }
      if (searchQuery.trim()) {
        url.searchParams.set("search", searchQuery.trim());
      }

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
      }
    } catch (err) {
      console.error("Gagal memuat berita kesehatan internet:", err);
    } finally {
      setLoading(false);
      const now = new Date();
      setLastRefreshed(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  useEffect(() => {
    fetchNews();
  }, [activeCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews();
  };

  const handleOpenArticle = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Urgent health warning article if present
  const urgentAlert = articles.find(a => a.urgency === "Tinggi");

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 md:p-6 mb-8 transition-all hover:shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Portal Berita Kesehatan & Penyakit Internet Live</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Feed Internet
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Berita kesehatan otomatis dari portal internet (Detik Health, Kemenkes, WHO, Kompas). Klik berita untuk langsung menuju portal asal.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berita kesehatan di internet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-800"
            />
          </form>

          {/* Refresh Button */}
          <button
            onClick={fetchNews}
            disabled={loading}
            title="Refresh Berita Internet"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/30"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Urgent Warning Banner */}
      {urgentAlert && (
        <div 
          onClick={() => handleOpenArticle(urgentAlert.sourceUrl)}
          className="mb-6 p-4 rounded-xl bg-amber-50/90 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-amber-100/80 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 rounded">
                  Peringatan Kesehatan Internet
                </span>
                <span className="text-xs font-semibold text-amber-800">{urgentAlert.source}</span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950 mt-1 line-clamp-1">
                {urgentAlert.title}
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5 line-clamp-1">
                {urgentAlert.summary}
              </p>
            </div>
          </div>
          <a
            href={urgentAlert.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <span>Buka Berita Asli</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* News Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="h-36 bg-slate-200 rounded-lg mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-full mb-1" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">Tidak ada berita ditemukan</p>
          <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau pilih kategori Semua Berita.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((item) => (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group cursor-pointer bg-white rounded-xl border border-slate-200/90 overflow-hidden flex flex-col hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-200 relative text-left no-underline"
            >
              {/* Card Image Cover */}
              <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                
                {/* Category & Urgency Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">
                    {item.categoryLabel}
                  </span>
                  {item.urgency === "Tinggi" && (
                    <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-600 text-white flex items-center gap-1 shadow-sm">
                      <Flame className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>

                {/* External Link Indicator Badge */}
                <div className="absolute top-2.5 right-2.5 p-1.5 bg-slate-900/80 text-white rounded-lg group-hover:bg-teal-600 transition-colors shadow-sm">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>

                {/* Source Badge */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[11px] font-medium flex items-center justify-between">
                  <span className="font-semibold text-teal-300 truncate max-w-[160px] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-teal-300 shrink-0" />
                    {item.source}
                  </span>
                  <span className="opacity-90 shrink-0">{formatDate(item.publishedAt)}</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {item.summary}
                  </p>
                </div>

                <div>
                  {/* Disease Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.diseaseTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {item.readTime}
                    </span>
                    <span className="text-teal-600 font-bold group-hover:underline flex items-center gap-1 text-[11px]">
                      <span>Buka Artikel di Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Last Updated Timestamp Footer */}
      {lastRefreshed && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Terakhir diperbarui dari internet: {lastRefreshed}</span>
          <span>Menampilkan {articles.length} berita kesehatan live dari internet</span>
        </div>
      )}
    </div>
  );
}
