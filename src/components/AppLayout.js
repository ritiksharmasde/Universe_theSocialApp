import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import doodleBg from "../public/doodle.svg";
function AppLayout({
  children,
  currentPage,
  onNavigate,
  theme = "light",
  onThemeChange,
  onLogout,
  hasUnreadMessages,
}) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  return (
    <div style={styles.page}>
  <div style={styles.doodleOverlay} />
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isMobile={isMobile}
        isTablet={isTablet}
        theme={theme}
        onThemeChange={onThemeChange}
        onLogout={onLogout}
          hasUnreadMessages={hasUnreadMessages}
      />

      <main
        style={{
          ...styles.mainContent,
          ...(isMobile
            ? styles.mainContentMobile
            : isTablet
            ? styles.mainContentTablet
            : styles.mainContentDesktop),
        }}
      >
        <div style={styles.innerContent}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  page: {
  minHeight: "100dvh",
  backgroundColor: "var(--bg-page)",

  backgroundImage: `url(${doodleBg})`,
  backgroundRepeat: "repeat",
  backgroundSize: "320px 320px",
  backgroundAttachment: "fixed",

  transition: "background 0.2s ease, color 0.2s ease",
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
  display: "flex",
  position: "relative",
},
  
  mainContent: {
    minHeight: "100dvh",
    boxSizing: "border-box",
    color: "var(--text-primary)",
    width: "100%",
    maxWidth: "100%",
    flex: 1,
    zIndex: 1,
    minWidth: 0,
    overflowX: "hidden",
  },

  innerContent: {
  width: "100%",
  maxWidth: "1240px",
  height: "100%",
  minWidth: 0,
  margin: "0 auto",
  padding: "0 12px",
  boxSizing: "border-box",
},

  mainContentDesktop: {
    marginLeft: "280px",
    padding: "24px 20px 24px 16px",
    height: "100dvh",
  boxSizing: "border-box",
  },

  mainContentTablet: {
    marginLeft: 0,
    padding: "88px 16px 20px",
  },
doodleOverlay: {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.25)", // 🔥 control darkness here
  pointerEvents: "none",
  zIndex: 0,
},
  mainContentMobile: {
    marginLeft: 0,
    padding: "72px 10px 14px",
  },
};

export default AppLayout;
