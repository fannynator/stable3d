let voicesLoaded = false;
let ruVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      ruVoice = voices.find(v => v.lang.startsWith("ru")) || voices[0];
      voicesLoaded = true;
      resolve(ruVoice);
      return;
    }
    synth.onvoiceschanged = () => {
      const v = synth.getVoices();
      ruVoice = v.find(voice => voice.lang.startsWith("ru")) || v[0] || null;
      voicesLoaded = true;
      resolve(ruVoice);
    };
  });
}

export async function speak(text: string): Promise<void> {
  const synth = window.speechSynthesis;
  if (!synth) return;

  synth.cancel(); // Stop any current speech

  if (!voicesLoaded) await loadVoices();
  else {
    const voices = synth.getVoices();
    ruVoice = voices.find(v => v.lang.startsWith("ru")) || voices[0] || null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ru-RU";
  utterance.rate = 0.9;   // Slightly slower for kids
  utterance.pitch = 1.1;  // Slightly higher, friendlier
  utterance.volume = 0.9;
  if (ruVoice) utterance.voice = ruVoice;

  synth.speak(utterance);
}

export function stopSpeech(): void {
  window.speechSynthesis?.cancel();
}
