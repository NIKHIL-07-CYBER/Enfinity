// DONE: Task 5c — Chatbot avatar (draggable floating button)
import React, { useCallback } from 'react';
import { useChatbotStore } from '@/store/chatbotStore';

export const ChatbotAvatar: React.FC = () => {
  const toggleOpen = useChatbotStore((s) => s.toggleOpen);
  const avatarConfig = useChatbotStore((s) => s.avatarConfig);
  const hasUnread = useChatbotStore((s) => s.hasUnread);

  const handleClick = useCallback(() => {
    toggleOpen();
  }, [toggleOpen]);

  return (
    <button
      className="chatbot-avatar"
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '68px',
        width: `${avatarConfig.size}px`,
        height: `${avatarConfig.size}px`,
        borderRadius: '50%',
        background: avatarConfig.color,
        border: '2.5px solid var(--bg-primary)',
        boxShadow: '0 2px 12px color-mix(in srgb, var(--text-primary) 14%, transparent)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${avatarConfig.size * 0.45}px`,
        zIndex: 9999,
        padding: 0,
        outline: 'none',
        animation: hasUnread ? 'pulse-ring 2s infinite' : undefined,
        transition: 'transform 150ms ease, opacity 150ms ease',
      }}
      aria-label="Open chatbot"
    >
      {avatarConfig.emoji}
    </button>
  );
};
