import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  PaperPlaneRight,
  Microphone,
  SpeakerHigh,
  SpeakerSlash,
  ArrowCounterClockwise,
  ShoppingCart,
  ArrowSquareOut,
  Check,
  WhatsappLogo,
  Star,
  Plus,
  Package,
  CookingPot,
  Bicycle,
  CheckCircle,
} from "@phosphor-icons/react";
import { useCart } from "../contexts/CartContext";
import { AuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { fmt, buildWhatsAppUrl } from "../utils/format";
import api from "../api/axios";
import "./Chatbot.css";

const STORAGE_KEY = "@TheBurguer:chat_messages_v2";
const SESSION_KEY = "@TheBurguer:chat_session_id";
const MUTED_KEY = "@TheBurguer:chat_muted";
const INACTIVITY_MINIMIZE_MS = 4 * 60 * 1000; // 4 minutos

const DEFAULT_QUICK_REPLIES = [
  "🍔 Ver Cardápio",
  "🔥 Mais Vendidos",
  "📦 Rastrear Pedido",
  "🛒 Meu Carrinho",
  "🕒 Horários & Status",
];

const WELCOME_MESSAGE = {
  id: "welcome",
  sender: "bot",
  text: "Olá! 🍔 Sou o assistente virtual da **The Burguer**.\nComo posso ajudar você hoje?",
  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

// Gera ID de sessão persistente
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

// Síntese sonora pura com Web Audio API (sem dependências externas)
function playTone(type = "send", isMuted = false) {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      // Pop suave ao enviar
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === "receive") {
      // Chime melodioso ao receber
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06); // A5
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch {
    // Silencia em caso de restrição do navegador
  }
}

// Renderizador seguro de Markdown básico (negrito e emojis)
function renderFormattedText(text) {
  if (!text) return null;

  // Quebra por linhas
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Divide tags **negrito**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    return (
      <div key={lineIdx} className="chat-text-line">
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </div>
    );
  });
}

