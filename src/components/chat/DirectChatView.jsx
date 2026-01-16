import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { Bot } from 'lucide-react';

export function DirectChatView({
  conversation,
  onSendMessage,
  onModelChange,
  isLoading,
  streamingMessageId,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 border-b border-border/50">
        <div className="max-w-2xl mx-auto">
          <ModelSelector
            value={conversation?.selectedModel || 'grok-3-mini'}
            onChange={onModelChange}
            label="Active Model"
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin p-4"
      >
        <div className="max-w-2xl mx-auto space-y-4">
          {!conversation?.messages?.length ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 animate-pulse-glow">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Start a Conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Select a model and send a message to begin chatting.
              </p>
            </div>
          ) : (
            conversation.messages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={message.id === streamingMessageId}
              />
            ))
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
