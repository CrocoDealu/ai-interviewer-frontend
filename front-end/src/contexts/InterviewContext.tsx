import React, { createContext, useContext, useState } from 'react';
import { InterviewSetup, InterviewSession, Message } from '@/types';
import { deepSeekService, DeepSeekMessage } from '@/services/deepseekApi';
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
    const session: InterviewSession = {
      id: Date.now().toString(),
      setup,
      messages: [],
      startTime: new Date(),
    };
    setCurrentSession(session);

    setIsAiResponding(true);
    try {
      const initialPrompt = "Please introduce yourself and start the interview.";
      const aiResponse = await deepSeekService.sendMessage(
        [{ role: 'user', content: initialPrompt }],
        setup
      );
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setCurrentSession(prev => ({
        ...prev!,
        messages: [aiMessage],
      }));

      // Speak the initial message if voice is enabled
      if (isVoiceEnabled) {
        await speakMessage(aiResponse);
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

    // Generate AI response for user messages
    if (sender === 'user') {
      setIsAiResponding(true);
      try {
        // Convert session messages to DeepSeek format
        const conversationHistory: DeepSeekMessage[] = [
          ...currentSession.messages.map(msg => ({
            role: msg.sender === 'ai' ? 'assistant' as const : 'user' as const,
            content: msg.content,
          })),
          { role: 'user' as const, content },
        ];

        const aiResponse = await deepSeekService.sendMessage(
          conversationHistory,
          currentSession.setup
        );
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
        };

        setCurrentSession(prev => ({
          ...prev!,
          messages: [...prev!.messages, aiMessage],
        }));

        if (isVoiceEnabled) {
          await speakMessage(aiResponse);
        }
      } catch (error) {
        console.error('Error generating AI response:', error);
        toast.error('Failed to get AI response. Please try again.');
        
        // Add fallback message
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I apologize, but I'm having trouble responding right now. Could you please repeat your last point?",
          sender: 'ai',
          timestamp: new Date(),
        };

        setCurrentSession(prev => ({
          ...prev!,
          messages: [...prev!.messages, fallbackMessage],
        }));
      } finally {
        setIsAiResponding(false);
      }
    }
  };

  const endInterview = () => {
    if (!currentSession) return;

    const endTime = new Date();
    const feedback = {
      confidenceScore: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        'Clear communication skills',
        'Good problem-solving approach',
        'Relevant experience mentioned',
      ],
      improvements: [
        'Provide more specific examples',
        'Show more enthusiasm',
        'Ask thoughtful questions',
      ],
      overallRating: Math.floor(Math.random() * 2) + 4, // 4-5
      detailedFeedback: {
        communication: Math.floor(Math.random() * 30) + 70,
        technicalKnowledge: Math.floor(Math.random() * 30) + 70,
        problemSolving: Math.floor(Math.random() * 30) + 70,
        culturalFit: Math.floor(Math.random() * 30) + 70,
      },
    };

    setCurrentSession(prev => ({
      ...prev!,
      endTime,
      feedback,
    }));

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
    console.log("Starting voice input");
    if (!speechService.isSpeechRecognitionSupported()) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setIsListening(true);
      const transcript = await speechService.startListening();
      
      if (transcript.trim()) {
        await addMessage(transcript, 'user');
      }
    } catch (error) {
      console.error('Speech recognition error:', error);
      if (error instanceof Error && error.message !== 'No speech detected') {
        toast.error(`Voice input failed: ${error.message}`);
      }
    } finally {
      setIsListening(false);
    }
  };

  const stopVoiceInput = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
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