export default function Chatbot() {
  const navigate = useNavigate();
  const { addToCart, openCart, totalItems, totalPrice } = useCart();
  const { user } = React.useContext(AuthContext);
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [storeStatus, setStoreStatus] = useState({ isOpen: true, label: "🟢 Aberto agora" });
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const [addedItems, setAddedItems] = useState({});
  const [isListening, setIsListening] = useState(false);

  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTED_KEY) === "true";
    } catch {
      return false;
    }
  });

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
  const recognitionRef = useRef(null);

  // ─── Salva preferências e histórico ───────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // localStorage bloqueado
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(MUTED_KEY, isMuted ? "true" : "false");
    } catch {
      // localStorage bloqueado
    }
  }, [isMuted]);

  // ─── Consulta status inicial da loja ─────────────────────────
  useEffect(() => {
    api
      .get("/chatbot/status")
      .then((res) => {
        if (res.data) setStoreStatus(res.data);
      })
      .catch(() => {});
  }, []);

  // ─── Scroll automático suave ao receber nova mensagem ─────────
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({
        top: bodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // ─── Foco no input e zera contagem ao abrir ───────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnreadCount(0);
    }
  }, [open]);

  // ─── Auto-minimizar após inatividade ─────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, INACTIVITY_MINIMIZE_MS);
  }, []);

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
  }, [open, messages, resetInactivityTimer]);

  // ─── Reconhecimento de Voz (Speech-to-Text) ───────────────────
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        resetInactivityTimer();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setMessage(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Falha ao iniciar SpeechRecognition:", e);
      setIsListening(false);
    }
  };

  // ─── Navegar para o Cardápio no Site e Minimizar o Chat ──────
  const handleGoToMenu = useCallback(() => {
    setOpen(false);
    const menuEl = document.getElementById("menu");
    if (menuEl) {
      menuEl.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    }
  }, [navigate]);

  // ─── Enviar Mensagem ──────────────────────────────────────────
  async function sendMessage(customMessage = null) {
    const text = (customMessage || message).trim();
    if (!text) return;

    resetInactivityTimer();
    setLastFailedMessage(null);

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Trata comandos locais imediatos antes de chamar API se for o caso
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("ver cardápio no site") ||
      lowerText.includes("ver cardapio no site") ||
      lowerText.includes("explorar cardápio") ||
      lowerText.includes("cardápio no site")
    ) {
      handleGoToMenu();
      return;
    }

    if (
      lowerText === "abrir carrinho" ||
      lowerText === "ver carrinho" ||
      lowerText.includes("meu carrinho") ||
      lowerText.includes("🛒")
    ) {
      setOpen(false);
      openCart();
      return;
    }

    if (lowerText.includes("whatsapp")) {
      window.open(buildWhatsAppUrl("Olá, gostaria de tirar uma dúvida sobre o The Burguer!"), "_blank");
      return;
    }

    if (lowerText.includes("acompanhar pedido ao vivo")) {
      const lastOrderMsg = [...messages].reverse().find((m) => m.type === "order" && m.data?.order?.id);
      if (lastOrderMsg) {
        navigate(`/tracking/${lastOrderMsg.data.order.id}`);
        return;
      }
      navigate("/my-orders");
      return;
    }

    // Adiciona mensagem do usuário
    setMessages((prev) => [
      ...prev,
      {
        id: "msg_" + Date.now(),
        sender: "user",
        text,
        time: currentTime,
      },
    ]);

    playTone("send", isMuted);

    if (!customMessage) {
      setMessage("");
    }

    setIsTyping(true);

    try {
      const sessionId = getOrCreateSessionId();

      const response = await api.post("/chatbot", {
        message: text,
        sessionId,
      });

      const data = response.data;
      const botReply = data?.reply || "Olá! Como posso ajudar?";
      const responseTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (data?.storeStatus) {
        setStoreStatus(data.storeStatus);
      }

      if (data?.quickReplies && Array.isArray(data.quickReplies) && data.quickReplies.length > 0) {
        setQuickReplies(data.quickReplies);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "bot_" + Date.now(),
          sender: "bot",
          text: botReply,
          type: data?.type || "text",
          data: data?.data || null,
          time: responseTime,
        },
      ]);

      playTone("receive", isMuted);

      if (!open) {
        setUnreadCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Chatbot -> falha ao obter resposta:", err?.response?.data || err?.message || err);
      setLastFailedMessage(text);

      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "bot",
          text: "Ops! Não consegui me comunicar com o servidor agora. Verifique sua conexão ou tente novamente.",
          isError: true,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // ─── Reiniciar Sessão de Atendimento ──────────────────────────
  async function resetChat() {
    try {
      const sessionId = localStorage.getItem(SESSION_KEY);
      if (sessionId) {
        await api.post("/chatbot/reset", { sessionId }).catch(() => {});
      }
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setMessages([
        {
          id: "welcome_reset",
          sender: "bot",
          text: "Conversa reiniciada! 🍔 Como posso te ajudar agora?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setQuickReplies(DEFAULT_QUICK_REPLIES);
      toast.info("Histórico do chat reiniciado.");
    } catch {
      // Falha silenciosa
    }
  }

  function retryLastMessage() {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  }

  return (
    <>
      {/* Botão Flutuante (FAB) */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente virtual The Burguer"
      >
        <span className="fab-icon">🍔</span>
        {unreadCount > 0 && <span className="chatbot-badge">{unreadCount}</span>}
      </button>

      {/* Janela do Chatbot */}
      {open && (
        <div className="chatbot-card" role="dialog" aria-labelledby="chatbot-heading">
          {/* Header */}
          <div className="chatbot-header">
            <div className="bot-avatar">🍔</div>

            <div className="bot-info">
              <h3 id="chatbot-heading">The Burguer Chef</h3>
              <div className="bot-status-row">
                <span className={`status-indicator ${storeStatus.isOpen ? "open" : "closed"}`}>
                  {storeStatus.label}
                </span>
              </div>
            </div>

            <div className="header-actions-group">
              {/* Alternar som */}
              <button
                className="chatbot-header-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Ativar som de mensagens" : "Silenciar mensagens"}
                aria-label={isMuted ? "Ativar som" : "Silenciar"}
              >
                {isMuted ? <SpeakerSlash size={17} weight="bold" /> : <SpeakerHigh size={17} weight="bold" />}
              </button>

              {/* Reiniciar chat */}
              <button
                className="chatbot-header-btn"
                onClick={resetChat}
                title="Reiniciar conversa"
                aria-label="Reiniciar conversa"
              >
                <ArrowCounterClockwise size={17} weight="bold" />
              </button>

              {/* Fechar */}
              <button
                className="chatbot-header-btn close-btn"
                onClick={() => setOpen(false)}
                aria-label="Fechar assistente"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg, index) => (
              <div key={msg.id || index} className={`message-wrapper ${msg.sender}`}>
                <div className={`message ${msg.sender} ${msg.isError ? "error" : ""}`}>
                  <div className="message-content">{renderFormattedText(msg.text)}</div>

                  {/* WIDGET: VER CARDÁPIO COMPLETO NO SITE */}
                  {(msg.type === "menu_highlights" || msg.type === "products") && (
                    <div className="chat-menu-cta-widget">
                      <button
                        className="chat-explore-menu-btn"
                        onClick={handleGoToMenu}
                        type="button"
                      >
                        <span>📖 Explorar Cardápio Completo no Site</span>
                        <ArrowSquareOut size={16} weight="bold" />
                      </button>
                    </div>
                  )}

                  {/* WIDGET: CARD DE RASTREAMENTO AO VIVO */}
                  {msg.type === "order" && msg.data?.order && (
                    <div className="chat-order-widget">
                      <div className="chat-order-header">
                        <div className="order-id">
                          <Package size={16} color="var(--gold)" />
                          <span>Pedido #{msg.data.order.id.slice(0, 8)}</span>
                        </div>
                        <span className={`order-status-badge ${msg.data.order.status.toLowerCase()}`}>
                          {msg.data.order.status}
                        </span>
                      </div>

                      {/* Linha do tempo simples */}
                      <div className="order-timeline-steps">
                        <div
                          className={`step-dot ${
                            ["PENDING", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
                              msg.data.order.status
                            )
                              ? "done"
                              : ""
                          }`}
                          title="Recebido"
                        >
                          <Package size={12} />
                        </div>
                        <div
                          className={`step-line ${
                            ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(msg.data.order.status)
                              ? "done"
                              : ""
                          }`}
                        />
                        <div
                          className={`step-dot ${
                            ["PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(msg.data.order.status)
                              ? "done"
                              : ""
                          }`}
                          title="Na chapa"
                        >
                          <CookingPot size={12} />
                        </div>
                        <div
                          className={`step-line ${
                            ["OUT_FOR_DELIVERY", "DELIVERED"].includes(msg.data.order.status) ? "done" : ""
                          }`}
                        />
                        <div
                          className={`step-dot ${
                            ["OUT_FOR_DELIVERY", "DELIVERED"].includes(msg.data.order.status) ? "done" : ""
                          }`}
                          title="A caminho"
                        >
                          <Bicycle size={12} />
                        </div>
                        <div
                          className={`step-line ${msg.data.order.status === "DELIVERED" ? "done" : ""}`}
                        />
                        <div
                          className={`step-dot ${msg.data.order.status === "DELIVERED" ? "done" : ""}`}
                          title="Entregue"
                        >
                          <CheckCircle size={12} />
                        </div>
                      </div>

                      <div className="chat-order-footer">
                        <span className="order-total-label">Total: {fmt(msg.data.order.total)}</span>
                        <button
                          className="chat-track-btn"
                          onClick={() => navigate(`/tracking/${msg.data.order.id}`)}
                        >
                          <span>Acompanhar ao Vivo</span>
                          <ArrowSquareOut size={15} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* WIDGET: HANDOFF WHATSAPP */}
                  {msg.type === "whatsapp" && (
                    <div className="chat-whatsapp-widget">
                      <a
                        href={buildWhatsAppUrl("Olá! Gostaria de atendimento com um atendente The Burguer.")}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-btn"
                      >
                        <WhatsappLogo size={18} weight="fill" />
                        <span>Conversar no WhatsApp</span>
                      </a>
                    </div>
                  )}

                  {/* WIDGET: PROMPT DE CARRINHO */}
                  {msg.type === "cart_prompt" && (
                    <div className="chat-cart-widget">
                      <div className="cart-widget-info">
                        <span>
                          Itens no carrinho: <strong>{totalItems}</strong>
                        </span>
                        <span>
                          Total: <strong>{fmt(totalPrice)}</strong>
                        </span>
                      </div>
                      <button className="chat-open-cart-btn" onClick={() => { setOpen(false); openCart(); }}>
                        <ShoppingCart size={16} weight="bold" />
                        <span>Abrir Meu Carrinho</span>
                      </button>
                    </div>
                  )}

                  {/* Horário da mensagem */}
                  {msg.time && <div className="message-time">{msg.time}</div>}

                  {/* Botão de retry em caso de erro */}
                  {msg.isError && lastFailedMessage && index === messages.length - 1 && (
                    <button className="retry-button" onClick={retryLastMessage}>
                      ↻ Tentar novamente
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Indicador de Digitação */}
            {isTyping && (
              <div className="message-wrapper bot">
                <div className="message bot typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
          </div>

          {/* Sugestões Rápidas / Quick Actions */}
          <div className="quick-actions-bar">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                className="quick-chip"
                onClick={() => sendMessage(reply)}
                type="button"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Rodapé / Input de Mensagem */}
          <div className="chatbot-footer">
            {/* Botão de Gravação de Voz */}
            <button
              type="button"
              className={`mic-button ${isListening ? "listening" : ""}`}
              onClick={toggleSpeechRecognition}
              title={isListening ? "Parar de ouvir" : "Falar por microfone"}
              aria-label={isListening ? "Parar de ouvir" : "Gravar voz"}
            >
              <Microphone size={19} weight={isListening ? "fill" : "regular"} />
            </button>

            <input
              ref={inputRef}
              value={message}
              placeholder={isListening ? "🎤 Ouvindo... Fale agora" : "Digite sua mensagem..."}
              onChange={(e) => {
                setMessage(e.target.value);
                resetInactivityTimer();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              aria-label="Campo de mensagem do assistente"
            />

            <button
              type="button"
              className="send-button"
              onClick={() => sendMessage()}
              disabled={!message.trim() || isTyping}
              aria-label="Enviar mensagem"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}