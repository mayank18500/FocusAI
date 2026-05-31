import React, { useEffect, useState, useRef } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadInitialAdvice(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadInitialAdvice = async () => {
    if (!isChromeExtension()) { setInitialLoaded(true); return; }
    setLoading(true);
    try {
      const res = await sendMessage<any>({ type: 'GET_COACH_ADVICE' });
      if (res) {
        const content = formatAdvice(res);
        setMessages([{ role: 'assistant', content }]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setInitialLoaded(true); }
  };

  const sendQuestion = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await sendMessage<any>({
        type: 'GET_COACH_ADVICE',
        payload: { question },
      });
      if (res) {
        const content = formatAdvice(res);
        setMessages((prev) => [...prev, { role: 'assistant', content }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble processing that. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const formatAdvice = (res: any): string => {
    let content = res.advice || '';
    if (res.recommendations?.length > 0) {
      content += '\n\n📋 **Recommendations:**\n' + res.recommendations.map((r: string) => `• ${r}`).join('\n');
    }
    if (res.insights?.length > 0) {
      content += '\n\n💡 **Insights:**\n' + res.insights.map((i: string) => `• ${i}`).join('\n');
    }
    return content;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold">AI Productivity Coach</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get personalized advice based on your focus patterns
        </p>
      </div>

      {/* Chat Area */}
      <div className="glass-card flex-1 flex flex-col min-h-[400px] max-h-[600px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!initialLoaded ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading your productivity insights...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <span className="text-5xl block mb-4">🤖</span>
                <p className="text-sm text-muted-foreground">Your AI coach is ready. Ask a question about your productivity!</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary text-foreground rounded-bl-sm'
                }`}>
                  {msg.content.split('\n').map((line, j) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={j} className="font-semibold mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('📋') || line.startsWith('💡')) {
                      return <p key={j} className="font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('• ')) {
                      return <p key={j} className="ml-2 text-muted-foreground">{line}</p>;
                    }
                    return line ? <p key={j}>{line}</p> : <br key={j} />;
                  })}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary p-3 rounded-xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
              placeholder="Ask your AI coach..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              disabled={loading}
            />
            <button
              onClick={sendQuestion}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Powered by Gemini AI · Configure API key in Settings
          </p>
        </div>
      </div>
    </div>
  );
}
