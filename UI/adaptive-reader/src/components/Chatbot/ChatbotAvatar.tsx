// DONE: Task 5c — Chatbot avatar (draggable floating button)
import React, { useRef, useCallback } from 'react';
import { useChatbotStore } from '@/store/chatbotStore';

export const ChatbotAvatar: React.FC = () => {
  const toggleOpen = useChatbotStore(s => s.toggleOpen);
  const avatarConfig = useChatbotStore(s => s.avatarConfig);
  const updateAvatarConfig = useChatbotStore(s => s.updateAvatarConfig);
  const hasUnread = useChatbotStore(s => s.hasUnread);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragMoved.current = true;
      }

      if (dragMoved.current) {
        const newX = Math.max(2, Math.min(90, ((window.innerWidth - e.clientX) / window.innerWidth) * 100));
        const newY = Math.max(2, Math.min(90, ((window.innerHeight - e.clientY) / window.innerHeight) * 100));
        updateAvatarConfig({ positionX: newX, positionY: newY });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [updateAvatarConfig]);

  const handleClick = useCallback(() => {
    if (!dragMoved.current) {
      toggleOpen();
    }
    dragMoved.current = false;
  }, [toggleOpen]);

  return (
    <button
      className="chatbot-avatar"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        position: 'fixed',
        right: `${avatarConfig.positionX}vw`,
        bottom: `${avatarConfig.positionY}vh`,
        width: `${avatarConfig.size}px`,
        height: `${avatarConfig.size}px`,
        borderRadius: '50%',
        background: avatarConfig.color,
        border: '2.5px solid white',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${avatarConfig.size * 0.45}px`,
        zIndex: 7900,
        padding: 0,
        outline: 'none',
        animation: hasUnread ? 'pulse-ring 2s infinite' : undefined,
        transition: 'right 50ms, bottom 50ms',
      }}
    >
      {avatarConfig.emoji}
    </button>
  );
};
