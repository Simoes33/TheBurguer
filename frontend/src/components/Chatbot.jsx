import { useState, useEffect, useRef } from "react";
import API_URL from "../services/api";
import "./Chatbot.css";

const STORAGE_KEY = "theburguer_chat_messages";
const INACTIVITY_MINIMIZE_MS = 3 * 60 * 1000; // 3 minutos

const WELCOME_MESSAGE = {
  sender: "bot",
  text: "Olá! 🍔\nSou o assistente da The Burguer.\nComo posso ajudar?"
};

export default function Chatbot() {
  const userId = localStorage.getItem("userId");

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  });

  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const inactivityTimerRef = useRef(null);

  // ─── Persiste mensagens no localStorage ───────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage indisponível — sem problema, só perde persistência
    }
  }, [messages]);

  // ─── Scroll automático para a última mensagem ─────────────────
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ─── Foco automático no input ao abrir ────────────────────────
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setUnreadCount(0);
    }
  }, [open]);

  // ─── Auto-minimizar após inatividade ───────────────────────────
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, INACTIVITY_MINIMIZE_MS);
  };

  useEffect(() => {
    if (open) {
      resetInactivityTimer();
    } else if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [open, messages]);

  async function sendMessage(customMessage = null) {
    const text = customMessage || message;
    if (!text.trim()) return;

    resetInactivityTimer();
    setLastFailedMessage(null);

    setMessages(prev => [...prev, { sender: "user", text }]);

    if (!customMessage) {
      setMessage("");
    }

    setIsTyping(true);

    // DEBUG TEMPORÁRIO: confirma exatamente qual URL está sendo chamada.
    // Se aparecer "[object Object]/chatbot" ou "undefined/chatbot" no console,
    // o problema é o valor exportado por services/api.js.
    const targetUrl = `${API_URL}/chatbot`;
    console.log("Chatbot -> chamando:", targetUrl);

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId })
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} - ${errorBody}`);
      }

      const data = await response.json();

      setMessages(prev => [...prev, { sender: "bot", text: data.reply }]);

      if (!open) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (err) {
      // Log real do erro, em vez de simplesmente engolir a falha.
      console.error("Chatbot -> falha ao buscar resposta:", err.message || err);

      setLastFailedMessage(text);

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Ops! Não consegui responder agora.",
          isError: true
        }
      ]);

    } finally {
      setIsTyping(false);
    }
  }

  function retryLastMessage() {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  }

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen(true)}>
        🍔
        {unreadCount > 0 && (
          <span className="chatbot-badge">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="chatbot-card">

          <div className="chatbot-header">
            <div className="bot-avatar">🍔</div>

            <div className="bot-info">
              <h3>The Burguer</h3>
              <span>Online agora</span>
            </div>

            <button className="chatbot-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
                {msg.isError && lastFailedMessage && index === messages.length - 1 && (
                  <button className="retry-button" onClick={retryLastMessage}>
                    ↻ Tentar novamente
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="message bot typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}
          </div>

          <div className="quick-actions">
            <button onClick={() => sendMessage("cardápio")}>🍔 Cardápio</button>
            <button onClick={() => sendMessage("pedido")}>📦 Pedido</button>
            <button onClick={() => sendMessage("horário")}>🕒 Horário</button>
          </div>

          <div className="chatbot-footer">
            <input
              ref={inputRef}
              value={message}
              placeholder="Digite sua mensagem..."
              onChange={(e) => {
                setMessage(e.target.value);
                resetInactivityTimer();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button onClick={() => sendMessage()}>➤</button>
          </div>

        </div>
      )}
    </>
  );
}