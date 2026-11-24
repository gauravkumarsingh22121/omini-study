import { useState, useEffect, useCallback, useRef } from 'react';
import { transcribeAudioWithWhisper } from '../lib/gemini';

export function useWebSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  // Web Speech references
  const recognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);

  // MediaRecorder references (Universal fallback for Brave, Firefox, Edge, Safari)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const isRecordingFallbackRef = useRef(false);

  // Initialize Web Speech API if supported by browser
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = navigator.language || 'en-US';

        recognition.onstart = () => {
          console.log("Speech recognition started... Speak now!");
          setIsListening(true);
        };

        recognition.onresult = (e) => {
          const currentIndex = e.resultIndex;
          const recognizedText = e.results[currentIndex][0].transcript;
          console.log("Recognized speech:", recognizedText);

          if (recognizedText) {
            setTranscript(recognizedText);
            if (onResultCallbackRef.current) {
              onResultCallbackRef.current(recognizedText);
            }
          }
        };

        recognition.onerror = (e) => {
          console.warn("Speech recognition error:", e.error);
          setIsListening(false);
          // If error is network (e.g. Brave blocking Google), automatically fall back to MediaRecorder + Whisper
          if (e.error === 'network' || e.error === 'service-not-allowed') {
            console.log("Switching to cross-browser MediaRecorder + Whisper fallback...");
            startMediaRecorderFallback();
          } else if (e.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone permissions in your browser.');
          }
        };

        recognition.onend = () => {
          console.log("Speech recognition ended.");
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("SpeechRecognition init error:", err);
      }
    } else {
      // Browser like Firefox doesn't support webkitSpeechRecognition, but supports MediaRecorder
      setIsSupported(Boolean(navigator.mediaDevices?.getUserMedia));
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      stopMediaStream();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopMediaStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Cross-browser MediaRecorder recording fallback (Works in Brave, Firefox, etc.)
  const startMediaRecorderFallback = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Your browser does not support microphone recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsListening(false);
        isRecordingFallbackRef.current = false;
        stopMediaStream();

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];

        if (audioBlob.size > 0) {
          try {
            setIsTranscribing(true);
            const text = await transcribeAudioWithWhisper(audioBlob);
            if (text) {
              setTranscript(text);
              if (onResultCallbackRef.current) {
                onResultCallbackRef.current(text);
              }
            }
          } catch (transcribeErr) {
            console.error("Transcription error:", transcribeErr);
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingFallbackRef.current = true;
      setIsListening(true);
      console.log("MediaRecorder recording active (Brave/universal fallback)... Speak now!");
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      setIsListening(false);
      isRecordingFallbackRef.current = false;
      if (err.name === 'NotAllowedError') {
        alert("Microphone permission was denied. Please allow microphone access in your browser.");
      }
    }
  };

  const startListening = useCallback((callback = null) => {
    if (callback) {
      onResultCallbackRef.current = callback;
    }

    // Check if we are in Brave or a browser without webkitSpeechRecognition
    const isBrave = Boolean(window.navigator.brave && window.navigator.brave.isBrave);
    const hasWebSpeech = Boolean(recognitionRef.current);

    // If in Brave or no Web Speech API, use MediaRecorder + Whisper directly for instant success
    if (isBrave || !hasWebSpeech) {
      startMediaRecorderFallback();
      return;
    }

    // Otherwise try Web Speech first
    try {
      recognitionRef.current.abort();
    } catch {}

    try {
      recognitionRef.current.start();
    } catch (err) {
      if (err.name !== 'InvalidStateError') {
        console.warn("Could not start Web Speech, falling back to MediaRecorder:", err);
        startMediaRecorderFallback();
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);

    // Stop Web Speech if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    // Stop MediaRecorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 1;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const preferredFemaleVoice = voices.find(v => 
      v.name.includes("Samantha") ||
      v.name.includes("Victoria") ||
      v.name.includes("Google UK English Female") ||
      v.name.includes("Google US English") ||
      v.name.includes("Karen") ||
      v.name.includes("Moira") ||
      (v.lang.startsWith("en") && (v.name.includes("Female") || v.name.includes("Woman")))
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredFemaleVoice) {
      utterance.voice = preferredFemaleVoice;
      utterance.lang = preferredFemaleVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isListening,
    isSpeaking,
    isTranscribing,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    isSupported
  };
}
