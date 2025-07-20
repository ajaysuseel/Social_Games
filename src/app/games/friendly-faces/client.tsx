
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { detectHai } from '@/ai/flows/detect-hello';
import { Mic, MicOff, Volume2, Trophy, Frown, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const characters = [
  { name: 'Friend 1', src: '/videos/friend1.mp4' },
  { name: 'Friend 2', src: '/videos/friend2.mp4' },
  { name: 'Friend 3', src: '/videos/friend3.mp4' },
];

const GAME_DURATION = 60; // Total seconds for the game
const TIME_PER_CHARACTER = 12; // Seconds per character
const PROMPT_AUDIO_PATH = '/audio/hai.mp3';
const RESPONSE_AUDIO_PATH = '/audio/hi-friend.mp3'; // Path for static response

export function FriendlyFacesGameClient() {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<'start' | 'listening' | 'responding' | 'win' | 'lose'>('start');
  const [isDetecting, setIsDetecting] = useState(false);
  const [responseAudioUrl, setResponseAudioUrl] = useState<string | null>(null);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [friendsMade, setFriendsMade] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_DURATION);
  const [characterTimeLeft, setCharacterTimeLeft] = useState(TIME_PER_CHARACTER);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const characterTimerRef = useRef<NodeJS.Timeout>();
  const responseAudioRef = useRef<HTMLAudioElement>(null);
  const promptAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  
  const currentCharacter = characters[currentCharacterIndex];

  const stopAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (characterTimerRef.current) clearInterval(characterTimerRef.current);
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
  }, []);

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
  
  const nextCharacter = useCallback(() => {
    stopDetection();
    if (characterTimerRef.current) clearInterval(characterTimerRef.current);

    const newFriendsCount = friendsMade + 1;
    setFriendsMade(newFriendsCount);

    if (newFriendsCount === characters.length) {
      setGameState('win');
      stopAllTimers();
    } else {
      setCurrentCharacterIndex(prev => prev + 1);
      setCharacterTimeLeft(TIME_PER_CHARACTER);
      setGameState('listening');
    }
  }, [friendsMade, stopDetection, stopAllTimers]);

  const handleHaiDetected = useCallback(async () => {
    stopDetection();
    setGameState('responding');
    setResponseAudioUrl(RESPONSE_AUDIO_PATH);
  }, [stopDetection]);
  
  useEffect(() => {
    if (gameState === 'responding' && responseAudioUrl && responseAudioRef.current) {
      responseAudioRef.current.play().catch(e => {
        console.error("Failed to play response audio", e);
        nextCharacter();
      });
    }
  }, [gameState, responseAudioUrl, nextCharacter]);

  useEffect(() => {
    if (promptAudioRef.current) {
        promptAudioRef.current.volume = 0.5; // Set volume to 50%
    }
    if (responseAudioRef.current) {
        responseAudioRef.current.volume = 0.5; // Set volume to 50%
    }
    if (gameState === 'listening' && promptAudioRef.current) {
      const playPrompt = () => {
        if (promptAudioRef.current) {
            promptAudioRef.current.currentTime = 0;
            promptAudioRef.current.play().catch(e => console.error("Could not play prompt audio", e));
        }
      };
      playPrompt();
      const promptInterval = setInterval(playPrompt, 6000);
      return () => clearInterval(promptInterval);
    }
  }, [gameState, currentCharacterIndex]);

  const handleDetection = useCallback(async (audioBlob: Blob) => {
    if (isDetecting) return;
    setIsDetecting(true);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await detectHai({ audioDataUri: base64Audio });
        if (result.saidHai) {
          await handleHaiDetected();
        }
      } catch (error) {
        console.error("Detection failed:", error);
      } finally {
        setIsDetecting(false);
      }
    };
  }, [isDetecting, handleHaiDetected]);

  const startCharacterTurn = useCallback(() => {
    setResponseAudioUrl(null);
    characterTimerRef.current = setInterval(() => {
      setCharacterTimeLeft(prev => prev - 1);
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (gameState === 'listening') {
        startCharacterTurn();
    }
  }, [gameState, currentCharacterIndex, startCharacterTurn]);

  // Game Timers Logic
  useEffect(() => {
    if (gameTimeLeft <= 0 || characterTimeLeft < 0) {
        if (gameState === 'listening' || gameState === 'responding') {
            setGameState('lose');
            stopAllTimers();
        }
    }
  }, [gameTimeLeft, characterTimeLeft, gameState, stopAllTimers]);

  useEffect(() => {
    const cleanup = () => {
      stopDetection();
      stopAllTimers();
      if (mediaRecorderRef.current) {
        const stream = mediaRecorderRef.current.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };

    if (gameState !== 'listening') {
      stopDetection();
      return;
    }

    const getMicPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({ variant: 'destructive', title: 'Microphone Not Supported' });
        setHasMicPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          handleDetection(audioBlob);
          audioChunksRef.current = [];
        };

        detectionIntervalRef.current = setInterval(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive' && !isDetecting) {
            mediaRecorderRef.current.start();
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
            }, 2000);
          }
        }, 3000);

      } catch (error) {
        console.error('Error accessing microphone:', error);
        setHasMicPermission(false);
        toast({ variant: 'destructive', title: 'Microphone Access Denied' });
      }
    };

    getMicPermission();
    return cleanup;
  }, [gameState, toast, stopDetection, handleDetection, isDetecting, stopAllTimers]);
  
  const handleStart = async () => {
    setFriendsMade(0);
    setCurrentCharacterIndex(0);
    setGameTimeLeft(GAME_DURATION);
    setCharacterTimeLeft(TIME_PER_CHARACTER);
    setGameState('listening');
    
    gameTimerRef.current = setInterval(() => {
        setGameTimeLeft(prev => prev - 1);
    }, 1000);
  };
  
  const handleRestart = () => {
    stopAllTimers();
    setGameState('start');
    setHasMicPermission(null);
    setResponseAudioUrl(null);
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to make new friends?</h2>
        <p className="text-muted-foreground mb-6 text-center">You'll have {GAME_DURATION} seconds to greet all {characters.length} friends.</p>
        <Button onClick={handleStart}>Start Game</Button>
      </div>
    );
  }
  
  if (gameState === 'win') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4">You made {friendsMade} new friends!</h2>
        <Button onClick={handleRestart} className="mt-4">Play Again</Button>
      </div>
    );
  }
  
  if (gameState === 'lose') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <Frown className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-4">Time's up!</h2>
        <p className="text-muted-foreground">You made friends with {friendsMade} out of {characters.length}.</p>
        <Button onClick={handleRestart} className="mt-4">Try Again</Button>
      </div>
    );
  }

  const isGameRunning = ['listening', 'responding'].includes(gameState);

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <audio ref={promptAudioRef} src={PROMPT_AUDIO_PATH} />
      {responseAudioUrl && <audio ref={responseAudioRef} src={responseAudioUrl} onEnded={nextCharacter} />}

      <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
         <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm p-3 rounded-full text-white font-bold">
            <div>Friends Made: {friendsMade} / {characters.length}</div>
            <div className="flex items-center gap-2"><Timer />{gameTimeLeft}s</div>
         </div>
         {isGameRunning && (
            <div className="space-y-1">
                <p className="text-white text-xs text-center font-bold">Time for this friend: {characterTimeLeft}s</p>
            </div>
         )}
      </div>

      <div className="flex-grow relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isGameRunning && (
                <video
                    key={currentCharacter.src}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src={currentCharacter.src} type="video/mp4" />
                </video>
            )}
        </div>
      </div>
      
      {gameState === 'responding' &&  <div className="absolute inset-0 bg-black/20 flex items-center justify-center" /> }


      {gameState === 'listening' && hasMicPermission && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
               <div className="max-w-md mx-auto bg-white/30 backdrop-blur-sm p-3 rounded-full text-center">
                    <p className="font-bold text-card-foreground flex items-center justify-center gap-2">
                      {isDetecting ? <Mic className="animate-pulse text-destructive" /> : <Mic />}
                      Say "Hai" to {currentCharacter.name}!
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
