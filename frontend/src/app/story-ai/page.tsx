'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StoryAIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const updated = [...messages, { role: 'user', content: input }];
    setMessages(updated);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated })
      });
      const data = await res.json();
      if (res.ok) {
        const ai = data.choices?.[0]?.message?.content || 'No response';
        setMessages([...updated, { role: 'assistant', content: ai }]);
      } else {
        setMessages([...updated, { role: 'assistant', content: data.error || 'Error from API' }]);
      }
    } catch (err) {
      setMessages([...updated, { role: 'assistant', content: 'Failed to reach server' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">AI Story Chat</h1>
          <Link href="/" className="btn-secondary">Home</Link>
        </div>
        <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto p-4 bg-white rounded-lg border border-gray-200">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <span className={`inline-block px-3 py-2 rounded-lg max-w-full break-words ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {m.content}
              </span>
            </div>
          ))}
          {loading && <div className="text-gray-500">Thinking...</div>}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            className="form-input flex-1 px-4 py-3"
            placeholder="Ask the AI for a story idea..."
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:bg-gray-400"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
