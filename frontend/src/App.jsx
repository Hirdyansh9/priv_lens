import React, { useState, useEffect } from "react";
import Layout from "./components/Layout";
import HomePage from "./components/HomePage";
import Chatbot from "./components/Chatbot";
import { Loader } from "lucide-react";

function App() {
  const [activeChat, setActiveChat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Key to force a refresh of the Layout component's chat list
  const [layoutKey, setLayoutKey] = useState(Date.now());

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.substring(1);
      setIsLoading(true);
      if (hash && !isNaN(hash)) {
        try {
          const response = await fetch(`/api/chats/${hash}`);
          if (!response.ok) throw new Error("Chat not found");
          const data = await response.json();
          setActiveChat(data);
        } catch (error) {
          console.error("Failed to fetch chat history:", error);
          window.location.hash = "";
        }
      } else {
        setActiveChat(null);
      }
      setIsLoading(false);
    };

    window.addEventListener("hashchange", handleHashChange);
    // Initial load
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleAnalysisComplete = (result) => {
    // When a new analysis is done, update the layout key to trigger a refetch of the chat list
    setLayoutKey(Date.now());
    window.location.hash = `#${result.policy_id}`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-50">
          <Loader className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      );
    }
    if (activeChat) {
      return <Chatbot result={activeChat} />;
    }
    return <HomePage onAnalysisComplete={handleAnalysisComplete} />;
  };

  return (
    <div className="App">
      <Layout
        key={layoutKey}
        activeChatId={activeChat ? activeChat.policy_id : null}
      >
        {renderContent()}
      </Layout>
    </div>
  );
}

export default App;
