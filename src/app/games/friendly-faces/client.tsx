
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Trophy, Frown, Timer, Sprout } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { detectHai } from '@/ai/flows/detect-hai';

const availableCharacters = [
  { name: 'Friend 1', src: '/videos/friend1.mp4' },
  { name: 'Friend 2', src: '/videos/friend2.mp4' },
  { name: 'Friend 3', src: '/videos/friend3.mp4' },
];

const TIME_PER_CHARACTER = 10; // Seconds per character
const PROMPT_AUDIO_PATH = '/audio/hai.mp3';
const RESPONSE_AUDIO_PATH = '/audio/hi-friend.mp3';
const RECORDING_DURATION = 2000; // 2 seconds

export function FriendlyFacesGameClient() {
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<'start' | 'listening' | 'analyzing' | 'responding' | 'win' | 'lose'>('start');
  const [isRecording, setIsRecording] = useState(false);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [friendsMade, setFriendsMade] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(0);
  const [characterTimeLeft, setCharacterTimeLeft] = useState(TIME_PER_CHARACTER);
  const [numFriends, setNumFriends] = useState(3);
  const [gameCharacters, setGameCharacters] = useState<{name: string; src: string}[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const gameTimerRef = useRef<NodeJS.Timeout>();
  const characterTimerRef = useRef<NodeJS.Timeout>();
  const responseAudioRef = useRef<HTMLAudioElement>(null);
  const promptAudioRef = useRef<HTMLAudioElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  const { toast } = useToast();
  
  const currentCharacter = gameCharacters[currentCharacterIndex];

  const stopAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (characterTimerRef.current) clearInterval(characterTimerRef.current);
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
  }, []);
  
  const nextCharacter = useCallback(() => {
    stopRecording();
    if (characterTimerRef.current) clearInterval(characterTimerRef.current);

    const newFriendsCount = friendsMade + 1;
    setFriendsMade(newFriendsCount);

    if (newFriendsCount >= numFriends) {
      setGameState('win');
      stopAllTimers();
    } else {
      setCurrentCharacterIndex(prev => prev + 1);
      setCharacterTimeLeft(TIME_PER_CHARACTER);
      setGameState('listening');
    }
  }, [friendsMade, numFriends, stopAllTimers, stopRecording]);

  const handleHaiDetected = useCallback(() => {
    stopRecording();
    setGameState('responding');
  }, [stopRecording]);

  useEffect(() => {
    if (gameState === 'responding' && responseAudioRef.current) {
      responseAudioRef.current.play().catch(e => {
        console.error("Failed to play response audio", e);
        nextCharacter();
      });
    }
  }, [gameState, nextCharacter]);
  
  // Prompt audio effect
  useEffect(() => {
    if (promptAudioRef.current) {
        promptAudioRef.current.volume = 0.5; // Set volume to 50%
    }
    if (responseAudioRef.current) {
        responseAudioRef.current.volume = 0.5; // Set volume to 50%
    }

    if (gameState === 'listening') {
      const playPrompt = () => {
        if (promptAudioRef.current) {
            promptAudioRef.current.currentTime = 0;
            promptAudioRef.current.play().catch(e => console.error("Could not play prompt audio", e));
        }
      };
      playPrompt(); // Play immediately
      const promptInterval = setInterval(playPrompt, 6000); // And then every 6 seconds
      return () => clearInterval(promptInterval);
    }
  }, [gameState, currentCharacterIndex]);

  // Game timers effect
  useEffect(() => {
    if (gameState === 'listening' || gameState === 'analyzing' || gameState === 'responding') {
        characterTimerRef.current = setInterval(() => {
            setCharacterTimeLeft(prev => {
                if (prev <= 1) {
                    setGameState('lose');
                    stopAllTimers();
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    } else {
        if (characterTimerRef.current) clearInterval(characterTimerRef.current);
    }
    
    return () => {
      if (characterTimerRef.current) clearInterval(characterTimerRef.current);
    }
  }, [gameState, currentCharacterIndex, stopAllTimers, stopRecording]);

  useEffect(() => {
    if (gameTimeLeft <= 0 && ['listening', 'responding', 'analyzing'].includes(gameState)) {
        setGameState('lose');
        stopAllTimers();
        stopRecording();
    }
  }, [gameTimeLeft, gameState, stopAllTimers, stopRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording || gameState !== 'listening') return;

    setIsRecording(true);
    try {
      if (!mediaRecorderRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasMicPermission(true);
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            setIsRecording(false);
            if (gameState !== 'listening') return; // Don't analyze if we've moved on
            
            setGameState('analyzing');
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = [];

            if (audioBlob.size < 1000) { // If blob is too small, likely silent.
              analysisTimeoutRef.current = setTimeout(() => setGameState('listening'), 1000);
              return;
            }
            
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              try {
                const { saidHai } = await detectHai({ audioDataUri: base64Audio });
                if (saidHai) {
                  handleHaiDetected();
                } else {
                  // If hai not detected, wait a bit then go back to listening
                  analysisTimeoutRef.current = setTimeout(() => {
                    if (characterTimeLeft > 0) {
                       setGameState('listening');
                    }
                  }, 1000); 
                }
              } catch (error) {
                console.error("Error detecting hai:", error);
                toast({ variant: 'destructive', title: 'AI Error', description: 'Could not analyze audio.' });
                analysisTimeoutRef.current = setTimeout(() => setGameState('listening'), 1000);
              }
            };
        };
      }
      
      mediaRecorderRef.current.start();

      // Automatically stop recording after a duration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
        }
      }, RECORDING_DURATION);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setIsRecording(false);
      setHasMicPermission(false);
      toast({ variant: 'destructive', title: 'Microphone Access Required' });
    }
  }, [isRecording, gameState, stopRecording, handleHaiDetected, characterTimeLeft, toast]);
  
  // Recording loop effect
  useEffect(() => {
    let recordingInterval: NodeJS.Timeout;
    if (gameState === 'listening' && !isRecording) {
      // Start a recording cycle every 3 seconds if not already recording
      recordingInterval = setInterval(() => {
        startRecording();
      }, 3000);
    }
    return () => {
        if (recordingInterval) clearInterval(recordingInterval);
    }
  }, [gameState, isRecording, startRecording]);

  const handleStart = async () => {
    const randomizedCharacters: {name: string; src: string}[] = [];
    let lastCharacterIndex = -1;

    for (let i = 0; i < numFriends; i++) {
        let nextCharacterIndex;
        do {
            nextCharacterIndex = Math.floor(Math.random() * availableCharacters.length);
        } while (availableCharacters.length > 1 && nextCharacterIndex === lastCharacterIndex);
        
        randomizedCharacters.push(availableCharacters[nextCharacterIndex]);
        lastCharacterIndex = nextCharacterIndex;
    }
    
    setGameCharacters(randomizedCharacters);

    setFriendsMade(0);
    setCurrentCharacterIndex(0);
    setGameTimeLeft(numFriends * TIME_PER_CHARACTER);
    setCharacterTimeLeft(TIME_PER_CHARACTER);
    setGameState('listening');
    
    gameTimerRef.current = setInterval(() => {
        setGameTimeLeft(prev => prev - 1);
    }, 1000);
  };
  
  const handleRestart = () => {
    stopAllTimers();
    stopRecording();
    // Clean up media recorder resources
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
    }
    setGameState('start');
    setHasMicPermission(null);
  };

  const getStatusMessage = () => {
    if (isRecording) {
      return { icon: <Mic className="animate-pulse text-destructive" />, text: 'Listening...' };
    }
    if (gameState === 'analyzing') {
      return { icon: <Sprout className="animate-spin" />, text: 'Analyzing...' };
    }
    return { icon: <Mic />, text: 'Say "Hai" to make a friend!' };
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <h2 className="text-2xl font-bold mb-4">Ready to make new friends?</h2>
        <div className="flex flex-col items-center gap-4 mb-6">
            <Label htmlFor="num-friends-select">How many friends do you want to meet?</Label>
            <Select value={String(numFriends)} onValueChange={(value) => setNumFriends(Number(value))}>
                <SelectTrigger id="num-friends-select" className="w-[180px]">
                    <SelectValue placeholder="Number of friends" />
                </SelectTrigger>
                <SelectContent>
                    {[...Array(9)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{i + 1} friend{i > 0 ? 's' : ''}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-muted-foreground text-center">Total time: {numFriends * TIME_PER_CHARACTER} seconds</p>
        </div>
        <Button onClick={handleStart} size="lg">Start Game</Button>
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
        <p className="text-muted-foreground">You made friends with {friendsMade} out of {numFriends}.</p>
        <Button onClick={handleRestart} className="mt-4">Try Again</Button>
      </div>
    );
  }

  const isGameRunning = ['listening', 'responding', 'analyzing'].includes(gameState) && currentCharacter;
  const status = getStatusMessage();

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <audio ref={promptAudioRef} src={PROMPT_AUDIO_PATH} />
      <audio ref={responseAudioRef} src={RESPONSE_AUDIO_PATH} onEnded={nextCharacter} />

      <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
         <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm p-3 rounded-full text-white font-bold">
            <div>Friends Made: {friendsMade} / {numFriends}</div>
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
                    key={currentCharacter.src + currentCharacterIndex}
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

      {(gameState === 'listening' || gameState === 'analyzing') && hasMicPermission !== false && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
               <div className="max-w-md mx-auto bg-white/30 backdrop-blur-sm p-3 rounded-full text-center">
                    <p className="font-bold text-card-foreground flex items-center justify-center gap-2">
                        {status.icon}
                        {status.text}
                    </p>
               </div>
          </div>
      )}

      {hasMicPermission === false && gameState !== 'start' && (
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
