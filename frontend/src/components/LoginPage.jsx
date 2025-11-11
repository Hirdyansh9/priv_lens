import React, { useState } from "react";
import { Search, LogIn } from "lucide-react";

const LoginPage = ({ onLogin, onSwitchToSignup }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Unable to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendButtonClasses =
    "bg-[linear-gradient(135deg,#171717_0%,#262626_50%,#171717_100%)] shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all ease-in-out duration-200 hover:not(:disabled):bg-[linear-gradient(135deg,#262626_0%,#404040_50%,#262626_100%)] hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:not(:disabled):-translate-y-px disabled:bg-neutral-300 disabled:shadow-none";

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-neutral-50">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left md:-mt-8">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-800 tracking-tighter">
              Privacy<span className="text-blue-600">Lens</span>
            </h1>
          </div>
          <p className="text-lg text-neutral-600 max-w-md mx-auto md:mx-0">
            Your AI-powered privacy policy analyst. Login or create an account
            to get started.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-neutral-200/50 border">
          <h2 className="text-2xl font-bold text-center text-neutral-800 mb-6">
            Welcome Back!
          </h2>
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-3 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`${sendButtonClasses} w-full flex justify-center items-center gap-2 px-4 py-3 text-white font-semibold rounded-lg disabled:cursor-not-allowed`}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>
          <p className="text-center text-sm text-neutral-600 mt-6">
            Don't have an account?{" "}
            <button
              onClick={onSwitchToSignup}
              className="font-semibold text-blue-600 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
