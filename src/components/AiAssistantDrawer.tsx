import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Trash2, Sparkles, StopCircle, User, X, Key, ExternalLink, Check, AlertCircle } from "lucide-react";
import { useChatStore } from "@/lib/chat-store";
import { useDiagram } from "@/lib/store";
import type { CameraNodeData, NodeData, SwitchNodeData } from "@/lib/types";
import { toast } from "sonner";

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiAssistantDrawer({ isOpen, onClose }: AiAssistantDrawerProps) {
  const threads = useChatStore((s) => s.threads);
  const getThread = useChatStore((s) => s.getThread);
  const createThread = useChatStore((s) => s.createThread);
  const deleteThread = useChatStore((s) => s.deleteThread);
  const setMessages = useChatStore((s) => s.setMessages);

  // User API key management stored locally
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("netvision_gemini_key") || "";
    }
    return "";
  });

  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState(userApiKey);

  useEffect(() => {
    setKeyInput(userApiKey);
  }, [userApiKey]);

  const handleSaveKey = (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = keyInput.trim();
    if (!clean) {
      toast.error("Por favor, insira uma chave válida.");
      return;
    }
    localStorage.setItem("netvision_gemini_key", clean);
    setUserApiKey(clean);
    setShowKeyConfig(false);
    toast.success("Chave da API Gemini salva com sucesso!");
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("netvision_gemini_key");
    setUserApiKey("");
    setKeyInput("");
    setShowKeyConfig(false);
    toast.info("Chave da API removida.");
  };

  // Use the most recent thread or create one if none exists
  const activeThreadId = useMemo(() => {
    if (threads.length > 0) {
      return threads[0].id;
    }
    return null;
  }, [threads]);

  const [currentThreadId, setCurrentThreadId] = useState<string | null>(activeThreadId);

  // Initialize or align current thread ID
  useEffect(() => {
    if (isOpen) {
      if (threads.length === 0) {
        const newThread = createThread();
        setCurrentThreadId(newThread.id);
      } else if (!currentThreadId || !getThread(currentThreadId)) {
        setCurrentThreadId(threads[0].id);
      }
    }
  }, [isOpen, threads, createThread, currentThreadId, getThread]);

  const threadId = currentThreadId || "default-drawer-thread";

  const initialMessages = useMemo<UIMessage[]>(
    () => (currentThreadId ? getThread(currentThreadId)?.messages ?? [] : []),
    [currentThreadId, getThread]
  );

  // Build network context from diagram store on each send
  const nodes = useDiagram((s) => s.nodes);
  const edges = useDiagram((s) => s.edges);
  const buildContext = () => {
    const equipmentList = nodes.map((n) => {
      const d = n.data as NodeData;
      return { id: n.id, name: d.name, kind: d.kind };
    });

    const connections = edges.map(e => {
      const src = equipmentList.find(n => n.id === e.source)?.name || e.source;
      const tgt = equipmentList.find(n => n.id === e.target)?.name || e.target;
      return `${src} conectado a ${tgt} (${e.data?.isPower ? 'Energia' : 'Dados'})`;
    });

    const cameras = nodes
      .filter((n) => (n.data as NodeData).kind === "camera")
      .map((n) => {
        const d = n.data as CameraNodeData;
        return { name: d.name, type: d.cameraType, ip: d.ip, ping: d.ping ?? null, status: d.status ?? "unknown" };
      });
    const switches = nodes
      .filter((n) => (n.data as NodeData).kind === "switch")
      .map((n) => {
        const d = n.data as SwitchNodeData;
        return { name: d.name, type: d.switchType, ports: d.ports };
      });

    return { equipmentList, connections, cameras, switches, linksCount: edges.length };
  };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: userApiKey ? { "x-gemini-key": userApiKey } : undefined,
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, context: buildContext(), ...body },
        }),
      }),
    [nodes, edges, userApiKey]
  );

  const { messages, sendMessage, status, stop, error, setMessages: setLocalMessages } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  // Keep chat updated when currentThreadId changes
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [currentThreadId, initialMessages, setLocalMessages]);

  // Persist messages on change
  useEffect(() => {
    if (messages.length === 0 || !currentThreadId) return;
    setMessages(currentThreadId, messages);
  }, [messages, currentThreadId, setMessages]);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (isOpen && !showKeyConfig) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentThreadId, status, showKeyConfig]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    let activeId = currentThreadId;
    if (!activeId) {
      const newThread = createThread();
      activeId = newThread.id;
      setCurrentThreadId(activeId);
    }

    await sendMessage({ text });
  };

  const handleClearChat = () => {
    if (currentThreadId) {
      deleteThread(currentThreadId);
    }
    const newThread = createThread();
    setCurrentThreadId(newThread.id);
    setLocalMessages([]);
  };

  const ctxBadge = (() => {
    const c = nodes.filter((n) => (n.data as NodeData).kind === "camera").length;
    const s = nodes.filter((n) => (n.data as NodeData).kind === "switch").length;
    if (c + s === 0) return "Sem contexto de rede";
    return `${c} câmera${c === 1 ? "" : "s"} · ${s} switch${s === 1 ? "" : "es"}`;
  })();

  const isKeyMissingError = error?.message?.includes("Configure a sua chave");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/50 backdrop-blur-xs z-40 cursor-pointer"
          />

          {/* Side Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-card border-l border-border/60 shadow-2xl z-50 flex flex-col glass"
          >
            {/* Header */}
            <header className="flex items-center gap-3 px-5 py-4 border-b border-border/60 glass shrink-0">
              <div className="grid place-items-center w-9 h-9 rounded-lg bg-primary/15 text-primary border border-primary/30">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-sm leading-tight truncate">POP GRID Copilot</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success status-dot text-success" />
                  <span className="truncate">{ctxBadge}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowKeyConfig((prev) => !prev)}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${showKeyConfig || userApiKey
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  title="Configurar Chave da API Gemini"
                >
                  <Key className="w-4 h-4" />
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
                    title="Limpar conversa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* API Key configuration panel overlay */}
            <AnimatePresence>
              {(showKeyConfig || isKeyMissingError) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-secondary/40 border-b border-border/60 p-4 space-y-3 shrink-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                      <Key className="w-4 h-4" />
                      Chave da API Google Gemini
                    </div>
                    {showKeyConfig && (
                      <button
                        onClick={() => setShowKeyConfig(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Insira sua chave gratuita obtida no Google AI Studio para ativar o assistente de IA no seu navegador.
                  </p>

                  <form onSubmit={handleSaveKey} className="space-y-2">
                    <div className="relative">
                      <input
                        type="password"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Cole sua chave (AIzaSy...)"
                        className="w-full pl-3 pr-20 py-2 rounded-xl bg-background/80 border border-border/80 text-xs font-mono focus:border-primary focus:outline-none transition"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Salvar
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        Obter chave grátis no AI Studio <ExternalLink className="w-3 h-3" />
                      </a>
                      {userApiKey && (
                        <button
                          type="button"
                          onClick={handleRemoveKey}
                          className="text-destructive hover:underline cursor-pointer"
                        >
                          Remover chave
                        </button>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
              {messages.length === 0 && (
                <EmptyConversation
                  onPick={(q) => {
                    setInput(q);
                    textareaRef.current?.focus();
                  }}
                />
              )}

              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <Message key={m.id} message={m} />
                ))}
              </AnimatePresence>

              {status === "submitted" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <div className="grid place-items-center w-7 h-7 rounded-lg bg-primary/15 text-primary border border-primary/30 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs">
                    <ShimmerText>Analisando sua rede…</ShimmerText>
                  </span>
                </motion.div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive text-xs px-3 py-2">
                  Erro: {error.message}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={onSubmit} className="border-t border-border/60 glass p-4 shrink-0">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      const t = e.target;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void onSubmit();
                      }
                    }}
                    placeholder="Pergunte sobre câmeras, switches, IPs, troubleshooting..."
                    className="w-full resize-none bg-input/60 border border-border rounded-xl px-3 py-2.5 pr-10 text-xs focus:outline-none focus:border-primary placeholder:text-muted-foreground max-h-[120px]"
                  />
                </div>
                {isLoading ? (
                  <button
                    type="button"
                    onClick={() => stop()}
                    className="grid place-items-center w-9 h-9 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 transition shrink-0 cursor-pointer"
                    aria-label="Parar"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:glow-cyan transition disabled:opacity-40 shrink-0 cursor-pointer"
                    aria-label="Enviar"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`grid place-items-center w-7.5 h-7.5 rounded-lg border shrink-0 ${isUser
            ? "bg-accent/15 text-accent border-accent/30"
            : "bg-primary/15 text-primary border-primary/30"
          }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
        {isUser ? (
          <div className="inline-block bg-primary text-primary-foreground rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs whitespace-pre-wrap text-left shadow-sm">
            {text}
          </div>
        ) : (
          <div className="prose prose-invert prose-xs max-w-none text-foreground leading-relaxed prose-p:my-1.5 prose-pre:bg-secondary prose-pre:border prose-pre:border-border prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-strong:text-foreground prose-headings:text-foreground prose-a:text-primary rounded-xl bg-secondary/35 border border-border/40 p-3 text-left">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ShimmerText({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: "linear-gradient(90deg, oklch(0.7 0.03 240) 0%, oklch(0.96 0.01 240) 50%, oklch(0.7 0.03 240) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s linear infinite",
      }}
    >
      {children}
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </span>
  );
}

function EmptyConversation({ onPick }: { onPick: (q: string) => void }) {
  const suggestions = [
    "Quais câmeras estão com ping alto agora?",
    "Como configurar VLAN para segregar CFTV?",
    "Sugira nomes padronizados para minhas câmeras.",
    "Calcule o consumo PoE estimado para 8 câmeras Dome.",
  ];
  return (
    <div className="text-center py-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-grid place-items-center w-12 h-12 rounded-xl bg-primary/15 text-primary border border-primary/30 mb-3 glow-cyan"
      >
        <Sparkles className="w-5 h-5" />
      </motion.div>
      <h2 className="font-display text-lg font-semibold">Como posso ajudar?</h2>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
        Sou seu copiloto de CFTV e redes. Tenho acesso ao diagrama atual e posso sugerir diagnósticos e melhorias.
      </p>
      <div className="grid gap-2 mt-5 max-w-xs mx-auto">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left text-[11px] p-2.5 rounded-lg glass hover:border-primary/40 transition cursor-pointer leading-normal"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
