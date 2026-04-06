// DONE: Task 5d — Chatbot panel + Task 3a/3b positioning & UI
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChatbotStore, type AvatarConfig } from '@/store/chatbotStore';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatMessage } from './ChatMessage';
import { getParagraphById } from '@/utils/paragraphUtils';

const EMOJI_OPTIONS = ['🦉', '🤖', '🧠', '📚', '🎓', '💡', '🦊', '🐬'];
const COLOR_PRESET_VARS = [
  'var(--avatar-preset-1)',
  'var(--avatar-preset-2)',
  'var(--avatar-preset-3)',
  'var(--avatar-preset-4)',
  'var(--avatar-preset-5)',
  'var(--avatar-preset-6)',
];

const QUICK_ACTIONS = ['Explain this paragraph', 'Define difficult words', 'Summarize so far'];

const FIVE_MIN_MS = 5 * 60 * 1000;

function computePanelStyle(winW: number): React.CSSProperties {
  const PANEL_WIDTH = Math.min(340, winW - 32);
  const PANEL_MAX_HEIGHT = 520;
  const gap = 24;
  const right = 24;
  const bottom = 80;

  return {
    position: 'fixed',
    bottom,
    right,
    width: PANEL_WIDTH,
    maxHeight: PANEL_MAX_HEIGHT,
    zIndex: 9998,
  };
}

export const ChatbotPanel: React.FC = () => {
  const isOpen = useChatbotStore((s) => s.isOpen);
  const messages = useChatbotStore((s) => s.messages);
  const isTyping = useChatbotStore((s) => s.isTyping);
  const avatarConfig = useChatbotStore((s) => s.avatarConfig);
  const updateAvatarConfig = useChatbotStore((s) => s.updateAvatarConfig);
  const toggleOpen = useChatbotStore((s) => s.toggleOpen);
  const clearMessages = useChatbotStore((s) => s.clearMessages);
  const contextParagraphId = useChatbotStore((s) => s.contextParagraphId);

  const [input, setInput] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [win, setWin] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1024,
    h: typeof window !== 'undefined' ? window.innerHeight : 768,
  }));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChatbot();

  useEffect(() => {
    const onResize = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const panelStyle = useMemo(
    () => computePanelStyle(win.w),
    [win.w],
  );

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
        ...panelStyle,
        background: 'var(--bg-secondary)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--text-primary) 10%, transparent)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panel-appear 200ms ease-out',
      }}
    >
      <div
        style={{
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          borderBottom: '1px solid var(--border-color)',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: avatarConfig.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            marginRight: '10px',
          }}
        >
          {avatarConfig.emoji}
        </div>
        <span style={{ fontWeight: 500, fontSize: '13px', flex: 1, color: 'var(--text-primary)' }}>
          Reading Assistant
        </span>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => { if (window.confirm('Clear conversation history?')) clearMessages(); }}
            aria-label="Clear conversation"
            title="Clear conversation"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--text-secondary)',
              fontSize: '11px',
            }}
          >
            🗑
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowCustomize(!showCustomize)}
          aria-label="Customize"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleOpen}
          aria-label="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: 'var(--text-secondary)',
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          maxHeight: showCustomize ? '120px' : '0',
          overflow: 'hidden',
          transition: 'max-height 200ms ease-out',
          borderBottom: showCustomize ? '1px solid var(--border-color)' : 'none',
        }}
      >
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => updateAvatarConfig({ emoji })}
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '16px',
                  background: avatarConfig.emoji === emoji ? 'var(--accent-blue-bg)' : 'transparent',
                  border:
                    avatarConfig.emoji === emoji ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            {COLOR_PRESET_VARS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateAvatarConfig({ color: c })}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border:
                    avatarConfig.color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Size: {avatarConfig.size}</span>
            <input
              type="range"
              min={40}
              max={72}
              value={avatarConfig.size}
              onChange={(e) => updateAvatarConfig({ size: Number(e.target.value) })}
              style={{ flex: 1, accentColor: 'var(--accent-blue)' }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          height: '32px',
          background: 'var(--accent-blue-bg)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontSize: '11px',
          color: 'var(--accent-blue)',
          flexShrink: 0,
        }}
      >
        {contextExcerpt ? `Context: ${contextExcerpt}…` : `Reading: ${articleTitle}`}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          minHeight: '120px',
          background: 'var(--bg-primary)',
        }}
      >
        {messages.length === 0 && !isTyping && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Ask me anything about what you&apos;re reading.
          </div>
        )}
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showSep = prev && msg.timestamp - prev.timestamp > FIVE_MIN_MS;
          return (
            <React.Fragment key={msg.id}>
              {showSep && (
                <div
                  style={{
                    borderTop: '1px solid var(--border-color)',
                    margin: '12px 0',
                    opacity: 0.6,
                  }}
                />
              )}
              <ChatMessage message={msg} />
            </React.Fragment>
          );
        })}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', gap: '6px', paddingLeft: '4px' }}>
            <span className="typing-dot-bounce" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot-bounce" style={{ animationDelay: '160ms' }} />
            <span className="typing-dot-bounce" style={{ animationDelay: '320ms' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '0 12px 8px',
            flexWrap: 'wrap',
            background: 'var(--bg-primary)',
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => handleQuickAction(action)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--accent-blue)',
                fontSize: '11px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderTop: '1px solid var(--border-color)',
          flexShrink: 0,
          gap: '8px',
          background: 'var(--bg-secondary)',
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about this paragraph..."
          disabled={isTyping}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            padding: '8px 14px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            borderRadius: '20px',
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isTyping}
          aria-label="Send"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: input.trim() && !isTyping ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
            border: 'none',
            cursor: input.trim() && !isTyping ? 'pointer' : 'default',
            color: 'var(--toolbar-on-accent)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
