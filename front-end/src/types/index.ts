export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface InterviewSetup {
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  personality: 'intimidator' | 'friendly' | 'robotic' | 'curveball';
  role?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

export interface InterviewSession {
  id: string;
  setup: InterviewSetup;
  messages: Message[];
  startTime: Date;
  endTime?: Date;
  feedback?: InterviewFeedback;
}

export interface InterviewFeedback {
  confidenceScore: number;
  strengths: string[];
  improvements: string[];
  overallRating: number;
  detailedFeedback: {
    communication: number;
    technicalKnowledge: number;
    problemSolving: number;
    culturalFit: number;
  };
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  roles: string[];
}