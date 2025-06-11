import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useInterview } from '@/contexts/InterviewContext';
import { InterviewSetup, Industry } from '@/types';

const industries: Industry[] = [
  {
    id: 'tech',
    name: 'Technology',
    description: 'Software engineering, data science, product management',
    icon: '💻',
    roles: ['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical professionals, healthcare administration',
    icon: '🏥',
    roles: ['Physician', 'Nurse', 'Healthcare Administrator', 'Medical Researcher'],
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Investment banking, consulting, financial analysis',
    icon: '💰',
    roles: ['Investment Banker', 'Financial Analyst', 'Consultant', 'Accountant'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Digital marketing, brand management, sales',
    icon: '📈',
    roles: ['Marketing Manager', 'Brand Manager', 'Sales Representative', 'Digital Marketer'],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Teaching, academic research, administration',
    icon: '🎓',
    roles: ['Teacher', 'Professor', 'Academic Researcher', 'Education Administrator'],
  },
  {
    id: 'design',
    name: 'Design',
    description: 'UX/UI design, graphic design, creative roles',
    icon: '🎨',
    roles: ['UX Designer', 'UI Designer', 'Graphic Designer', 'Creative Director'],
  },
];

const difficulties = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Basic questions, entry-level positions',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Moderate complexity, mid-level positions',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Advanced questions, senior positions',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
];

const personalities = [
  {
    id: 'intimidator',
    name: 'The Intimidator',
    description: 'Challenge the user\'s answers. Be cold, skeptical, and direct. Show no empathy.',
    icon: '🔥',
    color: 'border-red-200 hover:border-red-400 dark:border-red-800 dark:hover:border-red-600',
  },
  {
    id: 'friendly',
    name: 'The Friendly Mentor',
    description: 'Be warm, supportive, and encouraging. Help the user feel comfortable.',
    icon: '😊',
    color: 'border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600',
  },
  {
    id: 'robotic',
    name: 'The Robotic Evaluator',
    description: 'Act like an automated recruiter. Neutral tone. Ask standardized technical questions.',
    icon: '🤖',
    color: 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600',
  },
  {
    id: 'curveball',
    name: 'The Curveballer',
    description: 'Be creative and unpredictable. Throw in quirky or unusual questions to test adaptability.',
    icon: '🎭',
    color: 'border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600',
  },
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>('');
  const [selectedPersonality, setSelectedPersonality] = useState<'intimidator' | 'friendly' | 'robotic' | 'curveball' | ''>('');
  
  const navigate = useNavigate();
  const { setCurrentSetup } = useInterview();

  // Scroll to top when component mounts or step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedIndustry !== '';
      case 2:
        return selectedDifficulty !== '';
      case 3:
        return selectedPersonality !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Set up the interview configuration and navigate to start screen
      const setup: InterviewSetup = {
        industry: selectedIndustry,
        difficulty: selectedDifficulty as 'easy' | 'medium' | 'hard',
        personality: selectedPersonality as 'intimidator' | 'friendly' | 'robotic' | 'curveball',
      };
      setCurrentSetup(setup);
      navigate('/interview');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Set Up Your Mock Interview</h1>
          <p className="text-muted-foreground">
            Customize your interview experience to match your goals
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Industry</CardTitle>
                <CardDescription>
                  Select the industry that matches your target role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {industries.map((industry) => (
                    <div
                      key={industry.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedIndustry === industry.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedIndustry(industry.id)}
                    >
                      {selectedIndustry === industry.id && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{industry.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{industry.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {industry.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {industry.roles.slice(0, 2).map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                            {industry.roles.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{industry.roles.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Difficulty Level</CardTitle>
                <CardDescription>
                  Select the complexity level that matches your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {difficulties.map((difficulty) => (
                    <div
                      key={difficulty.id}
                      className={`relative p-6 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedDifficulty === difficulty.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDifficulty(difficulty.id as 'easy' | 'medium' | 'hard')}
                    >
                      {selectedDifficulty === difficulty.id && (
                        <div className="absolute top-4 right-4">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex items-center space-x-4">
                        <Badge className={difficulty.color}>
                          {difficulty.name}
                        </Badge>
                        <div>
                          <h3 className="font-semibold">{difficulty.name} Level</h3>
                          <p className="text-sm text-muted-foreground">
                            {difficulty.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Interviewer Personality</CardTitle>
                <CardDescription>
                  Select the interviewer style you want to practice with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {personalities.map((personality) => (
                    <div
                      key={personality.id}
                      className={`relative p-6 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedPersonality === personality.id
                          ? 'border-primary bg-primary/5'
                          : `border-border ${personality.color}`
                      }`}
                      onClick={() => setSelectedPersonality(personality.id as 'intimidator' | 'friendly' | 'robotic' | 'curveball')}
                    >
                      {selectedPersonality === personality.id && (
                        <div className="absolute top-4 right-4">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="text-3xl">{personality.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{personality.name}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {personality.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={handleBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button onClick={handleNext} disabled={!canProceed()}>
            {currentStep === totalSteps ? 'Continue to Interview' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}