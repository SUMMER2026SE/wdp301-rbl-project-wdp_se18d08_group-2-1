import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { bookingService } from "../../services/bookingService";

export default function ReviewList({ photographerId, reviews: initialReviews, language = "vi" }) {
  const [reviews, setReviews] = useState(initialReviews || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialReviews) {
      setReviews(initialReviews);
    }
  }, [initialReviews]);

  useEffect(() => {
    if (photographerId && !initialReviews) {
      const fetchReviews = async () => {
        setLoading(true);
        try {
          const res = await bookingService.getPhotographerReviews(photographerId);
          if (res.success && res.data) {
            setReviews(res.data.reviews || []);
          }
        } catch (err) {
          console.error("Lỗi khi tải danh sách đánh giá:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchReviews();
    }
  }, [photographerId, initialReviews]);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `https://photo-hub-be-project.vercel.app${url.startsWith("/") ? url : `/${url}`}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 dark:text-zinc-500">
        <Star size={36} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">
          {language === "vi" ? "Chưa có đánh giá nào." : "No reviews yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => (
        <div
          key={rev._id}
          className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center overflow-hidden shrink-0 border border-orange-500/20">
                {rev.customer?.avatar ? (
                  <img
                    src={getFullUrl(rev.customer.avatar)}
                    alt={rev.customer?.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-orange-500">
                    {rev.customer?.fullName?.charAt(0).toUpperCase() || "C"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-100">
                  {rev.customer?.fullName || "Customer"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                  {new Date(rev.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-zinc-700"}
                />
              ))}
            </div>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-300 leading-relaxed pl-10.5">
            {rev.comment}
          </p>
        </div>
      ))}
    </div>
  );
}
