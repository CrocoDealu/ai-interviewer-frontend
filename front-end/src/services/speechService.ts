class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
    }
  }

  private processText(text: string): string {
    // Remove emojis
    text = text.replace(/[\u{1F600}-\u{1F6FF}|\u{1F900}-\u{1F9FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{1F300}-\u{1F5FF}|\u{1F700}-\u{1F77F}|\u{1F780}-\u{1F7FF}|\u{1F800}-\u{1F8FF}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{200D}|\u{2B50}|\u{2B55}|\u{231A}|\u{231B}|\u{23E9}-\u{23EF}|\u{23F0}|\u{23F3}|\u{25B6}|\u{25C0}|\u{25FB}-\u{25FE}|\u{2614}|\u{2615}|\u{2648}-\u{2653}|\u{267F}|\u{2693}|\u{26A1}|\u{26AA}-\u{26AB}|\u{26BD}-\u{26BE}|\u{26C4}-\u{26C5}|\u{26CE}|\u{26D4}|\u{26EA}|\u{26F2}-\u{26F3}|\u{26F5}|\u{26FA}|\u{26FD}|\u{2705}|\u{2728}|\u{274C}|\u{274E}|\u{2753}-\u{2755}|\u{2757}|\u{2764}|\u{2795}-\u{2797}|\u{27B0}|\u{27BF}|\u{2934}-\u{2935}|\u{2B06}-\u{2B07}|\u{2B1B}-\u{2B1C}|\u{2B50}|\u{2B55}|\u{3030}|\u{303D}|\u{3297}|\u{3299}|\u{1F004}|\u{1F0CF}]/gu, '');
    
    // Remove markdown formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    text = text.replace(/\*(.*?)\*/g, '$1'); // Italic
    text = text.replace(/`(.*?)`/g, '$1'); // Code
    text = text.replace(/#{1,6}\s/g, ''); // Headers
    
    // Clean up special characters but keep punctuation
    text = text.replace(/[^\w\s,.!?'":—-]/g, ' ');
    
    // Clean up multiple spaces
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // Text-to-Speech functionality
  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const processedText = this.processText(text);

      if (!processedText.trim()) {
        resolve();
        return;
      }

      this.currentUtterance = new SpeechSynthesisUtterance(processedText);
      
      this.currentUtterance.rate = options.rate || 0.9;
      this.currentUtterance.pitch = options.pitch || 1;
      this.currentUtterance.volume = options.volume || 0.8;

      // Wait for voices to load
      const setVoiceAndSpeak = () => {
        const voices = this.synthesis.getVoices();
        
        if (voices.length > 0) {
          // Try to find a good English voice
          const preferredVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.includes('Natural') || voice.name.includes('Neural') || voice.name.includes('Premium'))
          ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

          if (preferredVoice && this.currentUtterance) {
            this.currentUtterance.voice = preferredVoice;
          }
        }

        if (this.currentUtterance) {
          this.currentUtterance.onend = () => {
            this.currentUtterance = null;
            resolve();
          };
          
          this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.currentUtterance = null;
            reject(new Error(`Speech synthesis error: ${event.error}`));
          };

          this.synthesis.speak(this.currentUtterance);
        }
      };

      // Check if voices are already loaded
      if (this.synthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        // Wait for voices to load
        this.synthesis.onvoiceschanged = setVoiceAndSpeak;
        // Fallback timeout
        setTimeout(setVoiceAndSpeak, 100);
      }
    });
  }

  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;
      let finalTranscript = '';
      let timeoutId: NodeJS.Timeout;

      const resetTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          this.stopListening();
        }, 10000);
      };

      this.recognition.onstart = () => {
        resetTimeout();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        resetTimeout();
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (timeoutId) clearTimeout(timeoutId);

        if (finalTranscript.trim()) {
          resolve(finalTranscript.trim());
        } else {
          reject(new Error('No speech detected. Please try speaking clearly.'));
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        this.isListening = false;
        if (timeoutId) clearTimeout(timeoutId);
        
        let errorMessage = 'Speech recognition error';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        this.isListening = false;
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error('Failed to start speech recognition. Please try again.'));
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      console.log('Stopping speech recognition...');
      this.recognition.stop();
    }
  }

  isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  isTextToSpeechSupported(): boolean {
    return !!this.synthesis && 'speechSynthesis' in window;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }
}

export const speechService = new SpeechService();

// Export types for better TypeScript support
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}