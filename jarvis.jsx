import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are JARVIS — a witty, brilliant, deeply personal AI assistant. You are the user's second brain: you remember context within this conversation, help them think through problems, brainstorm ideas, draft content, organize thoughts, answer any question, and proactively offer insights. You are warm but direct, occasionally dry-humored, never sycophantic. You call the user "Boss" occasionally (but not every message). You give crisp, useful answers — no fluff, no unnecessary padding. When asked to remember something, acknowledge it and incorporate it going forward in the conversation.`;

const BOOT_LINES = [
  "INITIALIZING NEURAL CORE...",
  "LOADING KNOWLEDGE BASE...",
  "CALIBRATING RESPONSE ENGINE...",
  "SECOND BRAIN ONLINE.",
];

export default function Jarvis() {
  const [booted, setBooted] = useState(false);
  const [bootStep, setBootStep] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Boot sequence
  useEffect(() => {
    if (bootStep < BOOT_LINES.length) {
      const t = setTimeout(() => setBootStep((s) => s + 1), 600);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setBooted(true);
        setMessages([
          {
            role: "assistant",
            content:
              "JARVIS online. All systems nominal. What's on your mind, Boss?",
          },
        ]);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [bootStep]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (booted) inputRef.current?.focus();
  }, [booted]);

  const sendMessage = async (text) => {
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const reply =
        data.content?.map((b) => b.text || "").join("") ||
        "I encountered an issue. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Memory cleared. Fresh slate. What are we working on?",
      },
    ]);
  };

  // Suggestions
  const SUGGESTIONS = [
    "Help me brainstorm ideas for my project",
    "What should I focus on today?",
    "Explain quantum computing simply",
    "Draft a professional email for me",
  ];

  return (
    <div style={styles.root}>
      {/* Animated grid background */}
      <div style={styles.gridBg} />
      <div style={styles.scanline} />

      {!booted ? (
        <div style={styles.bootScreen}>
          <div style={styles.bootLogo}>J.A.R.V.I.S</div>
          <div style={styles.bootSub}>Just A Rather Very Intelligent System</div>
          <div style={styles.bootLines}>
            {BOOT_LINES.slice(0, bootStep).map((line, i) => (
              <div key={i} style={styles.bootLine}>
                <span style={styles.bootPrompt}>&gt;</span> {line}
              </div>
            ))}
            {bootStep < BOOT_LINES.length && (
              <span style={styles.cursor}>█</span>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.app}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.statusDot} />
              <span style={styles.headerTitle}>J.A.R.V.I.S</span>
              <span style={styles.headerSub}>SECOND BRAIN ACTIVE</span>
            </div>
            <button onClick={clearChat} style={styles.clearBtn} title="Clear memory">
              ⟳ NEW SESSION
            </button>
          </div>

          {/* Messages */}
          <div style={styles.messages}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgRow,
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {m.role === "assistant" && (
                  <div style={styles.avatar}>J</div>
                )}
                <div
                  style={
                    m.role === "user" ? styles.userBubble : styles.aiBubble
                  }
                >
                  {m.role === "assistant" && (
                    <div style={styles.senderLabel}>JARVIS</div>
                  )}
                  <div style={styles.msgText}>{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
                <div style={styles.avatar}>J</div>
                <div style={styles.aiBubble}>
                  <div style={styles.senderLabel}>JARVIS</div>
                  <div style={styles.typingDots}>
                    <span style={{ ...styles.dot, animationDelay: "0s" }} />
                    <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                    <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions when only 1 message */}
            {messages.length === 1 && !loading && (
              <div style={styles.suggestions}>
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    style={styles.suggBtn}
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <div style={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                style={styles.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask JARVIS anything..."
                rows={1}
                disabled={loading}
              />
              <button
                onClick={toggleVoice}
                style={{
                  ...styles.iconBtn,
                  color: listening ? "#00e5ff" : "#4a6080",
                }}
                title="Voice input"
              >
                {listening ? "🔴" : "🎙"}
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  ...styles.sendBtn,
                  opacity: !input.trim() || loading ? 0.4 : 1,
                }}
                disabled={!input.trim() || loading}
              >
                ▶
              </button>
            </div>
            <div style={styles.hint}>Enter to send · Shift+Enter for new line</div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050d1a; }
        ::-webkit-scrollbar-thumb { background: #00e5ff33; border-radius: 2px; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes scanMove { 0%{top:-100%} 100%{top:100%} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 6px #00e5ff} 50%{box-shadow:0 0 16px #00e5ff, 0 0 30px #00e5ff55} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#020912",
    fontFamily: "'Share Tech Mono', monospace",
    color: "#c8dff0",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "stretch",
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  scanline: {
    position: "absolute",
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(transparent, rgba(0,229,255,0.08), transparent)",
    animation: "scanMove 6s linear infinite",
    pointerEvents: "none",
    zIndex: 1,
  },
  // Boot screen
  bootScreen: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "24px",
    zIndex: 2,
    padding: "40px",
  },
  bootLogo: {
    fontSize: "clamp(36px, 8vw, 72px)",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    letterSpacing: "0.3em",
    color: "#00e5ff",
    textShadow: "0 0 20px #00e5ff, 0 0 60px #00e5ff44",
  },
  bootSub: {
    fontSize: "12px",
    letterSpacing: "0.25em",
    color: "#4a7a9b",
  },
  bootLines: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    maxWidth: "400px",
  },
  bootLine: {
    fontSize: "13px",
    color: "#00e5ff99",
    animation: "fadeIn 0.3s ease",
  },
  bootPrompt: {
    color: "#00e5ff",
  },
  cursor: {
    color: "#00e5ff",
    animation: "blink 1s infinite",
    fontSize: "14px",
  },
  // App
  app: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxWidth: "860px",
    width: "100%",
    margin: "0 auto",
    zIndex: 2,
    position: "relative",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    borderBottom: "1px solid rgba(0,229,255,0.1)",
    background: "rgba(2,9,18,0.8)",
    backdropFilter: "blur(10px)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00e5ff",
    animation: "pulse 2s infinite",
  },
  headerTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: "20px",
    color: "#00e5ff",
    letterSpacing: "0.2em",
  },
  headerSub: {
    fontSize: "10px",
    color: "#4a7a9b",
    letterSpacing: "0.15em",
    marginLeft: "4px",
  },
  clearBtn: {
    background: "transparent",
    border: "1px solid rgba(0,229,255,0.2)",
    color: "#4a7a9b",
    fontSize: "10px",
    letterSpacing: "0.1em",
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: "2px",
    fontFamily: "'Share Tech Mono', monospace",
    transition: "all 0.2s",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 24px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    animation: "fadeIn 0.3s ease",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "2px",
    background: "rgba(0,229,255,0.1)",
    border: "1px solid rgba(0,229,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#00e5ff",
    fontSize: "14px",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    flexShrink: 0,
    marginTop: "2px",
  },
  aiBubble: {
    background: "rgba(0,229,255,0.04)",
    border: "1px solid rgba(0,229,255,0.12)",
    borderRadius: "2px 8px 8px 8px",
    padding: "12px 16px",
    maxWidth: "80%",
  },
  userBubble: {
    background: "rgba(0,120,180,0.12)",
    border: "1px solid rgba(0,180,255,0.2)",
    borderRadius: "8px 2px 8px 8px",
    padding: "12px 16px",
    maxWidth: "80%",
  },
  senderLabel: {
    fontSize: "9px",
    color: "#00e5ff77",
    letterSpacing: "0.2em",
    marginBottom: "6px",
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
  },
  msgText: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#c8dff0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  typingDots: {
    display: "flex",
    gap: "5px",
    alignItems: "center",
    height: "20px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00e5ff",
    display: "inline-block",
    animation: "bounce 0.8s infinite",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
    animation: "fadeIn 0.5s ease",
  },
  suggBtn: {
    background: "rgba(0,229,255,0.05)",
    border: "1px solid rgba(0,229,255,0.15)",
    color: "#7ab8cc",
    fontSize: "12px",
    padding: "8px 14px",
    cursor: "pointer",
    borderRadius: "2px",
    fontFamily: "'Share Tech Mono', monospace",
    transition: "all 0.2s",
    textAlign: "left",
    letterSpacing: "0.02em",
  },
  inputArea: {
    padding: "16px 24px 20px",
    borderTop: "1px solid rgba(0,229,255,0.08)",
    background: "rgba(2,9,18,0.9)",
    backdropFilter: "blur(10px)",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(0,229,255,0.04)",
    border: "1px solid rgba(0,229,255,0.15)",
    borderRadius: "4px",
    padding: "4px 8px",
  },
  textarea: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#c8dff0",
    fontSize: "14px",
    fontFamily: "'Share Tech Mono', monospace",
    resize: "none",
    padding: "10px 4px",
    lineHeight: "1.5",
    minHeight: "44px",
    maxHeight: "120px",
    overflowY: "auto",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "2px",
    flexShrink: 0,
    lineHeight: 1,
  },
  sendBtn: {
    background: "rgba(0,229,255,0.12)",
    border: "1px solid rgba(0,229,255,0.3)",
    color: "#00e5ff",
    fontSize: "16px",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    borderRadius: "2px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  hint: {
    fontSize: "10px",
    color: "#2a4a60",
    textAlign: "center",
    marginTop: "8px",
    letterSpacing: "0.08em",
  },
};
