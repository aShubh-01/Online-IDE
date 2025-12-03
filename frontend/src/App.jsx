import { useState, useEffect, useRef } from 'react';
import { MantineProvider, Textarea, Button, Group, ActionIcon, Tooltip } from '@mantine/core';
import EditorPane from './components/EditorPane';
import AISidebar from './components/AISidebar';
import CommandPalette from './components/CommandPalette';
import FileTabs from './components/FileTabs';
import NewFileModal from './components/NewFileModal';
import { IconCopy, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { MdAutoAwesome } from "react-icons/md";
import './App.css';

const FILES = [
  { name: 'main.py', language: 'python' },
  // { name: 'main.js', language: 'javascript' },
  // { name: 'main.cpp', language: 'cpp' },
  // { name: 'main.java', language: 'java' }
];

const DEFAULT_CODE = {
  python: 'print("Hello, World!")',
  javascript: 'console.log("Hello, World!")',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, World!"; }',
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('16');
  const [files, setFiles] = useState(FILES.map(f => ({ ...f, code: DEFAULT_CODE[f.language] })));
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [aiTutorResponse, setAiTutorResponse] = useState('');
  const [aiWriteResponse, setAiWriteResponse] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [status, setStatus] = useState('Ready');
  const [chatMessages, setChatMessages] = useState([]);
  const [newFileModalOpen, setNewFileModalOpen] = useState(false);
  const [showInput, setShowInput] = useState(true);

  const [bottomPanelHeight, setBottomPanelHeight] = useState(240);
  const isResizingBottom = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const isResizingSidebar = useRef(false);
  const startX = useRef(0);
  const startSidebarWidth = useRef(0);

  const activeFile = files[activeFileIdx];

  const startSidebarResize = (e) => {
    if (!sidebarOpen) return;
    isResizingSidebar.current = true;
    startX.current = e.clientX;
    startSidebarWidth.current = sidebarWidth;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingBottom.current) {
        const diff = e.clientY - startY.current;
        const newHeight = Math.max(120, startHeight.current - diff);
        setBottomPanelHeight(newHeight);
      }
      if (isResizingSidebar.current) {
        const diff = e.clientX - startX.current;
        const newWidth = Math.min(600, Math.max(240, startSidebarWidth.current - diff)); // FIXED
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingBottom.current = false;
      isResizingSidebar.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [bottomPanelHeight, sidebarWidth]);

  useEffect(() => {
    setFiles(prev =>
      prev.map(f => {
        const saved = localStorage.getItem(`code_${f.name}`);
        return { ...f, code: saved || DEFAULT_CODE[f.language] };
      })
    );
  }, []);

  useEffect(() => {
    files.forEach(f => localStorage.setItem(`code_${f.name}`, f.code));
  }, [files]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleRun = async () => {
    setStatus("Running...");
    setOutput("Running code...");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeFile.language,
          code: activeFile.code,
          input,
        }),
      });
      const result = await res.json();
      setOutput((result.stdout || "") + (result.stderr ? `\n[stderr]\n${result.stderr}` : ""));
      setStatus("Done");
    } catch (e) {
      setOutput("Error: " + e.message);
      setStatus("Error");
    }
  };

  const handleClearOutput = () => setOutput("");

  const handleAskTutor = async () => {
    setAiTutorResponse("Thinking...");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Explain this ${activeFile.language} code briefly.\n${activeFile.code}`,
        }),
      });
      const data = await res.json();
      setAiTutorResponse(data.response);
    } catch (e) {
      setAiTutorResponse("Error: " + e.message);
    }
  };

  const handleAskWrite = async (prompt) => {
    setAiWriteResponse("Thinking...");
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setAiWriteResponse(data.response);
    } catch (e) {
      setAiWriteResponse("Error: " + e.message);
    }
  };

  const handleInsertCode = () => {
    const match = aiWriteResponse.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
    const codeOnly = match ? match[1].trim() : aiWriteResponse.trim();
    setFiles(f => f.map((x, i) => i === activeFileIdx ? { ...x, code: codeOnly } : x));
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output);
    setStatus("Output copied!");
    setTimeout(() => setStatus("Ready"), 1000);
  };

  const toggleSidebar = () => setSidebarOpen(o => !o);

  const handleCreateFile = (name) => {
    let ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    let language = ext === "js" ? "javascript" : ext === "cpp" ? "cpp" : "python";
    let unique = name;
    let n = 1;
    while (files.some(f => f.name === unique)) {
      unique = name.replace(/(\.[^.]+)?$/, `_${n}${ext ? "." + ext : ""}`);
      n++;
    }
    setFiles([...files, { name: unique, language, code: DEFAULT_CODE[language] }]);
    setActiveFileIdx(files.length);
    setNewFileModalOpen(false);
  };

  return (
    <MantineProvider theme={{ colorScheme: theme }} withGlobalStyles withNormalizeCSS>
      <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: theme === "dark" ? "#181A1B" : "#f8f9fa" }}>

        <FileTabs
          files={files}
          activeFileIdx={activeFileIdx}
          onTabClick={i => setActiveFileIdx(i)}
          theme={theme}
          onTabReorder={(from, to) => {
            const arr = [...files];
            const m = arr.splice(from, 1)[0];
            arr.splice(to, 0, m);
            setFiles(arr);
            setActiveFileIdx(to);
          }}
          onRename={(i, name) => setFiles(f => f.map((x, idx) => idx === i ? { ...x, name } : x))}
          onDelete={(i) => {
            if (files.length === 1) return;
            const arr = files.filter((_, idx) => idx !== i);
            setFiles(arr);
            setActiveFileIdx(i === 0 ? 0 : i - 1);
          }}
          onUpload={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const ext = file.name.split(".").pop();
            const lang = ext === "py" ? "python" : ext === "js" ? "javascript" : ext === "cpp" ? "cpp" : "plaintext";
            const r = new FileReader();
            r.onload = ev => {
              setFiles([...files, { name: file.name, language: lang, code: ev.target.result }]);
              setActiveFileIdx(files.length);
            };
            r.readAsText(file);
          }}
          onDownload={(i) => {
            const f = files[i];
            const blob = new Blob([f.code], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = f.name;
            a.click();
            URL.revokeObjectURL(url);
          }}
          onRun={handleRun}
          onAddTab={() => setNewFileModalOpen(true)}
        />

        <NewFileModal opened={newFileModalOpen} onClose={() => setNewFileModalOpen(false)} onCreate={handleCreateFile} />

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ flex: sidebarOpen ? 1 : 1.2, display: "flex", flexDirection: "column", minWidth: 0 }}>

            <div style={{ height: `calc(100% - ${bottomPanelHeight}px)` }}>
              <EditorPane
                language={activeFile.language}
                fontSize={fontSize}
                theme={theme}
                code={activeFile.code}
                onChange={code => setFiles(f => f.map((x, i) => i === activeFileIdx ? { ...x, code } : x))}
              />
            </div>

            <div
              onMouseDown={(e) => {
                isResizingBottom.current = true;
                startY.current = e.clientY;
                startHeight.current = bottomPanelHeight;
              }}
              style={{ height: 6, cursor: "ns-resize", background: theme === "dark" ? "#333" : "#ccc" }}
            />

            <div style={{ height: bottomPanelHeight, display: "flex", borderTop: `1px solid ${theme === "dark" ? "#23272e" : "#ccc"}` }}>

              {showInput && (
                <div style={{ flex: 1, padding: 16 }}>
                  <label style={{ color: theme === "dark" ? "#aaa" : "#222" }}>Input (stdin):</label>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      background: theme === "dark" ? "#23272e" : "#fff",
                      color: theme === "dark" ? "#fff" : "#000",
                      border: "1px solid #555",
                      borderRadius: 6,
                      padding: 10
                    }}
                  />
                </div>
              )}

              <div style={{
                flex: showInput ? 2 : 1,
                padding: 16,
                borderLeft: `1px solid ${theme === "dark" ? "#23272e" : "#ccc"}`,
                background: theme === "dark" ? "#1e1e1e" : "#fff",
                overflowY: "auto",
                position: "relative"
              }}>
                <label style={{ color: theme === "dark" ? "#aaa" : "#222" }}>Output:</label>

                <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 6 }}>
                  <Button compact size="xs" onClick={() => setShowInput(v => !v)}>
                    {showInput ? "Hide Input" : "Show Input"}
                  </Button>

                  <Tooltip label="Copy">
                    <ActionIcon onClick={handleCopyOutput}><IconCopy size={16} /></ActionIcon>
                  </Tooltip>
                </div>

                <pre style={{ whiteSpace: "pre-wrap", marginTop: 30 }}>{output}</pre>
              </div>
            </div>

            <div style={{ height: 28, background: theme === "dark" ? "#23272e" : "#eee", paddingLeft: 16, display: "flex", alignItems: "center", color: "#bbb" }}>
              Status: {status}
            </div>
          </div>

          <ActionIcon
  onClick={toggleSidebar}
  style={{
    position: "fixed",
    top: "80px",
    right: sidebarOpen ? sidebarWidth + 10 : 10,
    zIndex: 9999,
    background: theme === "dark" ? "#23272e" : "#e9ecef",
    border: `1px solid ${theme === "dark" ? "#373a40" : "#dee2e6"}`,
    transition: "right 0.15s ease"
  }}
>
  {sidebarOpen ? <MdAutoAwesome size={18} /> : <MdAutoAwesome size={18} />}
</ActionIcon>


          {/* RIGHT SIDEBAR */}
          <div
            style={{
              width: sidebarOpen ? sidebarWidth : 24,
              minWidth: sidebarOpen ? sidebarWidth : 24,
              background: theme === "dark" ? "#23272e" : "#f8f9fa",
              borderLeft: `1px solid ${theme === "dark" ? "#373a40" : "#ccc"}`,
              position: "relative",
              display: "flex"
            }}
          >

            {sidebarOpen && (
              <div
                onMouseDown={startSidebarResize}
                style={{
                  width: 6,
                  cursor: "ew-resize",
                  background: theme === "dark" ? "#333" : "#ccc"
                }}
              />
            )}

            {sidebarOpen && (
              <div style={{ flex: 1, overflow: "hidden" }}>
                <AISidebar
                  aiTutorResponse={aiTutorResponse}
                  aiWriteResponse={aiWriteResponse}
                  onAskTutor={handleAskTutor}
                  onAskWrite={handleAskWrite}
                  onInsertCode={handleInsertCode}
                  theme={theme}
                  chatMessages={chatMessages}
                  onChat={(msg) => {
                    if (!msg.trim()) return;
                    setChatMessages(arr => [...arr, { role: "user", text: msg }]);
                    fetch(`${import.meta.env.VITE_BACKEND_URL}/tutor`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt: msg }),
                    })
                      .then(res => res.json())
                      .then(data => setChatMessages(arr => [...arr, { role: "ai", text: data.response }]))
                      .catch(e => setChatMessages(arr => [...arr, { role: "ai", text: "Error: " + e.message }]));
                  }}
                />
              </div>
            )}

          </div>
        </div>

        <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} theme={theme} />
      </div>
    </MantineProvider>
  );
}
