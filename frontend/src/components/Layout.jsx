import React, { useState, useEffect, useRef, useCallback } from "react";
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
  LogOut,
} from "lucide-react";
import DeleteConfirmationModal from "./DeletePopUp"; // Import the new modal component

// useLocalStorage hooks
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

// ChatItem component
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

// ExpandedSidebar and CollapsedSidebar
const ExpandedSidebar = ({ onToggle, searchInputRef, onLogout, ...props }) => {
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
      <div className="mt-auto pt-4 border-t border-neutral-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-neutral-300 hover:bg-red-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
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
    <button
      onClick={onSearchClick}
      className="p-3 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg"
      title="Search history"
    >
      <Search className="w-5 h-5" />
    </button>
  </div>
);

// Main Layout
const Layout = ({ children, activeChatId, user, onLogout, refreshTrigger }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage(
    "sidebarOpen",
    true
  );
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [pinnedChatIds, setPinnedChatIds] = useLocalStorage("pinnedChats", []);
  const searchInputRef = useRef(null);

  // --- NEW STATE FOR MODAL ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null); // Will hold { policyId, title }

  const fetchChats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, refreshTrigger, fetchChats]);

  const handleSelectChat = (policyId) => {
    window.location.hash = policyId ? `#${policyId}` : "";
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    onLogout();
  };

  // --- MODIFIED handleChatAction to open the modal ---
  const handleChatAction = async (action, payload) => {
    const { policyId, newTitle } = payload;
    switch (action) {
      case "rename":
        await fetch(`/api/chats/${policyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        await fetchChats();
        break;

      case "delete":
        // Find the chat details and set state to open the modal
        const chat = chats.find((c) => c.policy_id === policyId);
        if (chat) {
          setChatToDelete({ policyId: chat.policy_id, title: chat.title });
          setIsDeleteModalOpen(true);
        }
        break;

      case "pin":
        setPinnedChatIds((prev) =>
          prev.includes(policyId)
            ? prev.filter((id) => id !== policyId)
            : [...prev, policyId]
        );
        break;
      default:
        break;
    }
  };

  // --- deletion on confirmation ---
  const confirmDelete = async () => {
    if (!chatToDelete) return;

    await fetch(`/api/chats/${chatToDelete.policyId}`, { method: "DELETE" });

    // If the active chat is the one being deleted, navigate to the homepage
    if (String(activeChatId) === String(chatToDelete.policyId)) {
      handleSelectChat(null);
    }

    // Close modal and refresh the chat list
    setIsDeleteModalOpen(false);
    setChatToDelete(null);
    await fetchChats();
  };

  const handleSearchClick = () => {
    setIsSidebarOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  return (
    // Use a React Fragment to render the modal alongside the main layout
    <>
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
              onLogout={handleLogout}
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
          {children}
        </main>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        chatTitle={chatToDelete?.title || ""}
      />
    </>
  );
};

export default Layout;
