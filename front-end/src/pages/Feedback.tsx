import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  TrendingUp,
  MessageSquare,
  Brain,
  Users,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInterview } from '@/contexts/InterviewContext';

export function Feedback() {
  const navigate = useNavigate();
  const { currentSession, clearSession } = useInterview();

  // Redirect if no session or no feedback
  React.useEffect(() => {
    if (!currentSession || !currentSession.feedback) {
      navigate('/onboarding');
    }
  }, [currentSession, navigate]);

  if (!currentSession || !currentSession.feedback) {
    return null;
  }

  const { feedback, setup, messages, startTime, endTime } = currentSession;
  const duration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : 0;

  const handleTryAgain = () => {
    clearSession();
    navigate('/onboarding');
  };

  const handleDownloadTranscript = () => {
    const transcript = messages.map(msg => 
      `${msg.sender === 'ai' ? 'Interviewer' : 'You'} (${msg.timestamp.toLocaleTimeString()}): ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Interview Complete! 🎉</h1>
          <p className="text-muted-foreground">
            Here's your detailed performance analysis and feedback
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="flex items-center p-6">
              <Award className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{feedback.confidenceScore}%</p>
                <p className="text-sm text-muted-foreground">Confidence Score</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <MessageSquare className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{messages.length}</p>
                <p className="text-sm text-muted-foreground">Messages Exchanged</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{duration}m</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <Brain className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{feedback.overallRating}/5</p>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Overall Score */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Overall Performance</CardTitle>
                <CardDescription>
                  Your confidence and communication assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(feedback.confidenceScore)}`}>
                    {feedback.confidenceScore}%
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {getScoreDescription(feedback.confidenceScore)}
                  </Badge>
                </div>
                <Progress value={feedback.confidenceScore} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Based on your communication skills, confidence level, and overall presentation
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Detailed Scores */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Detailed Assessment</CardTitle>
                <CardDescription>
                  Breakdown of your performance across key areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(feedback.detailedFeedback).map(([category, score]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  Strengths
                </CardTitle>
                <CardDescription>
                  Areas where you performed well
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Improvements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  Areas for Improvement
                </CardTitle>
                <CardDescription>
                  Suggestions to enhance your performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Interview Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Interview Summary</CardTitle>
              <CardDescription>
                Details about your practice session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Setup</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Industry: {setup.industry}</p>
                    <p>Difficulty: {setup.difficulty}</p>
                    <p>Interviewer: {setup.personality}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Timing</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Started: {startTime.toLocaleTimeString()}</p>
                    <p>Ended: {endTime?.toLocaleTimeString()}</p>
                    <p>Duration: {duration} minutes</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Activity</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Questions Asked: {Math.floor(messages.length / 2)}</p>
                    <p>Responses Given: {Math.ceil(messages.length / 2)}</p>
                    <p>Avg Response Time: ~45s</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button variant="outline" onClick={handleDownloadTranscript}>
            <Download className="mr-2 h-4 w-4" />
            Download Transcript
          </Button>
          <Button onClick={handleTryAgain}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Practice Again
          </Button>
        </motion.div>
      </div>
    </div>
  );
}