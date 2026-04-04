// DONE: Task 5b — Chatbot hook
import { useChatbotStore } from '@/store/chatbotStore';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';
import { useTelemetryStore } from '@/store/telemetryStore';
import { useConceptStore } from '@/store/conceptStore';
import { getParagraphById } from '@/utils/paragraphUtils';

export function useChatbot() {
  const sendMessage = async (text: string): Promise<void> => {
    const store = useChatbotStore.getState();

    // Add user message
    store.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    store.setIsTyping(true);

    // Build context
    const articleTitle = localStorage.getItem('last_article_title') || 'Unknown article';
    const activePId = useTelemetryStore.getState().activeParagraphId;
    const activeParagraph = activePId ? getParagraphById(activePId) : null;
    const paragraphText = activeParagraph?.text?.slice(0, 300) || '';
    const conceptState = useConceptStore.getState();
    const struggledTerms = conceptState.struggledTerms.slice(-3);
    const lastMessages = store.messages.slice(-5).map(m => ({
      role: m.role,
      content: m.content,
    }));

    const context = [
      `Article: ${articleTitle}`,
      paragraphText ? `Current paragraph: ${paragraphText}...` : '',
      struggledTerms.length ? `Student struggled with: ${struggledTerms.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context,
          history: lastMessages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Chat API error');

      const data = await res.json();
      const response = data.response || data.data?.response || "I couldn't process that. Try again.";

      useChatbotStore.getState().addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const errMsg = err?.name === 'AbortError'
        ? "Response timed out. Try a shorter question."
        : "I'm having trouble connecting. Try again.";

      useChatbotStore.getState().addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: errMsg,
        timestamp: Date.now(),
      });
    } finally {
      useChatbotStore.getState().setIsTyping(false);
    }
  };

  return { sendMessage };
}
