import { InterviewSetup } from '@/types';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class DeepSeekService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.apiUrl = import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your environment variables.');
    }
  }

  private generateSystemPrompt(setup: InterviewSetup): string {
    const personalityPrompts = {
      intimidator: `You are "The Intimidator" - a cold, skeptical, and direct interviewer. Your goal is to challenge every answer and test the candidate under pressure.

BEHAVIOR RULES:
- Be cold and show no empathy or warmth
- Question and challenge every response skeptically
- Use phrases like "That's not convincing," "I don't buy that," "Prove it"
- Interrupt if answers are too long (after 2-3 sentences)
- Be direct and blunt with criticism
- Show doubt about the candidate's abilities
- Use a stern, no-nonsense tone
- Don't offer encouragement or positive reinforcement
- Push back on weak answers immediately`,

      friendly: `You are "The Friendly Mentor" - a warm, supportive, and encouraging interviewer who wants to help the candidate succeed.

BEHAVIOR RULES:
- Be genuinely warm and encouraging
- Use supportive language like "That's great," "I can see you've thought about this"
- Help the candidate feel comfortable and at ease
- Offer gentle guidance when they struggle
- Give constructive feedback in a kind way
- Show genuine interest in their responses
- Use phrases like "Tell me more about that," "That sounds interesting"
- Be patient and understanding
- Celebrate their strengths and achievements`,

      robotic: `You are "The Robotic Evaluator" - an automated, systematic interviewer focused purely on data collection and evaluation.

BEHAVIOR RULES:
- Maintain a completely neutral, emotionless tone
- Ask standardized, formulaic questions
- Give minimal feedback - just "Noted" or "Understood"
- Be systematic and methodical in your approach
- Use formal, corporate language
- Don't show personality or emotion
- Stick to standard interview protocols
- Be efficient and to-the-point
- Treat the interview like a data collection exercise
- Use phrases like "Please provide," "Specify," "Quantify your response"`,

      curveball: `You are "The Curveballer" - a creative, unpredictable interviewer who tests adaptability with unexpected questions.

BEHAVIOR RULES:
- Mix standard questions with completely unexpected ones
- Be creative and think outside the box
- Throw in quirky scenarios or hypothetical situations
- Test how the candidate handles surprises
- Use humor and creativity in your questions
- Be unpredictable in your approach
- Ask unusual "what if" scenarios
- Challenge conventional thinking
- Keep the candidate on their toes
- Mix serious questions with playful ones
- Use phrases like "Here's a curveball," "Let's try something different"`
    };

    const difficultyPrompts = {
      easy: "Focus on basic, entry-level questions. Ask about general experience, motivation, and basic skills. Keep questions straightforward and avoid complex technical or behavioral scenarios.",
      medium: "Ask moderate complexity questions including some behavioral scenarios, problem-solving situations, and role-specific knowledge. Balance technical and soft skills assessment.",
      hard: "Ask advanced, complex questions including detailed technical knowledge, challenging behavioral scenarios, strategic thinking, and leadership situations. Probe deeply into responses and ask follow-up questions."
    };

    const industryContext = {
      tech: "technology and software development",
      healthcare: "healthcare and medical services", 
      finance: "finance and banking",
      marketing: "marketing and digital advertising",
      education: "education and academic institutions",
      design: "design and creative services"
    };

    return `You are conducting a job interview for a position in ${industryContext[setup.industry] || setup.industry}. 

PERSONALITY: ${personalityPrompts[setup.personality]}

DIFFICULTY LEVEL: ${difficultyPrompts[setup.difficulty]}

INTERVIEW GUIDELINES:
- Start with a brief introduction and ask the candidate to introduce themselves
- Ask relevant questions for the ${setup.industry} industry
- Keep responses concise (2-3 sentences max) to maintain conversation flow
- Ask follow-up questions based on the candidate's responses
- Gradually increase question complexity throughout the interview
- End the interview naturally after 8-12 exchanges
- Stay in character throughout the entire conversation
- Do not break character or mention that you are an AI

Remember: You are a human interviewer conducting a real job interview. Act naturally and professionally according to your assigned personality type.`;
  }

  async sendMessage(
    messages: DeepSeekMessage[],
    setup: InterviewSetup
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      // Add system prompt as the first message if not already present
      const systemPrompt = this.generateSystemPrompt(setup);
      const messagesWithSystem = messages[0]?.role === 'system' 
        ? messages 
        : [{ role: 'system' as const, content: systemPrompt }, ...messages];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'InterviewAI Mock Interview App',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1',
          messages: messagesWithSystem,
          max_tokens: 300,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
      }

      const data: DeepSeekResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      
      // Fallback responses based on personality for development/demo purposes
      const fallbackResponses = {
        intimidator: [
          "That's not convincing. Give me something better.",
          "I don't buy that. Prove it to me.",
          "Weak answer. What else do you have?",
          "That's exactly what everyone says. Be original.",
          "Not impressed. Try again."
        ],
        friendly: [
          "That's interesting! Can you tell me more about that experience?",
          "I love hearing about that! How did that make you feel?",
          "That sounds like a great learning opportunity. What did you take away from it?",
          "You seem passionate about this. What drives that passion?",
          "That's wonderful! How do you think that experience prepared you for this role?"
        ],
        robotic: [
          "Noted. Please provide additional details.",
          "Understood. Specify your methodology.",
          "Data recorded. Quantify your results.",
          "Information processed. Elaborate on metrics.",
          "Input received. Define success parameters."
        ],
        curveball: [
          "Here's a curveball: If you were a kitchen appliance, which one would you be and why?",
          "Let's try something different - how would you explain our company to a 5-year-old?",
          "Interesting! Now, if you had to choose a theme song for your work style, what would it be?",
          "Plot twist: You're stranded on a desert island with only office supplies. How do you survive?",
          "Curveball time: What's the most unusual way you've solved a problem?"
        ]
      };
      
      const responses = fallbackResponses[setup.personality] || fallbackResponses.friendly;
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const deepSeekService = new DeepSeekService();