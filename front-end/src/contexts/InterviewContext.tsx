import React, {createContext, useContext, useEffect, useState} from 'react';
import { InterviewSetup, InterviewSession, Message } from '@/types';
import { apiService } from '@/services/api';
import { speechService } from '@/services/speechService';
import { toast } from 'sonner';

interface InterviewContextType {
  currentSetup: InterviewSetup | null;
  setCurrentSetup: (setup: InterviewSetup) => void;
  currentSession: InterviewSession | null;
  startInterview: (setup: InterviewSetup) => void;
  addMessage: (content: string, sender: 'ai' | 'user') => Promise<void>;
  endInterview: () => void;
  clearSession: () => void;
  isAiResponding: boolean;
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: (enabled: boolean) => void;
  isSpeaking: boolean;
  isListening: boolean;
  startVoiceInput: () => Promise<void>;
  stopVoiceInput: () => void;
  speakMessage: (message: string) => Promise<void>;
  stopSpeaking: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [currentSetup, setCurrentSetup] = useState<InterviewSetup | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startInterview = async (setup: InterviewSetup) => {
    setIsVoiceEnabled(true);
    setIsAiResponding(true);
    try {
      const response = await apiService.startInterview(setup);

      const session: InterviewSession = {
        id: response.interview.id,
        setup: response.interview.setup,
        messages: response.interview.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        startTime: new Date(response.interview.startTime),
      };

      setCurrentSession(session);

      if (session.messages.length > 0) {
        const lastMessage = session.messages[session.messages.length - 1];
        if (lastMessage.sender === 'ai') {
          await speakMessage(lastMessage.content);
        }
      }
    } catch (error) {
      console.error('Error generating initial AI message:', error);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setIsAiResponding(false);
    }
  };

  const addMessage = async (content: string, sender: 'ai' | 'user') => {
    if (!currentSession) return;

    if (sender === 'user') {
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        sender,
        timestamp: new Date(),
      };
      setCurrentSession(prev => ({
        ...prev!,
        messages: [...prev!.messages, userMessage],
      }));

      setIsAiResponding(true);
      try {
        const response = await apiService.addMessage(currentSession.id, content, sender);

        if (response.aiMessage) {
          const aiMessage: Message = {
            ...response.aiMessage,
            timestamp: new Date(response.aiMessage.timestamp),
          };
          setCurrentSession(prev => ({
            ...prev!,
            messages: [...prev!.messages, aiMessage],
          }));

          if (isVoiceEnabled) {
            await speakMessage(aiMessage.content);
          }
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        toast.error('Failed to get AI response. Please try again.');
      } finally {
        setIsAiResponding(false);
      }
    } else {
      // For AI messages (shouldn't happen in normal flow)
      const message: Message = {
        id: Date.now().toString(),
        content,
        sender,
        timestamp: new Date(),
      };

      setCurrentSession(prev => ({
        ...prev!,
        messages: [...prev!.messages, message],
      }));
    }
  };

  const endInterview = () => {
    if (!currentSession) return;
    stopSpeaking();
    apiService.endInterview(currentSession.id)
      .then(response => {
        setCurrentSession(prev => ({
          ...prev!,
          endTime: new Date(response.interview.endTime),
          feedback: response.interview.feedback,
        }));
      })
      .catch(error => {
        console.error('Error ending interview:', error);
        toast.error('Failed to end interview properly');

        // Fallback to local end
        setCurrentSession(prev => ({
          ...prev!,
          endTime: new Date(),
          feedback: {
            confidenceScore: 75,
            strengths: ['Good communication'],
            improvements: ['Practice more'],
            overallRating: 4,
            detailedFeedback: {
              communication: 75,
              technicalKnowledge: 75,
              problemSolving: 75,
              culturalFit: 75,
            },
          },
        }));
      });

    // Stop any ongoing speech
    stopSpeaking();
    stopVoiceInput();
  };

  const clearSession = () => {
    setCurrentSession(null);
    setCurrentSetup(null);
    stopSpeaking();
    stopVoiceInput();
  };

  const startVoiceInput = async () => {
    if (!speechService.isSpeechRecognitionSupported()) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      setIsListening(true);
      const transcript = await speechService.startListening();
      setIsListening(false);
      if (transcript.trim()) {
        await addMessage(transcript, 'user');
      }

    } catch (error) {
      console.error('Speech recognition error:', error);
      if (error instanceof Error && !error.message.includes('No speech detected')) {
        toast.error(error.message);
      }
    }
  };

  const stopVoiceInput = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setIsVoiceEnabled(false);
    }
  };

  const speakMessage = async (message: string) => {
    if (!speechService.isTextToSpeechSupported()) {
      toast.error('Text-to-speech is not supported in your browser');
      return;
    }

    try {
      setIsSpeaking(true);
      await speechService.speak(message, {
        rate: 0.9,
        pitch: 1,
        volume: 0.8,
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error('Failed to speak message');
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    speechService.stopSpeaking();
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (!isSpeaking && isVoiceEnabled && !isAiResponding && !isListening) {
      (async () => {
        console.log("Starting voice input in use effect");
        await startVoiceInput();
      })();
    }
  }, [isAiResponding, isListening, isSpeaking, isVoiceEnabled, startVoiceInput]);

  useEffect(() => {
    console.log("Is listening changed:", isListening);
  }, [isListening]);

  return (
    <InterviewContext.Provider value={{
      currentSetup,
      setCurrentSetup,
      currentSession,
      startInterview,
      addMessage,
      endInterview,
      clearSession,
      isAiResponding,
      isVoiceEnabled,
      setIsVoiceEnabled,
      isSpeaking,
      isListening,
      startVoiceInput,
      stopVoiceInput,
      speakMessage,
      stopSpeaking,
    }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}