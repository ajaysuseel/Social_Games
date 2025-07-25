
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Smile, Pause, Play, RefreshCw, Hand, Timer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettings } from '@/hooks/use-settings';

const availableCharacters = [
  { name: 'Friend 1', src: '/videos/friend1.mp4' },
  { name: 'Friend 2', src: '/videos/friend2.mp4' },
  { name: 'Friend 3', src: '/videos/friend3.mp4' },
];

const GREETING_AUDIO_SRC = '/audio/hai.mp3';
const TURN_DURATION = 6; // in seconds

export function FriendlyFacesGameClient() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'win'>('start');
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [friendsMade, setFriendsMade] = useState(0);
  const [numFriends, setNumFriends] = useState(3);
  const [gameCharacters, setGameCharacters] = useState<{name: string; src: string}[]>([]);
  const [showSmile, setShowSmile] = useState(false);
  const { soundEnabled } = useSettings();
  const [timeLeft, setTimeLeft] = useState(TURN_DURATION);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentCharacter = gameCharacters[currentCharacterIndex];

  const stopAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const playGreetingSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
  }, [soundEnabled]);

  const nextCharacter = useCallback(() => {
    stopAllTimers();
    setShowSmile(false);
    
    if (currentCharacterIndex < numFriends - 1) {
      setCurrentCharacterIndex(prev => prev + 1);
      setTimeLeft(TURN_DURATION);
    } else {
      setGameState('win');
    }
  }, [currentCharacterIndex, numFriends, stopAllTimers]);

  useEffect(() => {
    // Main game loop timer
    if (gameState === 'playing' && !showSmile) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextCharacter();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState, showSmile, nextCharacter]);
  
  useEffect(() => {
    if (gameState === 'playing' && !showSmile) {
      playGreetingSound();
    }
  }, [gameState, showSmile, currentCharacterIndex, playGreetingSound]);


  const handleMakeFriend = () => {
    if (gameState !== 'playing' || showSmile) return;
    
    stopAllTimers();
    playGreetingSound();
    setShowSmile(true);
    setFriendsMade(prev => prev + 1);
    
    successTimeoutRef.current = setTimeout(() => {
        nextCharacter();
    }, 1500); // Show smile for 1.5 seconds
  };
  
  const handleStart = () => {
    stopAllTimers();
    
    const shuffled = [...availableCharacters].sort(() => 0.5 - Math.random());
    const charactersForGame: {name: string; src: string}[] = [];

    for (let i = 0; i < numFriends; i++) {
        // Use unique characters first, then repeat randomly if needed
        if (i < shuffled.length) {
            charactersForGame.push(shuffled[i]);
        } else {
            const randomIndex = Math.floor(Math.random() * availableCharacters.length);
            charactersForGame.push(availableCharacters[randomIndex]);
        }
    }
    
    setGameCharacters(charactersForGame);
    setFriendsMade(0);
    setCurrentCharacterIndex(0);
    setTimeLeft(TURN_DURATION);
    setShowSmile(false);
    setGameState('playing');
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioRef.current) {
        const audio = new Audio(GREETING_AUDIO_SRC);
        audio.preload = 'auto';
        audio.volume = 0.3; // Set volume to 30%
        audioRef.current = audio;
    }
  }, []);
  
  const handleRestart = () => {
    stopAllTimers();
    // Reset to start screen to allow changing number of friends
    setGameState('start');
  };
  
  const handlePause = () => {
    if (gameState !== 'playing') return;
    stopAllTimers();
    setGameState('paused');
  };

  const handleResume = () => {
    if (gameState !== 'paused') return;
    setGameState('playing');
  };
  
  useEffect(() => {
      return () => stopAllTimers();
  }, [stopAllTimers]);

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <h2 className="text-2xl font-bold mb-4 text-center">Ready to make new friends?</h2>
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
        </div>
        <Button onClick={handleStart} size="lg">Start Game</Button>
      </div>
    );
  }
  
  if (gameState === 'win') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full text-center">
        <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold mb-4">You made {friendsMade} new friend{friendsMade === 1 ? '' : 's'}!</h2>
        {friendsMade > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {Array.from({ length: friendsMade }).map((_, i) => (
              <Smile key={i} className="w-8 h-8 text-yellow-400" />
            ))}
          </div>
        )}
        <Button onClick={handleRestart} className="mt-4">Play Again</Button>
      </div>
    );
  }
  
  const isGameRunning = ['playing', 'paused'].includes(gameState) && currentCharacter;

  return (
    <div className="absolute inset-0 bg-gray-900 rounded-lg overflow-hidden flex flex-col">
       <AnimatePresence>
        {gameState === 'paused' && (
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-white"
            >
              <h2 className="text-3xl font-bold">Paused</h2>
              <Button onClick={handleResume} size="lg">
                <Play className="mr-2"/> Resume
              </Button>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-20 space-y-2">
         <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-full text-white font-bold text-sm md:text-base">
            <div>Friends: {friendsMade} / {numFriends}</div>
             <div className="flex items-center gap-1 md:gap-2">
                <Button onClick={gameState === 'paused' ? handleResume : handlePause} size="icon" variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white w-8 h-8 md:w-10 md:h-10">
                  {gameState === 'paused' ? <Play /> : <Pause />}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="icon" variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white w-8 h-8 md:w-10 md:h-10"><RefreshCw /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                            <AlertDialogDescription>Your current progress will be lost.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStart}>Restart</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="flex items-center gap-1 font-bold">
                <Timer className="w-5 h-5"/>
                {timeLeft}s
            </div>
         </div>
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
      
      <AnimatePresence>
        {showSmile &&  (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center z-20"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Smile className="w-16 h-16 md:w-24 md:h-24 text-yellow-300" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      

      {gameState === 'playing' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2">
               <p className="font-bold text-white text-center bg-black/30 backdrop-blur-sm py-2 px-4 rounded-full text-sm">
                  Click the moving hand to greet your new friend!
               </p>
                <motion.div
                    animate={{
                        x: [-50, 50, -50],
                        y: [0, -30, 0],
                    }}
                    transition={{
                        duration: 8,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    }}
                >
                    <Button 
                        onClick={handleMakeFriend} 
                        disabled={showSmile}
                        size="icon"
                        className="rounded-full w-14 h-14 md:w-16 md:h-16"
                    >
                        <Hand className="w-6 h-6" />
                    </Button>
                </motion.div>
          </div>
      )}
    </div>
  );
}
