import PhotographerChat from "../components/photographers/PhotographerChat";

export default function ChatPage({ theme = "dark", language = "vi" }) {
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen px-5 pb-16 pt-28 ${isDark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-950"}`}>
      <div className="mx-auto max-w-6xl">
        <PhotographerChat theme={theme} language={language} />
      </div>
    </main>
  );
}
