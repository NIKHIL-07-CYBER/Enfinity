// DONE: Task 5b — Chatbot hook (fixed with fallback and better error handling)
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

      if (!res.ok) {
        // Try to get error details for better messaging
        let errMsg = `Server error (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (import.meta.env.DEV) console.log('[Chat] Response:', data);
      const response = data.data?.response || data.response || "I couldn't process that. Try again.";

      useChatbotStore.getState().addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      let errMsg: string;

      if (err?.name === 'AbortError') {
        errMsg = "Response timed out. Try a shorter question.";
      } else if (err?.message?.includes('fetch') || err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        errMsg = "⚠️ Can't reach the server. Make sure the backend is running on port 3001.";
      } else {
        errMsg = "I'm having trouble connecting. Try again.";
      }

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
