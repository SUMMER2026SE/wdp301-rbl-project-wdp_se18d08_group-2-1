import PhotoHubLanding from "../components/landingPage/PhotoHubLanding";
import AIChatWidget from "../components/landingPage/AIChatWidget";

export default function Home({ language, theme }) {
  return (
    <>
      <PhotoHubLanding language={language} />
      <AIChatWidget language={language} theme={theme} />
    </>
  );
}
