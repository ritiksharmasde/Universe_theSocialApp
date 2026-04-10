import React, { useEffect, useRef, useState } from "react";
import {
  FiHome,
  FiSearch,
  FiUsers,
  FiMessageSquare,
  FiBell,
  FiPlusSquare,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMonitor,
  FiMenu,
  FiUser,
  FiAlertCircle,
} from "react-icons/fi";

function Sidebar({
  onNavigate,
  currentPage,
  isMobile,
  isTablet,
  theme = "light",
  onThemeChange,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const isCompact = isMobile || isTablet;

  const navItems = [
    { id: "feed", label: "Home", icon: <FiHome /> },
    { id: "search", label: "Search", icon: <FiSearch /> },
    { id: "groups", label: "Groups", icon: <FiUsers /> },
    { id: "messages", label: "Messages", icon: <FiMessageSquare /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
    { id: "feedback", label: "Feedback", icon: <FiAlertCircle /> },
    {
      id: "create-post",
      label: "Create",
      icon: <FiPlusSquare />,
      primary: true,
    },
  ];

  const compactNavItems = isMobile
    ? [
      { id: "feed", label: "Home", icon: <FiHome /> },

      { id: "groups", label: "Groups", icon: <FiUsers /> },
      { id: "messages", label: "Messages", icon: <FiMessageSquare /> },


      {
        id: "create-post",
        label: "Create",
        icon: <FiPlusSquare />,
        primary: true,
      },

    ]
    : navItems;

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  const handleThemeSelect = (mode) => {
    onThemeChange(mode);
    setMenuOpen(false);
  };

  const handleMenuNavigate = (page) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        ...(isCompact ? styles.sidebarCompact : styles.sidebarDesktop),
      }}
    >
      {!isCompact && (
        <div style={styles.logoContainer}>
          <img
            src="/favicon.png"
            alt="UniVerse Logo"
            style={styles.logoImage}
          />
          <h1 style={styles.logo}>
            Uni<span style={styles.logoAccent}>Verse</span>
          </h1>
        </div>
      )}

      {isCompact ? (
        <>
          <div style={styles.mobileTopBar}>
            <button
              type="button"
              style={styles.mobileTopItem}
              onClick={() => onNavigate("feed")}
              aria-label="UniVerse Home"
              title="UniVerse"
            >
              <img
                src="/favicon.png"
                alt="UniVerse"
                style={styles.mobileTopLogo}
              />
            </button>
          {/* <aside
            className={!isCompact ? "sidebar-scroll" : ""}
            style={{
              ...styles.sidebar,
              ...(isCompact ? styles.sidebarCompact : styles.sidebarDesktop),
            }}
          ></aside> */}

            <div style={styles.mobileNav}>
              {compactNavItems.map((item) => {
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    style={{
                      ...styles.navButton,
                      ...styles.navButtonMobile,
                      ...(item.primary ? styles.primaryNavButton : {}),
                      ...(isActive && !item.primary ? styles.activeNavButton : {}),
                    }}
                    onClick={() => onNavigate(item.id)}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <span style={styles.navIconMobile}>{item.icon}</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.mobileActions}>
              <button
                ref={menuButtonRef}
                type="button"
                style={styles.menuButton}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Open menu"
                title="Menu"
              >
                <FiMenu />
              </button>
            </div>
          </div>

          {menuOpen && (
            <div ref={menuRef} style={styles.mobileMenu}>
              <button
                type="button"
                style={styles.menuItem}
                onClick={() => handleMenuNavigate("profile-details")}
              >
                <span style={styles.menuItemIcon}>
                  <FiUser />
                </span>
                <span>View Profile</span>
              </button>
              <button
                type="button"
                style={styles.menuItem}
                onClick={() => handleMenuNavigate("search")}
              >
                <span style={styles.menuItemIcon}>
                  <FiSearch />
                </span>
                <span>Search</span>
              </button>

              <button
                type="button"
                style={styles.menuItem}
                onClick={() => handleMenuNavigate("notifications")}
              >
                <span style={styles.menuItemIcon}>
                  <FiBell />
                </span>
                <span>Notifications</span>
              </button>
              <button
                type="button"
                style={{
                  ...styles.menuItem,
                  ...(theme === "light" ? styles.activeMenuItem : {}),
                }}
                onClick={() => handleThemeSelect("light")}
              >
                <span style={styles.menuItemIcon}>
                  <FiSun />
                </span>
                <span>Light</span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.menuItem,
                  ...(theme === "dark" ? styles.activeMenuItem : {}),
                }}
                onClick={() => handleThemeSelect("dark")}
              >
                <span style={styles.menuItemIcon}>
                  <FiMoon />
                </span>
                <span>Dark</span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.menuItem,
                  ...(theme === "grey" ? styles.activeMenuItem : {}),
                }}
                onClick={() => handleThemeSelect("grey")}
              >
                <span style={styles.menuItemIcon}>
                  <FiMonitor />
                </span>
                <span>Grey</span>
              </button>
              <button
                type="button"
                style={styles.menuItem}
                onClick={() => handleMenuNavigate("feedback")}
              >
                <span style={styles.menuItemIcon}>
                  <FiAlertCircle />
                </span>
                <span>Feedback</span>
              </button>
              <button
                type="button"
                style={styles.menuItem}
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
              >
                <span style={styles.menuItemIcon}>
                  <FiLogOut />
                </span>
                <span>Logout</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ ...styles.navList, ...styles.navListDesktop }}>
            {navItems.map((item) => {
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  style={{
                    ...styles.navButton,
                    ...(item.primary ? styles.primaryNavButton : {}),
                    ...(isActive && !item.primary ? styles.activeNavButton : {}),
                  }}
                  onClick={() => onNavigate(item.id)}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div style={styles.themeSwitcher}>
            <button
              type="button"
              style={{
                ...styles.themeButton,
                ...(theme === "light" ? styles.activeThemeButton : {}),
              }}
              onClick={() => onThemeChange("light")}
            >
              Light
            </button>
            <button
              type="button"
              style={{
                ...styles.themeButton,
                ...(theme === "dark" ? styles.activeThemeButton : {}),
              }}
              onClick={() => onThemeChange("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              style={{
                ...styles.themeButton,
                ...(theme === "grey" ? styles.activeThemeButton : {}),
              }}
              onClick={() => onThemeChange("grey")}
            >
              Grey
            </button>
          </div>

          <button type="button" style={styles.logoutButton} onClick={onLogout}>
            <span style={styles.navIcon}>
              <FiLogOut />
            </span>
            <span>Logout</span>
          </button>
        </>
      )}
    </aside>
  );
}

