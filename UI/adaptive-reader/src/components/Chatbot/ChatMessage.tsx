// DONE: Task 5d — Chat message component + Task 3b bubble styles
import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/store/chatbotStore';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          maxWidth: isUser ? '78%' : '88%',
          padding: '9px 13px',
          borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
          color: isUser ? 'var(--toolbar-on-accent)' : 'var(--text-primary)',
          fontSize: '14px',
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
      <span
        style={{
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          marginTop: '2px',
          paddingLeft: isUser ? 0 : '4px',
          paddingRight: isUser ? '4px' : 0,
        }}
      >
        {formatRelativeTime(message.timestamp)}
      </span>
    </div>
  );
};
