import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { ModeSelector } from './ModeSelector';
import { DirectChatView } from './DirectChatView';
import { ComparisonChatView } from './ComparisonChatView';
import { ChatSidebar } from './ChatSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/types/chat';

/* ================= API ================= */
const callBackendAPI = async (message, modelId) => {
  try {
    const response = await fetch('http://127.0.0.1:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model: modelId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.reply || 'Backend error');
    }

    return data.reply;
  } catch (error) {
    console.error(error);
    return '❌ Erreur backend';
  }
};

/* ================= UTILS ================= */
const getProvider = (modelId) =>
  AVAILABLE_MODELS.find(m => m.id === modelId)?.provider;

const isConnectedModel = (modelId) => {
  const provider = getProvider(modelId);
  return ['Groq', 'Google', 'OpenRouter', 'Local'].includes(provider);
};

const generateMockResponse = async (modelId) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return `[Mock Response]
Le modèle "${modelId}" n’est pas encore connecté à une API réelle.`;
};

/* ================= COMPONENT ================= */
export function ChatContainer() {
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    addMessage,
    addComparisonMessage,
    updateComparisonResponse,
    setMode,
    setSelectedModel,
    setComparisonModels,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const conversationIdRef = useRef(null);

  const ensureConversation = useCallback(() => {
    if (!activeConversation) {
      const id = createConversation('direct');
      conversationIdRef.current = id;
      return id;
    }
    conversationIdRef.current = activeConversationId;
    return activeConversationId;
  }, [activeConversation, activeConversationId, createConversation]);

  /* ========== DIRECT CHAT ========== */
  const handleDirectMessage = useCallback(async (content) => {
    const conversationId = ensureConversation();
    setIsLoading(true);

    addMessage(conversationId, { role: 'user', content });

    const modelId = activeConversation?.selectedModel || 'grok-3-mini';

    try {
      const response = isConnectedModel(modelId)
        ? await callBackendAPI(content, modelId)
        : await generateMockResponse(modelId);

      addMessage(conversationId, {
        role: 'assistant',
        content: response,
        modelId,
      });
    } finally {
      setIsLoading(false);
    }
  }, [ensureConversation, addMessage, activeConversation?.selectedModel]);

  /* ========== COMPARISON CHAT ========== */
  const handleComparisonMessage = useCallback(async (content) => {
    const conversationId = ensureConversation();
    setIsLoading(true);

    const leftModel = activeConversation?.leftModel || 'grok-3-mini';
    const rightModel = activeConversation?.rightModel || 'gemini-1.5-pro';

    const msg = addComparisonMessage(conversationId, content, null, null);

    try {
      const [left, right] = await Promise.all([
        isConnectedModel(leftModel)
          ? callBackendAPI(content, leftModel)
          : generateMockResponse(leftModel),

        isConnectedModel(rightModel)
          ? callBackendAPI(content, rightModel)
          : generateMockResponse(rightModel),
      ]);

      updateComparisonResponse(conversationId, msg.id, 'left', {
        id: `left-${Date.now()}`,
        role: 'assistant',
        content: left,
        modelId: leftModel,
        timestamp: Date.now(),
      });

      updateComparisonResponse(conversationId, msg.id, 'right', {
        id: `right-${Date.now()}`,
        role: 'assistant',
        content: right,
        modelId: rightModel,
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    ensureConversation,
    activeConversation?.leftModel,
    activeConversation?.rightModel,
    addComparisonMessage,
    updateComparisonResponse,
  ]);

  const handleSendMessage = useCallback((content) => {
    activeConversation?.mode === 'comparison'
      ? handleComparisonMessage(content)
      : handleDirectMessage(content);
  }, [activeConversation?.mode, handleDirectMessage, handleComparisonMessage]);

  const currentMode = activeConversation?.mode || 'direct';

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatSidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={setActiveConversationId}
        onCreate={() => createConversation(currentMode)}
        onDelete={deleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b glass-panel">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Arena</h1>
              <p className="text-xs text-muted-foreground">
                Multi-LLM Chat & Comparison
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeSelector
              mode={currentMode}
              onModeChange={(m) => {
                const id = ensureConversation();
                setMode(id, m);
              }}
            />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 min-h-0">
          {currentMode === 'comparison' ? (
            <ComparisonChatView
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onLeftModelChange={(m) => {
                const id = ensureConversation();
                setComparisonModels(id, m, activeConversation?.rightModel);
              }}
              onRightModelChange={(m) => {
                const id = ensureConversation();
                setComparisonModels(id, activeConversation?.leftModel, m);
              }}
              isLoading={isLoading}
            />
          ) : (
            <DirectChatView
              conversation={activeConversation}
              onSendMessage={handleSendMessage}
              onModelChange={(m) => {
                const id = ensureConversation();
                setSelectedModel(id, m);
              }}
              isLoading={isLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
