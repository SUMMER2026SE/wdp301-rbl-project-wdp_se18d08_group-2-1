import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "./components/landingPage/Footer";
import Header from "./components/landingPage/Header";
import Home from "./pages/Home";

function getInitialTheme() {
  const storedTheme = localStorage.getItem("photohub-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function getInitialLanguage() {
  const storedLanguage = localStorage.getItem("photohub-language");
  return storedLanguage === "vi" ? "vi" : "en";
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem("photohub-theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("photohub-language", language);
    document.documentElement.lang = language === "vi" ? "vi" : "en";
  }, [language]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  const toggleLanguage = () => {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "vi" : "en"));
  };

  return (
    <div className={`theme-${theme} relative flex min-h-screen w-full flex-col overflow-x-hidden`}>
      <Header
        language={language}
        theme={theme}
        onToggleLanguage={toggleLanguage}
        onToggleTheme={toggleTheme}
      />
      <Routes>
        <Route path="/" element={<Home language={language} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer language={language} />
    </div>
  );
}
