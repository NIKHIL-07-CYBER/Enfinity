// DONE: Task 5d — Chat message component
import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/store/chatbotStore';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '8px',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '8px 12px',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        background: isUser ? '#185FA5' : '#F1EFE8',
        color: isUser ? 'white' : '#1a1a18',
        fontSize: '13px',
        lineHeight: 1.5,
        wordBreak: 'break-word',
      }}>
        {message.content}
      </div>
    </div>
  );
};
