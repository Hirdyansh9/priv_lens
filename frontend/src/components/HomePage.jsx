import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader, FileText, Link, Type, Search } from "lucide-react";

// Set up the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// A reusable loader icon component for the main button
const LoaderIcon = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const HomePage = ({ onAnalysisComplete, onAnalysisCreated }) => {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setIsLoading(false);
    setError("");
    try {
      if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map((item) => item.str).join(" ");
          }
          setText(fullText);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const fileText = await file.text();
        setText(fileText);
      }
    } catch (err) {
      setError(
        "Failed to read file. Please ensure it is a valid .txt or .pdf file."
      );
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    let sourceType = activeTab;
    let data = "";

    if (activeTab === "text" || activeTab === "file") {
      sourceType = "text";
      data = text;
    } else if (activeTab === "url") {
      sourceType = "url";
      data = url;
    }

    if (!data.trim()) {
      setError("Please provide some content to analyze.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, data: data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An unknown server error occurred.");
      }

      if (onAnalysisCreated) {
        onAnalysisCreated();
      }

      onAnalysisComplete(result);
    } catch (err) {
      setError(err.message);
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const TabButton = ({ tabName, activeTab, setActiveTab, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex justify-center items-center gap-2 p-3 text-sm font-semibold border-b-2 transition-colors ${
        activeTab === tabName
          ? "border-neutral-900 text-neutral-900"
          : "border-transparent text-neutral-500 hover:text-neutral-800"
      }`}
    >
      {children}
    </button>
  );

  const sendButtonClasses =
    "bg-[linear-gradient(135deg,#171717_0%,#262626_50%,#171717_100%)] shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all ease-in-out duration-200 hover:not(:disabled):bg-[linear-gradient(135deg,#262626_0%,#404040_50%,#262626_100%)] hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:not(:disabled):-translate-y-px disabled:bg-neutral-300 disabled:shadow-none";

  return (
    <div className="flex items-center justify-center min-h-full p-4 bg-neutral-50">
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
            Your AI-powered privacy policy analyst. Get instant clarity by
            pasting text, uploading a file, or providing a URL.
          </p>
        </div>

        {/* Right Column: Input Form */}
        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-neutral-200/50 border">
          <div className="flex justify-center border-b border-neutral-200">
            <TabButton
              tabName="text"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <Type className="w-4 h-4" />
              Paste Text
            </TabButton>
            <TabButton
              tabName="file"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <FileText className="w-4 h-4" />
              Upload File
            </TabButton>
            <TabButton
              tabName="url"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            >
              <Link className="w-4 h-4" />
              From URL
            </TabButton>
          </div>
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            {activeTab === "text" && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full text of the privacy policy here..."
                className="w-full h-40 p-3 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            )}
            {activeTab === "file" && (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    TXT or PDF files supported
                  </p>
                  {fileName && (
                    <p className="text-xs font-semibold text-blue-600 mt-2">
                      {fileName}
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf"
                  onChange={handleFileChange}
                />
              </label>
            )}
            {activeTab === "url" && (
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/privacy"
                className="w-full p-3 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            )}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`${sendButtonClasses} w-full flex justify-center items-center gap-2 px-4 py-3 text-white font-semibold rounded-lg disabled:cursor-not-allowed`}
            >
              {isLoading ? <LoaderIcon /> : "Analyze Policy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
