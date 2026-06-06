import React, { useEffect } from "react";
import PhotographerCard from "./PhotographerCard";
import usePhotographers from "../../hooks/usePhotographers";

export default function PhotographerList({ language = "en" }) {
  const { photographers, loading, error, listPhotographers } = usePhotographers();

  useEffect(() => {
    listPhotographers();
  }, [listPhotographers]);

  const labels = {
    en: { 
      title: "Our Photographers", 
      subtitle: "Discover elite creators capturing timeless visual stories",
      noResults: "No creators found matching this criteria" 
    },
    vi: { 
      title: "Hội Biểu Diễn Thị Giác", 
      subtitle: "Khám phá những nhiếp ảnh gia hàng đầu định hình phong cách của bạn",
      noResults: "Không tìm thấy nhiếp ảnh gia nào" 
    }
  };
  const t = labels[language] || labels.en;

  // Render trạng thái đang tải dạng Skeleton Card cao cấp
  if (loading) return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="h-8 w-64 bg-slate-200 dark:bg-zinc-800 rounded-2xl animate-pulse mb-3" />
      <div className="h-4 w-96 bg-slate-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-12" />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-[430px] rounded-3xl bg-slate-100 dark:bg-zinc-900 animate-pulse border border-slate-200/50 dark:border-zinc-800/50" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-12 rounded-3xl border border-red-500/10 bg-red-500/5 backdrop-blur-md">
      <p className="font-semibold text-red-500 dark:text-red-400">{error}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 text-slate-900 dark:text-zinc-100 relative transition-colors duration-300">
      
      {/* Background Decorative Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 mb-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-zinc-200 dark:to-zinc-400">
          {t.title}
        </h2>
        <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-zinc-400 font-medium tracking-wide">
          {t.subtitle}
        </p>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {photographers.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl">
            <p className="text-sm font-semibold text-slate-400 dark:text-zinc-500 tracking-wider uppercase">{t.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {photographers.map((p) => (
              <PhotographerCard key={p._id} photographer={p} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}