import React from "react";
import PhotographerList from "../components/photographers/PhotographerList";

export default function PhotographersPage({ language = "en", theme = "dark" }) {
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen pt-28 pb-16 transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-orange-50/40 text-slate-950"
      }`}
    >
      <PhotographerList language={language} />
    </div>
  );
}