import React, { useEffect, useState } from "react";
import AppLayout from "./components/AppLayout";
import WelcomePage from "./WelcomePage";
import OtpPage from "./OtpPage";
import socket from "./socket";
import ProfilePage from "./ProfilePage";
import FeedPage from "./FeedPage";
import CreatePostPage from "./CreatePostPage";
import ProfileDetailsPage from "./ProfileDetailsPage";
import GroupsPage from "./GroupsPage";
import MessagesPage from "./MessagesPage";
import SearchPage from "./SearchPage";
import PublicProfilePage from "./PublicProfilePage";
import NotificationsPage from "./NotificationsPage";
import API_BASE_URL, { SERVER_BASE_URL } from "./api";
import CreateGroupPage from "./CreateGroupPage";
import useBreakpoint from "./useBreakpoint";
import GroupChatPage from "./GroupChatPage";
import FeedbackPage from "./FeedbackPage";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [currentPage, setCurrentPage] = useState("welcome");
  const [email, setEmail] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const currentUserEmail = email;
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isRouteReady, setIsRouteReady] = useState(false);
  const [conversationIdsByEmail, setConversationIdsByEmail] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // ✅ NEW: Fetch conversations at App level (fixes the 28s delay!)
  const [conversations, setConversations] = useState([]);

  const hasUnreadMessages = Object.values(unreadCounts || {}).some(
    (count) => count > 0
  );

  const { isMobile } = useBreakpoint();

  const navigateTo = (page, extra = {}) => {
    if (extra.selectedUserEmail !== undefined) {
      setSelectedUserEmail(extra.selectedUserEmail);
    }
    if (extra.activeConversationId !== undefined) {
      setActiveConversationId(extra.activeConversationId);
    }
    setCurrentPage(page);
  };

  const pageToPath = (page, selectedEmail = "") => {
    switch (page) {
      case "welcome":
        return "/";
      case "otp":
        return "/otp";
      case "profile":
        return "/profile";
      case "feed":
        return "/feed";
      case "messages":
        return "/messages";
      case "groups":
        return "/groups";
      case "create-group":
        return "/create-group";
      case "profile-details":
        return "/profile-details";
      case "create-post":
        return "/create-post";
      case "search":
        return "/search";
      case "notifications":
        return "/notifications";
      case "public-profile":
        return selectedEmail
          ? `/public-profile/${encodeURIComponent(selectedEmail)}`
          : "/public-profile";
      case "feedback":
        return "/feedback";
      default:
        return "/";
    }
  };

  // ============ SOCKET CONNECTION ============
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !email) return;

    socket.auth = {
      token,
    };

    if (!socket.connected) {
      socket.connect();
    }
  }, [email]);

  // ============ THEME ============
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ============ LOAD SAVED EMAIL ============
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setEmail(savedEmail.toLowerCase());
    }
  }, []);

  // ============ ROUTE INITIALIZATION ============
  useEffect(() => {
    const path = window.location.pathname;
    const savedEmail = localStorage.getItem("userEmail");

    if (path === "/") {
      setCurrentPage(savedEmail ? "feed" : "welcome");
      setIsRouteReady(true);
      return;
    }

    if (path === "/otp") setCurrentPage("otp");
    else if (path === "/profile") setCurrentPage("profile");
    else if (path === "/feed") setCurrentPage("feed");
    else if (path === "/messages") setCurrentPage("messages");
    else if (path === "/groups") setCurrentPage("groups");
    else if (path === "/create-group") setCurrentPage("create-group");
    else if (path === "/feedback") setCurrentPage("feedback");
    else if (path === "/profile-details") setCurrentPage("profile-details");
    else if (path === "/create-post") setCurrentPage("create-post");
    else if (path === "/search") setCurrentPage("search");
    else if (path === "/notifications") setCurrentPage("notifications");
    else if (path.startsWith("/public-profile/")) {
      const emailFromUrl = decodeURIComponent(
        path.split("/public-profile/")[1] || ""
      );
      setSelectedUserEmail(emailFromUrl);
      setCurrentPage("public-profile");
    } else {
      setCurrentPage(savedEmail ? "feed" : "welcome");
    }

    setIsRouteReady(true);
  }, []);

  // ============ FETCH CONVERSATIONS (APP LEVEL) ============
  // ✅ NEW: This fixes the 28s delay by fetching conversations once at App level
  useEffect(() => {
    if (!currentUserEmail) return;

    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch conversations");
          return;
        }

        const data = await response.json();

        // ✅ Map conversations with proper display names (FIX FOR "Conversation" text)
        const mappedConversations = (data.conversations || []).map((chat) => {
          if (chat.is_group) {
            return {
              ...chat,
              id: Number(chat.id),
              displayName: chat.name || "Group Chat",
              otherEmail: null,
              avatarUrl: "",
            };
          }

          const displayName =
            chat.other_full_name ||
            chat.other_username ||
            chat.other_email?.split("@")[0] ||
            "Conversation";

          return {
            ...chat,
            id: Number(chat.id),
            displayName,
            otherEmail: chat.other_email,
            avatarUrl: chat.other_profile_image_url
              ? chat.other_profile_image_url.startsWith("http")
                ? chat.other_profile_image_url
                : `${SERVER_BASE_URL}${chat.other_profile_image_url}`
              : "",
            course: chat.other_course || "",
            year: chat.other_year || "",
          };
        });

        setConversations(mappedConversations);

        // Build unread counts map
        const counts = {};
        mappedConversations.forEach((chat) => {
          counts[Number(chat.id)] = Number(chat.unread_count || 0);
        });
        setUnreadCounts(counts);

        // Build email -> conversationId map
        const nextConversationIdsByEmail = {};
        mappedConversations.forEach((chat) => {
          const conversationId = Number(chat.id);
          socket.emit("join_conversation", conversationId);

          if (!chat.is_group && chat.otherEmail) {
            nextConversationIdsByEmail[chat.otherEmail.toLowerCase()] =
              conversationId;
          }
        });

        setConversationIdsByEmail(nextConversationIdsByEmail);
      } catch (error) {
        console.error("fetchConversations error:", error);
      }
    };

    fetchConversations();
  }, [currentUserEmail]);

  // ============ HISTORY PUSH STATE ============
  useEffect(() => {
    if (!isRouteReady) return;

    const path = pageToPath(currentPage, selectedUserEmail);

    if (window.location.pathname !== path) {
      window.history.pushState(
        {
          page: currentPage,
          selectedUserEmail,
          activeConversationId,
        },
        "",
        path
      );
    }
  }, [isRouteReady, currentPage, selectedUserEmail, activeConversationId]);

  // ============ POP STATE HANDLER ============
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;

      if (state?.page) {
        setCurrentPage(state.page);
        setSelectedUserEmail(state.selectedUserEmail || "");
        setActiveConversationId(state.activeConversationId || null);
        return;
      }

      const path = window.location.pathname;
      const savedEmail = localStorage.getItem("userEmail");

      if (path === "/") setCurrentPage(savedEmail ? "feed" : "welcome");
      else if (path === "/otp") setCurrentPage("otp");
      else if (path === "/profile") setCurrentPage("profile");
      else if (path === "/feed") setCurrentPage("feed");
      else if (path === "/messages") setCurrentPage("messages");
      else if (path === "/groups") setCurrentPage("groups");
      else if (path === "/create-group") setCurrentPage("create-group");
      else if (path === "/feedback") setCurrentPage("feedback");
      else if (path === "/profile-details") setCurrentPage("profile-details");
      else if (path === "/create-post") setCurrentPage("create-post");
      else if (path === "/search") setCurrentPage("search");
      else if (path === "/notifications") setCurrentPage("notifications");
      else if (path.startsWith("/public-profile/")) {
        const emailFromUrl = decodeURIComponent(
          path.split("/public-profile/")[1] || ""
        );
        setSelectedUserEmail(emailFromUrl);
        setCurrentPage("public-profile");
      } else {
        setCurrentPage(savedEmail ? "feed" : "welcome");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ============ SOCKET: RECEIVE MESSAGE ============
  // ✅ UPDATED: Now updates both conversations list AND unread counts
  useEffect(() => {
    if (!currentUserEmail) return;

    const handleReceiveMessage = (message) => {
      const incomingConversationId = Number(message.conversation_id);

      if (message.sender_email?.toLowerCase() === currentUserEmail.toLowerCase())
        return;

      // Move conversation to top
      setConversations((prev) => {
        const target = prev.find(
          (chat) => Number(chat.id) === incomingConversationId
        );

        if (!target) return prev;

        const rest = prev.filter(
          (chat) => Number(chat.id) !== incomingConversationId
        );

        return [target, ...rest];
      });

      // Update unread count
      setUnreadCounts((prev) => ({
        ...prev,
        [incomingConversationId]: (prev[incomingConversationId] || 0) + 1,
      }));
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [currentUserEmail]);

  // ============ FETCH POSTS ============
  useEffect(() => {
    if (!email) return;

    const fetchPosts = async () => {
      try {
        setPostsLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(
          `${API_BASE_URL}/posts?limit=10&offset=0`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          console.error(data.error || "Failed to fetch posts");
          return;
        }

        const mappedPosts = data.posts.map((post) => ({
          id: post.id,
          email: post.email,
          author: post.full_name || post.author_name,
          subtitle: `${post.author_course || ""} • Year ${post.author_year || ""}`,
          avatar: post.profile_image_url
            ? post.profile_image_url.startsWith("http")
              ? post.profile_image_url
              : `${SERVER_BASE_URL}${post.profile_image_url}`
            : "https://picsum.photos/50?default-user",
          image: post.image_url
            ? post.image_url.startsWith("http")
              ? post.image_url
              : `${SERVER_BASE_URL}${post.image_url}`
            : "",
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          caption: post.caption,
          time: "RECENT",
          type: post.post_type,
          isLiked: post.is_liked || false,
        }));

        setPosts(mappedPosts);
      } catch (error) {
        console.error("Fetch posts error:", error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [email]);

  // ============ FETCH USER PROFILE (ENHANCED) ============
useEffect(() => {
  const fetchUserProfile = async () => {
    if (!email) return;
 
    try {
      const token = localStorage.getItem("token");
 
      const response = await fetch(`${API_BASE_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
 
      const data = await response.json();
 
      if (!response.ok) {
        console.error(data.error || "Failed to fetch user profile");
        return;
      }
 
      const user = data.user;
 
      // ✅ STRICT validation - ALL required fields must be filled
      const isProfileComplete =
        user.full_name?.trim() &&                    // Has full name
        user.username?.trim() &&                     // Has username
        user.course?.trim() &&                       // ✅ Has course
        user.year?.trim() &&                         // ✅ Has year
        user.course !== "Year" &&                    // ✅ Not a dummy value
        user.year !== "Year" &&                      // ✅ Not a dummy value
        user.course.toLowerCase() !== "not specified" &&  // ✅ Not default
        user.year.toLowerCase() !== "not specified";      // ✅ Not default
 
      if (!isProfileComplete) {
        console.warn("Incomplete profile detected, redirecting to profile setup");
        console.warn("Missing fields:", {
          fullName: user.full_name,
          username: user.username,
          course: user.course,
          year: user.year,
        });
        navigateTo("profile");
        return;
      }
 
      // ✅ Profile is complete - set data
      setProfileData({
        email: user.email,
        fullName: user.full_name || "",
        username: user.username || "",
        course: user.course || "",
        year: user.year || "",
        branch: user.branch || "",
        bio: user.bio || "",
        interests: user.interests || "",
        skills: user.skills || "",
        city: user.city || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        profileImage: user.profile_image_url
          ? user.profile_image_url.startsWith("http")
            ? user.profile_image_url
            : `${SERVER_BASE_URL}${user.profile_image_url}`
          : "",
      });
    } catch (error) {
      console.error("Fetch user profile error:", error);
    }
  };
 
  fetchUserProfile();
}, [email]);
  
  // ============ LOGOUT ============
  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("token");

    socket.disconnect();

    setEmail("");
    setProfileData(null);
    setActiveConversationId(null);
    setSelectedUserEmail("");
    setPosts([]);
    setSelectedGroup(null);
    setConversations([]); // ✅ NEW: Clear conversations on logout
    setUnreadCounts({}); // ✅ NEW: Clear unread counts on logout
    navigateTo("welcome");
  };

  // ============ PAGE RENDERING ============
  if (currentPage === "otp") {
    return (
      <OtpPage
        email={email}
        onBack={() => navigateTo("welcome")}
        onVerify={(data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userEmail", email.toLowerCase().trim());

          socket.auth = {
            token: localStorage.getItem("token"),
          };
          socket.connect();

          if (data?.needsProfileSetup) {
            navigateTo("profile");
          } else {
            navigateTo("feed");
          }
        }}
      />
    );
  }

  if (currentPage === "profile") {
    return (
      <ProfilePage
        email={email}
        onBack={() => navigateTo("otp")}
        onComplete={(data) => {
          setProfileData({
            ...data,
            email,
          });
          navigateTo("feed");
        }}
      />
    );
  }

  if (currentPage === "feed") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <FeedPage
          profileData={profileData}
          customPosts={posts}
          postsLoading={postsLoading}
          unreadCounts={unreadCounts}
          conversationIdsByEmail={conversationIdsByEmail}
          onCreatePost={() => navigateTo("create-post")}
          onOpenProfile={() => navigateTo("profile-details")}
          onOpenUserProfile={(userEmail) => {
            navigateTo("public-profile", { selectedUserEmail: userEmail });
          }}
          onStartChat={(conversationId) => {
            navigateTo("messages", { activeConversationId: conversationId });
          }}
          isMobile={isMobile}
        />
      </AppLayout>
    );
  }

  if (currentPage === "public-profile") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        hasUnreadMessages={hasUnreadMessages}
        onThemeChange={setTheme}
        onLogout={handleLogout}
      >
        <PublicProfilePage
          currentUserEmail={email}
          viewedUserEmail={selectedUserEmail}
          onBack={() => navigateTo("feed")}
          onStartChat={(conversationId) => {
            navigateTo("messages", { activeConversationId: conversationId });
          }}
        />
      </AppLayout>
    );
  }

  if (currentPage === "groups") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        {selectedGroup ? (
          <GroupChatPage
            group={selectedGroup}
            currentUserEmail={email}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <GroupsPage
            currentUserEmail={email}
            onBack={() => navigateTo("feed")}
            onCreateGroup={() => navigateTo("create-group")}
            onOpenGroup={(group) => setSelectedGroup(group)}
          />
        )}
      </AppLayout>
    );
  }

  if (currentPage === "create-group") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <CreateGroupPage
          currentUserEmail={email}
          onBack={() => navigateTo("groups")}
          onGroupCreated={() => navigateTo("groups")}
        />
      </AppLayout>
    );
  }

  if (currentPage === "messages") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <MessagesPage
          currentUserEmail={email}
          activeConversationId={activeConversationId}
          unreadCounts={unreadCounts}
          setUnreadCounts={setUnreadCounts}
          conversations={conversations} // ✅ NEW: Pass conversations from App
          setConversations={setConversations} // ✅ NEW: Pass setter
          onOpenUserProfile={(userEmail) => {
            navigateTo("public-profile", { selectedUserEmail: userEmail });
          }}
        />
      </AppLayout>
    );
  }

  if (currentPage === "profile-details") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <ProfileDetailsPage
          profileData={profileData}
          email={email}
          onBack={() => navigateTo("feed")}
          onSaveProfile={async (updatedData) => {
            try {
              const token = localStorage.getItem("token");

              const response = await fetch(
                `${API_BASE_URL}/user/save-profile`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    fullName: updatedData.fullName || "",
                    username: updatedData.username || "",
                    course: updatedData.course || "",
                    year: updatedData.year || "",
                    branch: updatedData.branch || "",
                    bio: updatedData.bio || "",
                    interests: updatedData.interests || "",
                    skills: updatedData.skills || "",
                    city: updatedData.city || "",
                    linkedin: updatedData.linkedin || "",
                    github: updatedData.github || "",
                    profileImage: updatedData.profileImage || "",
                  }),
                }
              );
              const data = await response.json();

              if (!response.ok) {
                alert(data.error || "Failed to save profile");
                return;
              }

              setProfileData((prev) => ({
                ...prev,
                ...updatedData,
              }));

              navigateTo("feed");
            } catch (error) {
              console.error("ProfileDetails save frontend error:", error);
              alert("Server error");
            }
          }}
        />
      </AppLayout>
    );
  }

  if (currentPage === "create-post") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <CreatePostPage
          profileData={profileData}
          onBack={() => navigateTo("feed")}
          onSubmitPost={(newPost) => {
            const mappedPost = {
              id: newPost.id,
              email: newPost.email,
              author: newPost.author_name,
              subtitle: `${newPost.author_course || ""} • Year ${
                newPost.author_year || ""
              }`,
              avatar: newPost.profile_image_url
                ? newPost.profile_image_url.startsWith("http")
                  ? newPost.profile_image_url
                  : `${SERVER_BASE_URL}${newPost.profile_image_url}`
                : profileData?.profileImage ||
                  "https://picsum.photos/50?default-user",
              image: newPost.image_url
                ? newPost.image_url.startsWith("http")
                  ? newPost.image_url
                  : `${SERVER_BASE_URL}${newPost.image_url}`
                : "",
              likes: newPost.likes_count || 0,
              comments: newPost.comments_count || 0,
              caption: newPost.caption,
              time: "JUST NOW",
              type: newPost.post_type,
              isLiked: false,
            };

            setPosts((prev) => [mappedPost, ...prev]);
            navigateTo("feed");
          }}
        />
      </AppLayout>
    );
  }

  if (currentPage === "search") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <SearchPage
          currentUserEmail={email}
          onStartChat={(conversationId) => {
            navigateTo("messages", { activeConversationId: conversationId });
          }}
          onOpenUserProfile={(userEmail) => {
            navigateTo("public-profile", { selectedUserEmail: userEmail });
          }}
        />
      </AppLayout>
    );
  }

  if (currentPage === "notifications") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <NotificationsPage currentUserEmail={email} />
      </AppLayout>
    );
  }

  if (currentPage === "feedback") {
    return (
      <AppLayout
        currentPage={currentPage}
        onNavigate={navigateTo}
        theme={theme}
        onThemeChange={setTheme}
        onLogout={handleLogout}
        hasUnreadMessages={hasUnreadMessages}
      >
        <FeedbackPage currentUserEmail={email} />
      </AppLayout>
    );
  }

  return (
    <WelcomePage
      onContinue={(userEmail) => {
        const normalizedEmail = userEmail.toLowerCase();
        setEmail(normalizedEmail);
        localStorage.setItem("userEmail", normalizedEmail);
        navigateTo("otp");
      }}
      onLoginSuccess={(userEmail, data) => {
        const normalizedEmail = userEmail.toLowerCase();

        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", normalizedEmail);

        socket.auth = {
          token: localStorage.getItem("token"),
        };
        socket.connect();

        setEmail(normalizedEmail);

        if (data?.needsProfileSetup) {
          navigateTo("profile");
        } else {
          navigateTo("feed");
        }
      }}
    />
  );
}

export default App;
