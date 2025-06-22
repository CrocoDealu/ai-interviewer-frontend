import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Clock, 
  User, 
  Volume2,
  VolumeX,
  Square,
  Loader2,
  Play,
  Camera,
  CameraOff,
  Video,
  VideoOff
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Card } from '@/components/ui/card.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { MessageContent } from '@/components/MessageContent.tsx';
import { useInterview } from '@/contexts/InterviewContext.tsx';
import { Message } from '@/types';
import { speechService } from '@/services/speechService.ts';
import { toast } from 'sonner';
import { apiService } from "@/services/api.ts";

export function Interview() {
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);
  const [message, setMessage] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [hasStarted, setHasStarted] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Camera states
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [hasRequestedCamera, setHasRequestedCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  
  const { 
    currentSetup,
    currentSession, 
    startInterview,
    addMessage, 
    endInterview,
    isAiResponding,
    isVoiceEnabled,
    setIsVoiceEnabled,
    isSpeaking,
    isListening,
    startVoiceInput,
    stopVoiceInput,
    stopSpeaking
  } = useInterview();

  // Scroll to top when component mounts or when hasStarted changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [hasStarted]);

  // Timer effect
  useEffect(() => {
    if (!startTime) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Handle scrolling behavior - but not on initial load
  useEffect(() => {
    if (!currentSession?.messages || currentSession.messages.length === 0) return;
    
    // Skip auto-scroll on the very first message (initial AI greeting)
    if (isInitialLoad && currentSession.messages.length === 1) {
      setIsInitialLoad(false);
      return;
    }
    
    const lastMessage = currentSession.messages[currentSession.messages.length - 1];
    
    // Only auto-scroll for user messages or if explicitly enabled
    if (shouldAutoScroll && (lastMessage.sender === 'user' || !isAiResponding)) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [currentSession?.messages, shouldAutoScroll, isAiResponding, isInitialLoad]);

  // Camera setup effect
  useEffect(() => {
    if (isCameraEnabled && !cameraStream) {
      requestCameraAccess();
    }
  }, [isCameraEnabled]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Detect manual scrolling to disable auto-scroll
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    setShouldAutoScroll(isAtBottom);
  };

  // Redirect if no setup
  useEffect(() => {
    if (!currentSetup) {
      navigate('/onboarding');
    }
  }, [currentSetup, navigate]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (!currentSetup) {
    return null;
  }

  function checkHealth() {
    if (!apiService.healthCheck()) {
      toast.warning('OpenRouter API not configured. Using demo responses.');
      setIsApiHealthy(false);
    } else {
      setIsApiHealthy(true);
    }
  }

  const requestCameraAccess = async () => {
    try {
      setHasRequestedCamera(true);
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast.success('Camera access granted');
    } catch (error) {
      console.error('Camera access error:', error);
      setIsCameraEnabled(false);
      setCameraError('Camera access denied or not available');
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera permission denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera found. Please connect a camera and try again.');
        } else {
          toast.error('Failed to access camera. Please check your camera settings.');
        }
      }
    }
  };

  const handleCameraToggle = async () => {
    if (isCameraEnabled) {
      // Turn off camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCameraEnabled(false);
      toast.info('Camera turned off');
    } else {
      // Turn on camera
      setIsCameraEnabled(true);
    }
  };

  const handleStartInterview = async () => {
    setHasStarted(true);
    setStartTime(new Date());
    setIsInitialLoad(true);
    setShouldAutoScroll(false);
    window.scrollTo(0, 0);
    await startInterview(currentSetup);
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isAiResponding) {
      const messageText = message.trim();
      setMessage('');
      setShouldAutoScroll(true);
      await addMessage(messageText, 'user');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndInterview = () => {
    // Stop camera stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraEnabled(false);
    
    endInterview();
    navigate('/feedback');
  };

  const handleVoiceToggle = () => {
    if (isVoiceEnabled) {
      stopVoiceInput();
      stopSpeaking();
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      await startVoiceInput();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInterviewerInfo = () => {
    const personalityInfo = {
      intimidator: { name: 'The Intimidator', icon: '🔥', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      friendly: { name: 'The Friendly Mentor', icon: '😊', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      robotic: { name: 'The Robotic Evaluator', icon: '🤖', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      curveball: { name: 'The Curveballer', icon: '🎭', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    };
    return personalityInfo[currentSetup.personality] || personalityInfo.friendly;
  };

  const canSendMessage = message.trim() && !isAiResponding && !isListening;
  const interviewer = getInterviewerInfo();

  // Start Screen
  if (!hasStarted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Card className="p-8">
              <div className="mb-6">
                <div className="text-6xl mb-4">{interviewer.icon}</div>
                <h1 className="text-3xl font-bold mb-2">Ready to Start Your Interview?</h1>
                <p className="text-muted-foreground mb-6">
                  You'll be interviewed by <strong>{interviewer.name}</strong> for a{' '}
                  <strong>{currentSetup.difficulty}</strong> level position in{' '}
                  <strong>{currentSetup.industry}</strong>.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-4">
                  <Badge variant="secondary">{currentSetup.industry}</Badge>
                  <Badge variant="secondary">{currentSetup.difficulty}</Badge>
                  <Badge className={interviewer.color}>{interviewer.name}</Badge>
                </div>
                
                {!isApiHealthy && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Demo Mode:</strong> OpenRouter API not configured. The interview will use sample responses.
                    </p>
                  </div>
                )}
              </div>

              <Button 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={handleStartInterview}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Interview
              </Button>

              <div className="mt-6 text-sm text-muted-foreground">
                <p>💡 Tip: Make sure your camera and microphone are working for the best experience</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">{interviewer.icon}</div>
              <span className="font-semibold">{interviewer.name}</span>
              <Badge className={interviewer.color} variant="secondary">
                {currentSetup.personality}
              </Badge>
              {!isApiHealthy && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Demo Mode
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentSetup.industry} • {currentSetup.difficulty}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className="font-mono">{elapsedTime}</span>
            </div>

            <Button variant="destructive" size="sm" onClick={handleEndInterview}>
              <Square className="h-4 w-4 mr-2" />
              End Interview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Video Section - Left Side */}
        <div className="w-1/2 border-r bg-muted/20 p-4 flex flex-col">
          <div className="flex-1 grid grid-rows-2 gap-4">
            {/* AI Camera (Mockup) */}
            <div className="relative">
              <Card className="h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="text-6xl mb-4">{interviewer.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{interviewer.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>AI Interviewer</span>
                  </div>
                  {(isSpeaking || isAiResponding) && (
                    <div className="mt-4 flex items-center space-x-2 text-sm">
                      {isSpeaking && (
                        <>
                          <Volume2 className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600">Speaking...</span>
                        </>
                      )}
                      {isAiResponding && !isSpeaking && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-primary">Thinking...</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* User Camera */}
            <div className="relative">
              <Card className="h-full overflow-hidden">
                {isCameraEnabled && cameraStream ? (
                  <div className="relative h-full">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                        You
                      </span>
                    </div>
                    {(isListening || isVoiceEnabled) && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center space-x-2 bg-black/50 px-2 py-1 rounded">
                          {isListening ? (
                            <>
                              <Mic className="h-4 w-4 text-red-400" />
                              <span className="text-white text-sm">Listening</span>
                            </>
                          ) : isVoiceEnabled ? (
                            <>
                              <Mic className="h-4 w-4 text-green-400" />
                              <span className="text-white text-sm">Voice Ready</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/50">
                    <div className="text-4xl mb-4">
                      {cameraError ? <CameraOff className="h-16 w-16 text-muted-foreground" /> : <Camera className="h-16 w-16 text-muted-foreground" />}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Your Camera</h3>
                    {cameraError ? (
                      <p className="text-sm text-destructive text-center mb-4">{cameraError}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Enable your camera for a more realistic interview experience
                      </p>
                    )}
                  </div>
                )}
              </Card>
              
              {/* Camera Controls */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isCameraEnabled ? "default" : "secondary"}
                        size="icon"
                        onClick={handleCameraToggle}
                        className="rounded-full"
                      >
                        {isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section - Right Side */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0 p-4" onScrollCapture={handleScroll} ref={scrollAreaRef}>
              <div className="space-y-4 pb-4">
                <AnimatePresence>
                  {currentSession?.messages.map((msg: Message) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-[85%] ${
                        msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {msg.sender === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <span className="text-sm">{interviewer.icon}</span>
                          )}
                        </div>

                        {/* Message Content */}
                        <Card className={`p-3 ${
                          msg.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <MessageContent 
                            content={msg.content} 
                            className="text-sm leading-relaxed"
                          />
                          <p className={`text-xs mt-2 ${
                            msg.sender === 'user'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </Card>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* AI Typing Indicator */}
                {isAiResponding && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3 max-w-[85%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                        <span className="text-sm">{interviewer.icon}</span>
                      </div>
                      <Card className="p-3 bg-muted">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            {interviewer.name} is thinking...
                          </span>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-card p-4 flex-shrink-0">
              {/* Scroll Control */}
              {!shouldAutoScroll && currentSession?.messages && currentSession.messages.length > 0 && (
                <div className="mb-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShouldAutoScroll(true);
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs"
                  >
                    ↓ Scroll to bottom
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                {/* Voice Controls */}
                <TooltipProvider>
                  <div className="flex space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isVoiceEnabled ? "default" : "outline"}
                          size="icon"
                          onClick={handleVoiceToggle}
                          disabled={!speechService.isSpeechRecognitionSupported()}
                        >
                          {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isVoiceEnabled ? 'Disable voice mode' : 'Enable voice mode'}
                      </TooltipContent>
                    </Tooltip>

                    {isVoiceEnabled && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isListening ? "destructive" : "outline"}
                            size="icon"
                            onClick={handleVoiceInput}
                            disabled={isAiResponding}
                          >
                            {isListening ? (
                              <MicOff className="h-4 w-4" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isListening ? 'Stop listening' : 'Start voice input'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>

                {/* Text Input */}
                <div className="flex-1 flex space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isVoiceEnabled ? "Voice mode active - use microphone or type..." : "Type your response..."}
                    className="flex-1"
                    disabled={isAiResponding || isListening}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!canSendMessage}
                  >
                    {isAiResponding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status Indicators */}
              <AnimatePresence>
                {(isListening || isSpeaking || isAiResponding) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 text-center"
                  >
                    <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                      {isListening && (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Listening... Speak now</span>
                        </>
                      )}
                      {isSpeaking && (
                        <>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span>AI is speaking...</span>
                        </>
                      )}
                      {isAiResponding && !isSpeaking && (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AI is thinking...</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}