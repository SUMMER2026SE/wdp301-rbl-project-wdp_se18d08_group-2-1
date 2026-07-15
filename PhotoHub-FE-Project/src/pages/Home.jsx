import PhotoHubLanding from "../components/landingPage/PhotoHubLanding";
import AIChatWidget from "../components/landingPage/AIChatWidget.js";

export default function Home({ language, theme }) {
  return (
    <>
      <PhotoHubLanding language={language} />
      <AIChatWidget language={language} theme={theme} />
    </>
  );
}
