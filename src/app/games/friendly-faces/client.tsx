
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { detectHello } from '@/ai/flows/detect-hello';
import { generateSpeech } from '@/ai/flows/speech';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const character = { name: 'Friendly Character', src: '/videos/character.mp4' };

export function FriendlyFacesGameClient() {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<'start' | 'generating_prompt' | 'listening' | 'responding' | 'end'>('start');
  const [isDetecting, setIsDetecting] = useState(false);
  const [promptAudioUrl, setPromptAudioUrl] = useState<string | null>(null);
  const [responseAudioUrl, setResponseAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const responseAudioRef = useRef<HTMLAudioElement>(null);
  const promptAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = undefined;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsDetecting(false);
  }, []);

  const handleHelloDetected = useCallback(async () => {
    setGameState('responding');
    stopDetection();
    try {
      const { audioUrl: generatedAudioUrl } = await generateSpeech({ text: 'Hi friend' });
      setResponseAudioUrl(generatedAudioUrl);
    } catch(e) {
      console.error("Failed to generate speech", e);
      toast({
        variant: 'destructive',
        title: 'Audio Generation Failed',
        description: 'Could not generate the response audio.'
      });
      setGameState('end');
    }
  }, [stopDetection, toast]);
  
  // Effect for playing the response audio
  useEffect(() => {
    if (gameState === 'responding' && responseAudioUrl && responseAudioRef.current) {
      responseAudioRef.current.play().catch(e => {
        console.error("Failed to play response audio", e);
        setGameState('end');
      });
    }
  }, [gameState, responseAudioUrl]);

  // Effect for playing the prompt audio
  useEffect(() => {
    if (gameState === 'listening' && promptAudioUrl && promptAudioRef.current) {
      promptAudioRef.current.play().catch(e => console.error("Could not play prompt audio", e));
    }
  }, [gameState, promptAudioUrl]);

  const handleDetection = useCallback(async (audioBlob: Blob) => {
    if (isDetecting) return;
    setIsDetecting(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await detectHello({ audioDataUri: base64Audio });
        if (result.saidHello) {
          await handleHelloDetected();
        }
      } catch (error) {
        console.error("Detection failed:", error);
      } finally {
        setIsDetecting(false);
      }
    };
  }, [isDetecting, handleHelloDetected]);

  useEffect(() => {
    const cleanup = () => {
      stopDetection();
      if (mediaRecorderRef.current) {
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };

    if (gameState !== 'listening') {
      cleanup();
      return;
    }

    const getMicPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Microphone Not Supported',
          description: 'Your browser does not support microphone access.',
        });
        setHasMicPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          handleDetection(audioBlob);
          audioChunksRef.current = [];
        };

        detectionIntervalRef.current = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive' && !isDetecting) {
            mediaRecorderRef.current.start();
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
            }, 2000); // Record for 2 seconds
          }
        }, 3000); // Check every 3 seconds

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasMicPermission(false);
        toast({
          variant: 'destructive',
          title: 'Microphone Access Denied',
          description: 'Please enable microphone permissions in your browser settings.',
        });
      }
    };

    getMicPermission();
    return cleanup;
  }, [gameState, toast, stopDetection, handleDetection, isDetecting]);
  
  const handleStart = async () => {
    setGameState('generating_prompt');
    setResponseAudioUrl(null);
    setPromptAudioUrl(null);
    try {
      const { audioUrl } = await generateSpeech({ text: 'Hello' });
      setPromptAudioUrl(audioUrl);
      setGameState('listening');
    } catch (e) {
      console.error("Failed to generate prompt audio", e);
      toast({
        variant: 'destructive',
        title: 'Audio Generation Failed',
        description: 'Could not generate the initial prompt audio.'
      });
      setGameState('start');
    }
  };
  
  const handleRestart = () => {
    setGameState('start');
    setHasMicPermission(null);
    setResponseAudioUrl(null);
    setPromptAudioUrl(null);
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to make a new friend?</h2>
        <Button onClick={handleStart}>Start Game</Button>
      </div>
    );
  }
  
  if (gameState === 'generating_prompt') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <Volume2 className="w-12 h-12 text-primary animate-pulse mb-4" />
        <h2 className="text-xl font-bold">Getting ready...</h2>
      </div>
    );
  }

  if (gameState === 'end' || gameState === 'responding') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">You made a new friend!</h2>
        { gameState === 'responding' && <Progress value={100} className="w-1/2 my-4 animate-pulse" />}
        { gameState === 'end' && <Button onClick={handleRestart} className="mt-4">Play Again</Button> }
        {responseAudioUrl && <audio ref={responseAudioRef} src={responseAudioUrl} onEnded={() => setGameState('end')} />}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {promptAudioUrl && <audio ref={promptAudioRef} src={promptAudioUrl} loop />}

      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <div className="w-full h-full relative">
          <video
            key={character.src}
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={character.src} type="video/mp4" />
          </video>
        </div>
      </div>

      {gameState === 'listening' && hasMicPermission && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
               <div className="max-w-md mx-auto bg-white/30 backdrop-blur-sm p-3 rounded-full text-center">
                    <p className="font-bold text-card-foreground flex items-center justify-center gap-2">
                      {isDetecting ? <Mic className="animate-pulse text-destructive" /> : <Mic />}
                      Say "Hello" to the character!
                    </p>
               </div>
          </div>
      )}

      {hasMicPermission === false && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Microphone Access Required</AlertTitle>
            <AlertDescription>
              This game needs microphone access to work. Please allow microphone access in your browser and try again.
              <Button onClick={handleRestart} className="mt-4 w-full">
                Back to Start
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
