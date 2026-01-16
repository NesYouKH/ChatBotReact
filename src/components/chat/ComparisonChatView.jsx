import { useRef, useEffect } from 'react';
import { AVAILABLE_MODELS } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { Columns2 } from 'lucide-react';

export function ComparisonChatView({
  conversation,
  onSendMessage,
  onLeftModelChange,
  onRightModelChange,
  isLoading,
  streamingLeftId,
  streamingRightId,
}) {
  const scrollRef = useRef(null);

  const leftModel = AVAILABLE_MODELS.find(m => m.id === conversation.leftModel);
  const rightModel = AVAILABLE_MODELS.find(m => m.id === conversation.rightModel);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [conversation?.comparisonMessages]);

  const messageRows = conversation.comparisonMessages.map(cm => ({
    id: cm.id,
    userMessage: cm.userMessage,
    leftResponse: cm.leftResponse,
    rightResponse: cm.rightResponse,
    timestamp: cm.timestamp,
  }));

  const hasMessages = messageRows.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 border-b border-border/50">
        <div className="grid grid-cols-2 gap-4 max-w-5xl mx-auto">
          <ModelSelector
            value={conversation.leftModel || 'gemini-1.5-pro'}
            onChange={onLeftModelChange}
            excludeModel={conversation.rightModel || undefined}
            label="Left Model"
          />
          <ModelSelector
            value={conversation.rightModel || 'grok-3-mini'}
            onChange={onRightModelChange}
            excludeModel={conversation.leftModel || undefined}
            label="Right Model"
          />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {!hasMessages ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState />
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {messageRows.map((row) => (
              <div key={row.id} className="space-y-4">
                <div className="max-w-3xl mx-auto">
                  <ChatMessage
                    message={{
                      id: `${row.id}-user`,
                      role: 'user',
                      content: row.userMessage,
                      timestamp: row.timestamp,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="min-h-[60px]">
                    {row.leftResponse ? (
                      <ChatMessage
                        message={row.leftResponse}
                        isStreaming={row.leftResponse.id === streamingLeftId}
                      />
                    ) : (
                      <LoadingPlaceholder modelName={leftModel?.name || 'Left Model'} />
                    )}
                  </div>

                  <div className="min-h-[60px]">
                    {row.rightResponse ? (
                      <ChatMessage
                        message={row.rightResponse}
                        isStreaming={row.rightResponse.id === streamingRightId}
                      />
                    ) : (
                      <LoadingPlaceholder modelName={rightModel?.name || 'Right Model'} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
        <Columns2 className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Compare AI Models
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Send a message to see how different models respond side-by-side.
      </p>
    </div>
  );
}

function LoadingPlaceholder({ modelName }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary/50 animate-pulse" />
      </div>
      <div className="flex-1 rounded-lg px-4 py-3 message-bubble-assistant">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
          <span className="text-xs font-medium text-primary">{modelName}</span>
          <span className="text-xs text-muted-foreground">• Thinking...</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
