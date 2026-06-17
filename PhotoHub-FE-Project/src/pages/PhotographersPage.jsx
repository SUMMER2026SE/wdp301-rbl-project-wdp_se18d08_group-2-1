import React from "react";
import PhotographerList from "../components/photographers/PhotographerList";

export default function PhotographersPage({ language = "en", theme = "dark" }) {
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen pt-28 pb-16 transition-colors duration-300 ${
        isDark ? "bg-[#020617] text-white" : "bg-white text-slate-900"
      }`}
    >
      <PhotographerList language={language} />
    </div>
  );
}
