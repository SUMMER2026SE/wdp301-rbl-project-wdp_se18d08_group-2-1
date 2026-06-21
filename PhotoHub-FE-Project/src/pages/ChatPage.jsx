import { useLocation, useSearchParams } from "react-router-dom";
import PhotographerChat from "../components/photographers/PhotographerChat";

export default function ChatPage({ theme = "dark", language = "vi" }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const conversationId = searchParams.get("conversationId") || location.state?.activeConvId || null;
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen px-4 pb-12 pt-28 sm:px-6 lg:px-8 ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-950"}`}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-wide text-orange-500">PhotoHub Chat</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {language === "vi" ? "Tr\u00f2 chuy\u1ec7n realtime" : "Realtime conversation"}
          </h1>
        </div>
        <PhotographerChat theme={theme} language={language} initialActiveConvId={conversationId} />
      </div>
    </main>
  );
}
