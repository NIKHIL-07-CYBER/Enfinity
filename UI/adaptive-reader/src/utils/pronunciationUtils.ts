// DONE: Task 3d — Pronunciation utilities
export async function getPhonetic(word: string): Promise<string> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return word;
    const data = await res.json();
    const phonetic = data[0]?.phonetics?.find((p: any) => p.text)?.text || '';
    return phonetic || word;
  } catch {
    return word;
  }
}

export function speakText(text: string, lang: string = 'en-US'): void {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}
