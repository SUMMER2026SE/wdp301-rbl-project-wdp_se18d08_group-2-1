import React from "react";
import FavoritePhotographerList from "../components/customer/FavoritePhotographerList";

export default function FavoritesPage({ language = "vi", theme = "dark" }) {
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen px-6 pt-32 pb-16 transition-colors duration-300 ${
        isDark ? "bg-[#020617] text-white" : "bg-white text-slate-900"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <FavoritePhotographerList language={language} isDark={isDark} />
      </div>
    </div>
  );
}
