import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Chatbot from "./components/Chatbot";
import PrivacyAgentHub from "./components/PrivacyAgentHub";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import { Loader } from "lucide-react";

function App() {
  const [activeChat, setActiveChat] = useState(null);
  const [currentView, setCurrentView] = useState("home"); // 'home', 'chat', or 'agents'
  const [isLoading, setIsLoading] = useState(true); // Manages loading state for async operations
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [refreshChats, setRefreshChats] = useState(false); // Triggers chat list refresh

  // Effect for checking user session on initial app load
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/session");
        const data = await response.json();
        if (data.isLoggedIn) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []); // Empty dependency array ensures this runs only once

  // Effect for handling chat history based on the URL hash (#)
  useEffect(() => {
    if (!user) return; // Don't run if the user is not logged in

    const handleHashChange = async () => {
      const hash = window.location.hash.substring(1);

      // Check for special views
      if (hash === "agents") {
        setCurrentView("agents");
        setActiveChat(null);
        setIsLoading(false);
        return;
      }

      if (hash && !isNaN(hash)) {
        setIsLoading(true); // Set loading before fetching
        setActiveChat(null); // Clear previous chat to prevent showing stale data
        setCurrentView("chat");
        try {
          const response = await fetch(`/api/chats/${hash}`);
          if (!response.ok) {
            window.location.hash = ""; // Clear hash if chat is not found
            throw new Error("Chat not found");
          }
          const data = await response.json();
          setActiveChat(data); // Set the new chat data
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
          setActiveChat(null);
          setCurrentView("home");
        } finally {
          setIsLoading(false); // Unset loading after fetch completes
        }
      } else {
        setActiveChat(null); // If no hash, no active chat
        setCurrentView("home");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run on initial load to check for a hash

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [user]); // This effect runs when the user logs in

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveChat(null);
    window.location.hash = "";
  };

  const handleAnalysisComplete = (result) => {
    setRefreshChats((prev) => !prev); // Trigger a refresh of the chat list in the sidebar
    window.location.hash = `#${result.policy_id}`; // Navigate to the new chat
  };

  // Determines what content to show in the main area
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      );
    }
    if (currentView === "agents") {
      return (
        <PrivacyAgentHub
          policyId={activeChat?.policy_id}
          policyText={activeChat?.policy_text}
        />
      );
    }
    if (activeChat && currentView === "chat") {
      return <Chatbot result={activeChat} />;
    }
    return <HomePage onAnalysisComplete={handleAnalysisComplete} />;
  };

  // Shows a loader during the initial session check
  if (isLoading && !user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-50">
        <Loader className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  // Shows the Login/Signup pages if no user is authenticated
  if (!user) {
    if (authMode === "login") {
      return (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      );
    }
    return (
      <SignUpPage
        onSignupSuccess={() => setAuthMode("login")}
        onSwitchToLogin={() => setAuthMode("login")}
      />
    );
  }

  // Renders the main application if the user is logged in
  return (
    <div className="App">
      <Layout
        activeChatId={activeChat ? activeChat.policy_id : null}
        user={user}
        onLogout={handleLogout}
        refreshTrigger={refreshChats}
      >
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;
