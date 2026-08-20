import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import "./Chatbot.css";

const STORAGE_KEY = "theburguer_chat_messages";
const SESSION_KEY = "theburguer_chat_session_id";
const INACTIVITY_MINIMIZE_MS = 3 * 60 * 1000; // 3 minutos

const WELCOME_MESSAGE = {
  sender: "bot",
  text: "Olá! 🍔\nSou o assistente da The Burguer.\nComo posso ajudar?"
};

// Gera UUID v4 simples para sessão anônima persistente
function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = "chat_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "chat_" + Date.now();
  }
}

export default function Chatbot() {
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
      // localStorage indisponível
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

    try {
      // Recupera ID do usuário logado se houver
      let userId = null;
      try {
        const storedUser = sessionStorage.getItem("@TheBurguer:user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          userId = parsed?.id || null;
        }
      } catch {
        userId = null;
      }

      const sessionId = getOrCreateSessionId();

      const response = await api.post("/chatbot", {
        message: text,
        sessionId,
        userId: userId || undefined,
      });

      const data = response.data;
      const botReply = data?.reply || "Olá! Como posso ajudar?";

      setMessages(prev => [...prev, { sender: "bot", text: botReply }]);

      if (!open) {
        setUnreadCount(prev => prev + 1);
      }

    } catch (err) {
      console.error("Chatbot -> falha ao buscar resposta:", err?.response?.data || err?.message || err);

      setLastFailedMessage(text);

      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Ops! Não consegui responder agora. Verifique sua conexão ou tente novamente.",
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
      <button className="chatbot-fab" onClick={() => setOpen(true)} aria-label="Abrir assistente virtual">
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

            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Fechar assistente">
              ×
            </button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
                {msg.isError && lastFailedMessage && index === messages.length - 1 && (
                  <button className="retry-button" onClick={retryLastMessage} style={{ marginTop: "0.5rem" }}>
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

            <button onClick={() => sendMessage()} aria-label="Enviar mensagem">➤</button>
          </div>

        </div>
      )}
    </>
  );
}