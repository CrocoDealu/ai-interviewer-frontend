import React, { createContext, useContext, useState } from 'react';
import { InterviewSetup, InterviewSession, Message } from '@/types';

interface InterviewContextType {
  currentSetup: InterviewSetup | null;
  setCurrentSetup: (setup: InterviewSetup) => void;
  currentSession: InterviewSession | null;
  startInterview: (setup: InterviewSetup) => void;
  addMessage: (content: string, sender: 'ai' | 'user') => void;
  endInterview: () => void;
  clearSession: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [currentSetup, setCurrentSetup] = useState<InterviewSetup | null>(null);
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);

  const startInterview = (setup: InterviewSetup) => {
    const session: InterviewSession = {
      id: Date.now().toString(),
      setup,
      messages: [],
      startTime: new Date(),
    };
    setCurrentSession(session);
    
    // Add initial AI message
    setTimeout(() => {
      addMessage(
        `Hello! I'm your ${setup.personality} interviewer for today. We'll be conducting a ${setup.difficulty} level interview for a ${setup.industry} position. Are you ready to begin?`,
        'ai'
      );
    }, 1000);
  };

  const addMessage = (content: string, sender: 'ai' | 'user') => {
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

    // Simulate AI response for user messages
    if (sender === 'user') {
      setTimeout(() => {
        const aiResponses = [
          "That's an interesting perspective. Can you elaborate on that?",
          "Tell me more about how you handled that situation.",
          "What would you do differently if you faced a similar challenge again?",
          "How do you think this experience prepared you for this role?",
          "Can you walk me through your thought process on that decision?",
        ];
        const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: randomResponse,
          sender: 'ai',
          timestamp: new Date(),
        };

        setCurrentSession(prev => ({
          ...prev!,
          messages: [...prev!.messages, aiMessage],
        }));
      }, 1500);
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
  };

  const clearSession = () => {
    setCurrentSession(null);
    setCurrentSetup(null);
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