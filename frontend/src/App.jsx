import { useState, useEffect, useRef } from "react";
import {
  MantineProvider,
  Button,
  Group,
  ActionIcon,
  Tooltip,
} from "@mantine/core";

import EditorPane from "./components/EditorPane";
import AISidebar from "./components/AISidebar";
import CommandPalette from "./components/CommandPalette";
import FileTabs from "./components/FileTabs";
import NewFileModal from "./components/NewFileModal";

import {
  IconCopy,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

import "./App.css";

const FILES = [
  { name: "main.py", language: "python" },
  { name: "main.js", language: "javascript" },
  { name: "main.cpp", language: "cpp" },
];

const DEFAULT_CODE = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!")',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, World!"; }',
};

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [fontSize, setFontSize] = useState("16");

  const [files, setFiles] = useState(
    FILES.map((f) => ({ ...f, code: DEFAULT_CODE[f.language] }))
  );

  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Ready");

  const [aiTutorResponse, setAiTutorResponse] = useState("");
  const [aiWriteResponse, setAiWriteResponse] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const [newFileModalOpen, setNewFileModalOpen] = useState(false);

  // ⭐ Input Hide/Show
  const [showInput, setShowInput] = useState(true);

  // ⭐ Bottom panel resize
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);
  const isResizingBottom = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const activeFile = files[activeFileIdx];

  // Load code from localStorage
  useEffect(() => {
    setFiles((prev) =>
      prev.map((f) => {
        const saved = localStorage.getItem(`code_${f.name}`);
        return { ...f, code: saved || DEFAULT_CODE[f.language] };
      })
    );
  }, []);

  // Save code to localStorage
  useEffect(() => {
    files.forEach((f) => localStorage.setItem(`code_${f.name}`, f.code));
  }, [files]);

  // Ctrl+P – Command Palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Bottom panel resizing
  useEffect(() => {
    const move = (e) => {
      if (!isResizingBottom.current) return;
      const dy = e.clientY - startY.current;
      const newHeight = Math.max(120, startHeight.current - dy);
      setBottomPanelHeight(newHeight);
    };

    const stop = () => {
      isResizingBottom.current = false;
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  // Run Code
  const handleRun = async () => {
    setStatus("Running...");
    setOutput("Running code...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: activeFile.language,
            code: activeFile.code,
            input,
          }),
        }
      );

      const result = await response.json();
      let out = "";
      if (result.stdout) out += result.stdout;
      if (result.stderr) out += `\n[stderr]\n${result.stderr}`;
      setOutput(out);
      setStatus("Done");
    } catch (err) {
      setOutput("Error: " + err.message);
      setStatus("Error");
    }
  };

  const handleClearOutput = () => setOutput("");

  const handleCommand = (cmd) => {
    if (cmd === "run") handleRun();
    if (cmd === "clear") handleClearOutput();
    if (cmd === "theme") setTheme(theme === "dark" ? "light" : "dark");
    setCommandPaletteOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <MantineProvider
      theme={{ colorScheme: theme }}
      withGlobalStyles
      withNormalizeCSS
    >
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: theme === "dark" ? "#181A1B" : "#f8f9fa",
          overflow: "hidden",
        }}
      >
        {/* ⭐ File Tabs */}
        <FileTabs
          files={files}
          activeFileIdx={activeFileIdx}
          onTabClick={setActiveFileIdx}
          theme={theme}
          onAddTab={() => setNewFileModalOpen(true)}
        />

        <NewFileModal
          opened={newFileModalOpen}
          onClose={() => setNewFileModalOpen(false)}
          onCreate={(name) => {
            const ext = name.split(".").pop();
            const lang =
              ext === "js" ? "javascript" : ext === "cpp" ? "cpp" : "python";
            setFiles([
              ...files,
              { name, language: lang, code: DEFAULT_CODE[lang] },
            ]);
            setActiveFileIdx(files.length);
            setNewFileModalOpen(false);
          }}
        />

        {/* ⭐ MAIN LAYOUT */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* LEFT SIDE */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Editor */}
            <div
              style={{
                flex: 1,
                height: `calc(100% - ${bottomPanelHeight}px)`,
                minHeight: 0,
              }}
            >
              <EditorPane
                language={activeFile.language}
                theme={theme}
                fontSize={fontSize}
                code={activeFile.code}
                onChange={(c) => {
                  setFiles((all) =>
                    all.map((f, i) =>
                      i === activeFileIdx ? { ...f, code: c } : f
                    )
                  );
                }}
              />
            </div>

            {/* Drag Bar */}
            <div
              onMouseDown={(e) => {
                isResizingBottom.current = true;
                startY.current = e.clientY;
                startHeight.current = bottomPanelHeight;
              }}
              style={{
                height: 6,
                cursor: "ns-resize",
                background: theme === "dark" ? "#333" : "#ccc",
              }}
            />

            {/* ⭐ Bottom Panel */}
            <div
              style={{
                height: bottomPanelHeight,
                minHeight: 120,
                display: "flex",
                borderTop: `1px solid ${theme === "dark" ? "#23272e" : "#dee2e6"
                  }`,
                background: theme === "dark" ? "#181A1B" : "#fafafa",
                overflow: "hidden",
              }}
            >
              {/* ⭐ INPUT SECTION */}
              {showInput && (
                <div
                  style={{
                    flex: 1,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <label
                    style={{
                      color: theme === "dark" ? "#aaa" : "#333",
                      marginBottom: 4,
                    }}
                  >
                    Input (stdin):
                  </label>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    placeholder="Enter input..."
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 6,
                      background: theme === "dark" ? "#23272e" : "#fff",
                      border: `1px solid ${theme === "dark" ? "#373a40" : "#ccc"
                        }`,
                      color: theme === "dark" ? "#fff" : "#111",
                      resize: "vertical",
                      marginBottom: 10,
                    }}
                  />

                  <Group>
                    <Button onClick={handleRun} color="blue">
                      Run
                    </Button>
                    <Button onClick={handleClearOutput} color="gray">
                      Clear
                    </Button>
                  </Group>
                </div>
              )}

              {/* ⭐ OUTPUT SECTION */}
              <div
                style={{
                  flex: showInput ? 2 : 1,
                  padding: 16,
                  borderLeft: `1px solid ${theme === "dark" ? "#23272e" : "#dee2e6"
                    }`,
                  background: theme === "dark" ? "#1e1e1e" : "#fff",
                  overflowY: "auto",
                  position: "relative",
                }}
              >
                <label
                  style={{
                    color: theme === "dark" ? "#aaa" : "#333",
                    marginBottom: 4,
                    display: "block",
                  }}
                >
                  Output:
                </label>

                {/* ⭐ OUTPUT TOOLBAR (Hide Input + Copy Output) */}
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <Button
                    compact
                    variant="light"
                    size="xs"
                    color="gray"
                    onClick={() => setShowInput((v) => !v)}
                  >
                    {showInput ? "Hide Input" : "Show Input"}
                  </Button>

                  <Tooltip label="Copy Output">
                    <ActionIcon
                      color="gray"
                      variant="light"
                      onClick={() => navigator.clipboard.writeText(output)}
                    >
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>

                <pre
                  style={{
                    marginTop: 32,
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                    fontSize: Number(fontSize),
                  }}
                >
                  {output}
                </pre>
              </div>
            </div>

            {/* Status Bar */}
            <div
              style={{
                height: 28,
                paddingLeft: 16,
                display: "flex",
                alignItems: "center",
                fontSize: 13,
                borderTop: `1px solid ${theme === "dark" ? "#333" : "#ddd"
                  }`,
                background: theme === "dark" ? "#222" : "#eee",
              }}
            >
              Status: {status}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div
            style={{
              width: sidebarOpen ? 360 : 24,
              flexShrink: 0,            // ⭐ FIX: Prevent sidebar from shrinking
              transition: "0.2s",
              borderLeft: `1px solid ${theme === "dark" ? "#333" : "#ccc"
                }`,
              background: theme === "dark" ? "#23272e" : "#f8f9fa",
              position: "relative",
            }}
          >
            {sidebarOpen && (
              <AISidebar
                theme={theme}
                aiTutorResponse={aiTutorResponse}
                aiWriteResponse={aiWriteResponse}
                chatMessages={chatMessages}
              />
            )}

            <ActionIcon
              onClick={toggleSidebar}
              style={{
                position: "absolute",
                top: 8,
                left: sidebarOpen ? -20 : 2,
                background: theme === "dark" ? "#333" : "#ddd",
              }}
            >
              {sidebarOpen ? (
                <IconChevronRight size={16} />
              ) : (
                <IconChevronLeft size={16} />
              )}
            </ActionIcon>
          </div>
        </div>

        {/* ⭐ COMMAND PALETTE */}
        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onCommand={handleCommand}
          theme={theme}
        />
      </div>
    </MantineProvider>
  );
}
