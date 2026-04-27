import { useState, useEffect, useRef } from 'react';
import { Holding, CashAccount, AssetAccount } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAdvisorChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  holdings: Holding[];
  cashAccounts: CashAccount[];
  assetAccounts: AssetAccount[];
}

function createChatMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: new Date()
  };
}

export default function AIAdvisorChatbot({
  isOpen = false,
  onClose = () => {},
  holdings = [],
  cashAccounts = [],
  assetAccounts = []
}: AIAdvisorChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading) {
      return;
    }

    const userMessage = createChatMessage('user', input.trim());
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }],
          holdings,
          cashAccounts: cashAccounts || [],
          assetAccounts: assetAccounts || []
        })
      });

      const aiResponse = await response.json();

      if (aiResponse.success) {
        const aiMessage = createChatMessage('assistant', aiResponse.message);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.log('Error received:', aiResponse.error);
        setError('AI service unavailable. Please try again.');
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md z-50">
      <div className="glass-card-elevated flex flex-col pointer-events-auto max-h-[80vh]" style={{ padding: '0' }}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-[17px] font-semibold">
            AI Portfolio Advisor
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn-glass text-secondary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center text-secondary py-8">
              <p className="text-sm text-primary">
                👋 Hello! I&apos;m your AI portfolio advisor.
              </p>
              <p className="text-sm text-secondary mt-2">
                Ask me about your portfolio performance, allocation, or any investment questions.
              </p>
              <p className="text-xs text-tertiary mt-4">
                Powered by Gemini 2.5 Flash (Free), OpenAI & Anthropic AI
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 ${
                  message.role === 'user'
                    ? 'btn-primary ml-auto text-white'
                    : 'bg-glass border'
                }`}
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="bg-glass border px-4 py-3" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-negative/10 border border-negative/30 text-negative px-4 py-3 mb-4" style={{ borderRadius: 'var(--radius-md)' }}>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask about your portfolio..."
              className="flex-1 px-4 py-3 bg-glass border rounded-lg focus:outline-none focus:border-accent transition-colors text-primary placeholder:text-secondary"
              style={{ borderRadius: 'var(--radius-pill)' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