const styles = {
  sidebar: {
    background: "var(--bg-surface)",
    boxSizing: "border-box",
    zIndex: 1000,
  },

  sidebarDesktop: {
  position: "fixed",
  top: "24px",
  left: "24px",
  width: "280px",
  height: "calc(100dvh - 48px)",
  border: "1px solid var(--border-color)",
  borderRadius: "20px",
  padding: "24px 18px",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overflowX: "hidden",
  scrollBehavior: "smooth",
},

  sidebarCompact: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    borderBottom: "1px solid var(--border-color)",
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
  },

  mobileTopBar: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    gap: "8px",
    minWidth: 0,
  },

  mobileNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: "8px",
    flex: 1,
    minWidth: 0,
    overflowX: "auto",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitOverflowScrolling: "touch",
  },

  mobileActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },

  mobileTopItem: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    borderRadius: "10px",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  },

  mobileTopLogo: {
    width: "55px",
    height: "55px",
    objectFit: "contain",
  },

  menuButton: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    background: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    cursor: "pointer",
    color: "var(--text-primary)",
    flexShrink: 0,
  },

  mobileMenu: {
    position: "absolute",
    top: "60px",
    right: "10px",
    maxWidth: "90vw",
    width: "190px",
    minWidth: "170px",
    background: "var(--bg-surface)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 2000,
    boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
    paddingLeft: "6px",
  },

  logoImage: {
    width: "82px",
    height: "82px",
    objectFit: "contain",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "800",
    margin: 0,
    color: "var(--text-primary)",
  },

  logoAccent: {
    color: "var(--accent-color)",
  },

  navList: {
    display: "flex",
    gap: "8px",
  },

  navListDesktop: {
    flexDirection: "column",
    marginTop: "28px",
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },

  navButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    border: "none",
    background: "transparent",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "15px",
    color: "var(--text-primary)",
    flexShrink: 0,
  },

  navButtonMobile: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    padding: 0,
    justifyContent: "center",
    borderRadius: "10px",
  },

  navIcon: {
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  navIconMobile: {
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  activeNavButton: {
    background: "var(--bg-surface-soft)",
  },

  primaryNavButton: {
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
  },

  themeSwitcher: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginTop: "14px",
    width: "100%",
  },

  themeButton: {
    height: "44px",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 12px",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    cursor: "pointer",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: "15px",
    fontWeight: "600",
    boxSizing: "border-box",
    textAlign: "center",
  },

  activeThemeButton: {
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
    border: "1px solid var(--button-primary)",
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    border: "1px solid var(--border-color)",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    borderRadius: "10px",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "left",
  },

  activeMenuItem: {
    background: "var(--button-primary)",
    color: "var(--button-primary-text)",
  },

  menuItemIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  logoutButton: {
    marginTop: "14px",
    width: "100%",
    height: "78px",
    padding: "16px 18px",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    cursor: "pointer",
    background: "transparent",
    color: "var(--text-primary)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxSizing: "border-box",
    flexShrink: 0,
  },
};

export default Sidebar;