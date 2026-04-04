// DONE: Task 5d — Chatbot panel
import React, { useState, useRef, useEffect } from 'react';
import { useChatbotStore } from '@/store/chatbotStore';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatMessage } from './ChatMessage';
import { useTelemetryStore } from '@/store/telemetryStore';
import { getParagraphById } from '@/utils/paragraphUtils';

const EMOJI_OPTIONS = ['🦉', '🤖', '🧠', '📚', '🎓', '💡', '🦊', '🐬'];
const COLOR_OPTIONS = ['#185FA5', '#0F6E56', '#854F0B', '#993556', '#374151', '#7C3AED'];

const QUICK_ACTIONS = [
  'Explain this paragraph',
  'Define difficult words',
  'Summarize so far',
];

export const ChatbotPanel: React.FC = () => {
  const isOpen = useChatbotStore(s => s.isOpen);
  const messages = useChatbotStore(s => s.messages);
  const isTyping = useChatbotStore(s => s.isTyping);
  const avatarConfig = useChatbotStore(s => s.avatarConfig);
  const updateAvatarConfig = useChatbotStore(s => s.updateAvatarConfig);
  const toggleOpen = useChatbotStore(s => s.toggleOpen);
  const contextParagraphId = useChatbotStore(s => s.contextParagraphId);

  const [input, setInput] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChatbot();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const contextParagraph = contextParagraphId ? getParagraphById(contextParagraphId) : null;
  const contextExcerpt = contextParagraph?.text?.slice(0, 40) || '';
  const articleTitle = localStorage.getItem('last_article_title') || 'Unknown';

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText) return;
    setInput('');
    await sendMessage(msgText);
  };

  const handleQuickAction = async (action: string) => {
    if (action === 'Explain this paragraph' && contextParagraph) {
      await sendMessage(`Explain this paragraph in simple terms: ${contextParagraph.text.slice(0, 300)}`);
    } else {
      await sendMessage(action);
    }
  };

  return (
    <div
      className="chatbot-panel"
      style={{
        position: 'fixed',
        right: '20px',
        bottom: `${avatarConfig.positionY}vh`,
        marginBottom: `${avatarConfig.size + 12}px`,
        width: '320px',
        maxHeight: '460px',
        background: 'white',
        borderRadius: '14px',
        border: '1px solid rgba(24,95,165,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        zIndex: 8000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panel-appear 200ms ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        borderBottom: '1px solid rgba(24,95,165,0.1)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>{avatarConfig.emoji}</span>
        <span style={{ fontWeight: 600, fontSize: '14px', flex: 1, color: '#1a1a18' }}>Reading Assistant</span>
        <button onClick={() => setShowCustomize(!showCustomize)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', opacity: 0.5
        }}>⚙</button>
        <button onClick={toggleOpen} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '4px', opacity: 0.5
        }}>✕</button>
      </div>

      {/* Customize Panel */}
      <div style={{
        maxHeight: showCustomize ? '120px' : '0',
        overflow: 'hidden',
        transition: 'max-height 200ms ease-out',
        borderBottom: showCustomize ? '1px solid rgba(24,95,165,0.1)' : 'none',
      }}>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => updateAvatarConfig({ emoji })}
                style={{
                  width: '28px', height: '28px', fontSize: '16px',
                  background: avatarConfig.emoji === emoji ? 'rgba(24,95,165,0.1)' : 'transparent',
                  border: avatarConfig.emoji === emoji ? '2px solid #185FA5' : '2px solid transparent',
                  borderRadius: '6px', cursor: 'pointer',
                }}
              >{emoji}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            {COLOR_OPTIONS.map(color => (
              <button
                key={color}
                onClick={() => updateAvatarConfig({ color })}
                style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: color, cursor: 'pointer',
                  border: avatarConfig.color === color ? '2px solid #1a1a18' : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#888' }}>Size: {avatarConfig.size}</span>
            <input
              type="range" min={40} max={72} value={avatarConfig.size}
              onChange={(e) => updateAvatarConfig({ size: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Context strip */}
      <div style={{
        height: '32px',
        background: 'rgba(24,95,165,0.06)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: '11px',
        color: '#185FA5',
        flexShrink: 0,
      }}>
        {contextExcerpt
          ? `Context: ${contextExcerpt}...`
          : `Reading: ${articleTitle}`}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        minHeight: '200px',
      }}>
        {messages.length === 0 && !isTyping && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: '13px' }}>
            Ask me anything about what you're reading.
          </div>
        )}
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
            <div style={{
              padding: '8px 16px',
              borderRadius: '12px 12px 12px 2px',
              background: '#F1EFE8',
              display: 'flex', gap: '4px',
            }}>
              <span className="typing-dot" style={{ animationDelay: '0ms' }}>●</span>
              <span className="typing-dot" style={{ animationDelay: '400ms' }}>●</span>
              <span className="typing-dot" style={{ animationDelay: '800ms' }}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions (only when no messages) */}
      {messages.length === 0 && (
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '0 12px 8px',
          flexWrap: 'wrap',
        }}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(24,95,165,0.2)',
                background: 'transparent',
                color: '#185FA5',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >{action}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        borderTop: '1px solid rgba(24,95,165,0.1)',
        flexShrink: 0,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
          placeholder="Ask about this paragraph..."
          disabled={isTyping}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            padding: '8px',
            background: 'transparent',
            color: '#1a1a18',
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            background: input.trim() && !isTyping ? '#185FA5' : '#ddd',
            border: 'none',
            cursor: input.trim() && !isTyping ? 'pointer' : 'default',
            color: 'white',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >↑</button>
      </div>
    </div>
  );
};
