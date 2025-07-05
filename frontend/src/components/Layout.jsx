import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Plus,
  MessageSquare,
  Loader,
  Search,
  Pin,
  Trash2,
  Edit,
  Check,
} from "lucide-react";

// This custom hook for using localStorage is unchanged
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  const setValue = (value) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    window.localStorage.setItem(key, JSON.stringify(valueToStore));
  };
  return [storedValue, setValue];
};

const ChatItem = ({ chat, isActive, onSelect, onAction, isPinned }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleRename = (e) => {
    e.stopPropagation();
    if (title.trim() && title !== chat.title) {
      onAction("rename", { policyId: chat.policy_id, newTitle: title });
    }
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(chat.policy_id)}
      className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm truncate transition-colors cursor-pointer ${
        isActive
          ? "bg-neutral-700 font-semibold"
          : "text-neutral-300 hover:bg-neutral-800"
      }`}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 truncate">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent outline-none ring-1 ring-blue-500 rounded px-1"
          />
        ) : (
          <span className="truncate">{chat.title}</span>
        )}
      </div>
      <div
        className={`flex items-center gap-1 transition-opacity ${
          isActive && !isEditing
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction("pin", { policyId: chat.policy_id });
          }}
          className="p-1 hover:text-white"
        >
          <Pin className={`w-3 h-3 ${isPinned ? "fill-current" : ""}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 hover:text-white"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction("delete", { policyId: chat.policy_id });
          }}
          className="p-1 hover:text-red-500"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {isEditing && (
        <button onClick={handleRename} className="p-1 hover:text-green-500">
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const ExpandedSidebar = ({ onToggle, searchInputRef, ...props }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { chats, activeChatId, pinnedChatIds, isLoading, onSelect, onAction } =
    props;

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pinnedChats = filteredChats.filter((c) =>
    pinnedChatIds.includes(c.policy_id)
  );
  const unpinnedChats = filteredChats.filter(
    (c) => !pinnedChatIds.includes(c.policy_id)
  );

  return (
    <div className="h-full w-72 bg-neutral-900 text-white flex flex-col p-3">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onSelect(null)}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-neutral-800 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Analysis
        </button>
        <button
          onClick={onToggle}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        {/* --- FIX: The search input now uses the ref --- */}
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search history..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <nav className="flex-grow overflow-y-auto -mr-2 pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {pinnedChats.length > 0 && (
              <div className="px-3 pb-2 text-xs font-semibold text-neutral-400">
                Pinned
              </div>
            )}
            <div className="space-y-1">
              {pinnedChats.map((chat) => (
                <ChatItem
                  key={chat.policy_id}
                  chat={chat}
                  isActive={activeChatId === chat.policy_id}
                  onSelect={onSelect}
                  onAction={onAction}
                  isPinned={true}
                />
              ))}
            </div>
            {unpinnedChats.length > 0 && (
              <div className="px-3 pt-4 pb-2 text-xs font-semibold text-neutral-400">
                Recent
              </div>
            )}
            <div className="space-y-1">
              {unpinnedChats.map((chat) => (
                <ChatItem
                  key={chat.policy_id}
                  chat={chat}
                  isActive={activeChatId === chat.policy_id}
                  onSelect={onSelect}
                  onAction={onAction}
                  isPinned={false}
                />
              ))}
            </div>
          </>
        )}
      </nav>
    </div>
  );
};

const CollapsedSidebar = ({ onToggle, onNewAnalysis, onSearchClick }) => (
  <div className="h-full w-20 bg-neutral-900 text-white flex flex-col items-center p-3 gap-4">
    <button
      onClick={onToggle}
      className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg"
      title="Expand sidebar"
    >
      <Menu className="w-5 h-5" />
    </button>
    <button
      onClick={onNewAnalysis}
      className="p-3 bg-neutral-800 text-white hover:bg-neutral-700 rounded-lg"
      title="New Analysis"
    >
      <Plus className="w-5 h-5" />
    </button>
    {/* --- FIX: The search button now calls onSearchClick --- */}
    <button
      onClick={onSearchClick}
      className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg"
      title="Search history"
    >
      <Search className="w-5 h-5" />
    </button>
  </div>
);

const Layout = ({ children, activeChatId, onAnalysisCreated }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage(
    "sidebarOpen",
    true
  );
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [pinnedChatIds, setPinnedChatIds] = useLocalStorage("pinnedChats", []);
  const searchInputRef = useRef(null); // --- FIX: Create a ref for the search input ---

  const fetchChats = async () => {
    setIsLoadingChats(true);
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();
      setChats(data || []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [onAnalysisCreated]);

  const handleSelectChat = (policyId) => {
    window.location.hash = policyId ? `#${policyId}` : "";
  };

  const handleSearchClick = () => {
    setIsSidebarOpen(true);
    // Use a short timeout to ensure the input is visible before focusing
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleChatAction = async (action, payload) => {
    const { policyId, newTitle } = payload;
    switch (action) {
      case "rename":
        await fetch(`/api/chats/${policyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        break;
      case "delete":
        if (window.confirm("Are you sure you want to delete this chat?")) {
          await fetch(`/api/chats/${policyId}`, { method: "DELETE" });
          if (activeChatId === policyId) handleSelectChat(null);
        }
        break;
      case "pin":
        setPinnedChatIds((prev) =>
          prev.includes(policyId)
            ? prev.filter((id) => id !== policyId)
            : [...prev, policyId]
        );
        return;
      default:
        break;
    }
    await fetchChats();
  };

  return (
    <div className="h-screen w-screen flex bg-neutral-100 overflow-hidden">
      <div
        className={`flex-shrink-0 bg-neutral-900 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-72" : "w-20"
        }`}
      >
        {isSidebarOpen ? (
          <ExpandedSidebar
            onToggle={() => setIsSidebarOpen(false)}
            searchInputRef={searchInputRef}
            {...{
              chats,
              activeChatId,
              pinnedChatIds,
              isLoading: isLoadingChats,
            }}
            onSelect={handleSelectChat}
            onAction={handleChatAction}
          />
        ) : (
          <CollapsedSidebar
            onToggle={() => setIsSidebarOpen(true)}
            onNewAnalysis={() => handleSelectChat(null)}
            onSearchClick={handleSearchClick}
          />
        )}
      </div>

      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        {React.cloneElement(children, { onAnalysisCreated: fetchChats })}
      </main>
    </div>
  );
};

export default Layout;
