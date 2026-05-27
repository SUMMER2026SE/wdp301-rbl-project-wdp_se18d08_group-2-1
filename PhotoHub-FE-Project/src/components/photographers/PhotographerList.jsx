import React, { useEffect } from "react";
import { Loader, AlertCircle } from "lucide-react";
import PhotographerCard from "./PhotographerCard";
import usePhotographers from "../../hooks/usePhotographers";

export default function PhotographerList({ language = "en" }) {
  const { photographers, loading, error, listPhotographers } = usePhotographers();

  useEffect(() => {
    listPhotographers();
  }, [listPhotographers]);

  const labels = {
    en: { title: "Our Photographers", noResults: "No photographers found" },
    vi: { title: "Danh Sách Nhiếp Ảnh Gia", noResults: "Không tìm thấy nhiếp ảnh gia nào" }
  };
  const t = labels[language] || labels.en;

  if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-center p-6 text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h2>
      {photographers.length === 0 ? (
        <p className="text-center text-gray-500">{t.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {photographers.map((p) => (
            <PhotographerCard key={p._id} photographer={p} language={language} />
          ))}
        </div>
      )}
    </div>
  );
}
