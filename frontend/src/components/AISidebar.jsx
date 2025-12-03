import { useState, useRef, useEffect } from "react";
import "./AISidebar.css";
import ReactMarkdown from "react-markdown";

export default function AISidebar({
  aiTutorResponse,
  aiWriteResponse,
  onAskTutor,
  onAskWrite,
  theme,
  onInsertCode,
  onChat,
  chatMessages,
}) {
  const [activeTab, setActiveTab] = useState("tutor");
  const [aiWritePrompt, setAiWritePrompt] = useState("");
  const [chatInput, setChatInput] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div
      className={`ai-sidebar ${theme}`}
      style={{ width: "100%", height: "100%", flex: 1 }}
    >

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "tutor" ? "active" : ""}`}
          onClick={() => setActiveTab("tutor")}
        >
          AI Tutor
        </button>

        <button
          className={`tab ${activeTab === "write" ? "active" : ""}`}
          onClick={() => setActiveTab("write")}
        >
          AI Write
        </button>

        <button
          className={`tab ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          AI Chat
        </button>
      </div>

      {/* =====================
           TUTOR PANEL
      ====================== */}
      {activeTab === "tutor" && (
        <div className="panel">
          <button className="btn primary" onClick={onAskTutor}>
            Ask AI Tutor
          </button>

          <div className="response-box markdown-output">
            <ReactMarkdown
              components={{
                code: ({ node, inline, className, children, ...props }) =>
                  inline ? (
                    <code className="inline-code">{children}</code>
                  ) : (
                    <pre className="code-block"><code>{children}</code></pre>
                  ),
                strong: ({ children }) => <strong className="strong">{children}</strong>,
                li: ({ children }) => <li className="list-item">{children}</li>,
                h2: ({ children }) => <h2 className="heading">{children}</h2>,
                h3: ({ children }) => <h3 className="heading">{children}</h3>,
              }}
            >
              {aiTutorResponse}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* =====================
           WRITE PANEL
      ====================== */}
      {activeTab === "write" && (
        <div className="panel">
          <label className="label">Describe what you want to code</label>

          <textarea
            className="input"
            rows={3}
            value={aiWritePrompt}
            onChange={(e) => setAiWritePrompt(e.target.value)}
            placeholder="e.g. A Python function to reverse a string"
          />

          <button
            className="btn primary"
            onClick={() => onAskWrite(aiWritePrompt)}
          >
            Write with AI
          </button>

          <button className="btn primary" onClick={onInsertCode}>
            Insert to Editor
          </button>

          <div className="response-box markdown-output">
  <ReactMarkdown
    components={{
      code: ({ inline, children }) =>
        inline ? (
          <code className="inline-code">{children}</code>
        ) : (
          <pre className="code-block">
            <code>{children}</code>
          </pre>
        ),
      strong: ({ children }) => <strong className="strong">{children}</strong>,
      li: ({ children }) => <li className="list-item">{children}</li>,
      h2: ({ children }) => <h2 className="heading">{children}</h2>,
      h3: ({ children }) => <h3 className="heading">{children}</h3>,
    }}
  >
    {aiWriteResponse}
  </ReactMarkdown>
</div>

        </div>
      )}

      {/* =====================
           CHAT PANEL
      ====================== */}
      {activeTab === "chat" && (
        <div className="panel chat-panel">
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${msg.role === "user" ? "user" : "ai"
                  }`}
              >
                {msg.role === "user" ? (
                  msg.text
                ) : (
                  <div className="response-box markdown-output">
                    <ReactMarkdown
                      components={{
                        code: ({ node, inline, className, children, ...props }) =>
                          inline ? (
                            <code className="inline-code">{children}</code>
                          ) : (
                            <pre className="code-block"><code>{children}</code></pre>
                          ),
                        strong: ({ children }) => <strong className="strong">{children}</strong>,
                        li: ({ children }) => <li className="list-item">{children}</li>,
                        h2: ({ children }) => <h2 className="heading">{children}</h2>,
                        h3: ({ children }) => <h3 className="heading">{children}</h3>,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}

            <div ref={chatEndRef} />
          </div>

          <form
            className="chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatInput.trim()) return;
              onChat(chatInput);
              setChatInput("");
            }}
          >
            <input
              className="chat-input"
              placeholder="Ask the AI anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />

            <button type="submit" className="btn primary">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
