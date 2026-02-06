import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SpeakOptions {
  lang?: string;
  voiceURI?: string | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
}

interface UseSpeechSynthesisResult {
  isSupported: boolean;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (text: string, options?: SpeakOptions) => boolean;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

export const useSpeechSynthesis = (): UseSpeechSynthesisResult => {
  const isSupported = useMemo(() => {
    return Boolean(
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    );
  }, []);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const loadVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      setVoices(nextVoices);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.pause();
    setIsSpeaking(false);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.resume();
    setIsSpeaking(true);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!isSupported) {
        return false;
      }

      const normalizedText = text.trim();
      if (!normalizedText) {
        return false;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utteranceRef.current = utterance;

      if (options?.lang) {
        utterance.lang = options.lang;
      }

      if (typeof options?.rate === 'number') {
        utterance.rate = options.rate;
      }

      if (typeof options?.pitch === 'number') {
        utterance.pitch = options.pitch;
      }

      if (typeof options?.volume === 'number') {
        utterance.volume = options.volume;
      }

      if (options?.voiceURI) {
        const selected = voices.find((v) => v.voiceURI === options.voiceURI);
        if (selected) {
          utterance.voice = selected;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
      return true;
    },
    [isSupported, voices]
  );

  useEffect(() => {
    return () => {
      if (!isSupported) {
        return;
      }
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    speak,
    cancel,
    pause,
    resume,
  };
};
