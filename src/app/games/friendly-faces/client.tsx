
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Smile, Pause, Play, RefreshCw, Hand } from 'lucide-react';
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
import { generateSpeech } from '@/ai/flows/speech';


const availableCharacters = [
  { name: 'Friend 1', src: '/videos/friend1.mp4' },
  { name: 'Friend 2', src: '/videos/friend2.mp4' },
  { name: 'Friend 3', src: '/videos/friend3.mp4' },
];

const TIME_PER_CHARACTER = 10; // Seconds per character

export function FriendlyFacesGameClient() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'win'>('start');
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const [friendsMade, setFriendsMade] = useState(0);
  const [numFriends, setNumFriends] = useState(3);
  const [gameCharacters, setGameCharacters] = useState<{name: string; src: string}[]>([]);
  const [showSmile, setShowSmile] = useState(false);
  const [greetingAudioUrl, setGreetingAudioUrl] = useState<string | null>(null);
  const { soundEnabled } = useSettings();

  const gameTimerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentCharacter = gameCharacters[currentCharacterIndex];

  const stopAllTimers = useCallback(() => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  }, []);

  const nextCharacter = useCallback(() => {
    setShowSmile(false);
    if (friendsMade + 1 >= numFriends) {
      setGameState('win');
      setFriendsMade(f => f + 1);
      stopAllTimers();
    } else {
      setCurrentCharacterIndex(prev => prev + 1);
      setFriendsMade(prev => prev + 1);
      setGameState('playing');
    }
  }, [friendsMade, numFriends, stopAllTimers]);


  const handleMakeFriend = () => {
    if (gameState !== 'playing') return;

    if (soundEnabled && audioRef.current) {
        audioRef.current.play();
    }
    setShowSmile(true);
    setTimeout(() => {
        nextCharacter();
    }, 1500); // Show smile for 1.5 seconds
  }

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
    setGameState('playing');
  };

  useEffect(() => {
    // Pre-generate the speech audio when the component mounts
    generateSpeech({ text: "Hi friend!" }).then(result => {
        setGreetingAudioUrl(result.audioUrl);
    }).catch(console.error);
  }, []);

  const handleRestart = () => {
    stopAllTimers();
    setGameState('start');
  };
  
  const handlePause = () => {
    if (gameState !== 'playing') return;
    setGameState('paused');
  }

  const handleResume = () => {
    if (gameState !== 'paused') return;
    setGameState('playing');
  }

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
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {Array.from({ length: friendsMade }).map((_, i) => (
            <Smile key={i} className="w-8 h-8 text-yellow-400" />
          ))}
        </div>
        <Button onClick={handleRestart} className="mt-4">Play Again</Button>
      </div>
    );
  }
  
  const isGameRunning = ['playing', 'paused'].includes(gameState) && currentCharacter;

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden flex flex-col">
       {greetingAudioUrl && <audio ref={audioRef} src={greetingAudioUrl} preload="auto" />}
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

      <div className="absolute top-4 left-4 right-4 z-20 space-y-2">
         <div className="flex justify-between items-center bg-black/30 backdrop-blur-sm p-3 rounded-full text-white font-bold">
            <div>Friends Made: {friendsMade} / {numFriends}</div>
             <div className="flex items-center gap-2">
                <Button onClick={gameState === 'paused' ? handleResume : handlePause} size="icon" variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white">
                  {gameState === 'paused' ? <Play /> : <Pause />}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="icon" variant="ghost" className="rounded-full text-white hover:bg-white/20 hover:text-white"><RefreshCw /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                            <AlertDialogDescription>Your current progress will be lost.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRestart}>Restart</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div>Friend {currentCharacterIndex + 1} of {numFriends}</div>
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
      
      {showSmile &&  (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Smile className="w-24 h-24 text-yellow-300" />
          </motion.div>
        </div>
      )}

      {gameState === 'playing' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center gap-2">
               <p className="font-bold text-white text-center bg-black/30 backdrop-blur-sm py-2 px-4 rounded-full">
                  Click the moving hand to greet your new friend!
               </p>
                <motion.div
                    animate={{
                        x: [-100, 100, -100],
                        y: [0, -50, 0],
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
                        className="rounded-full w-16 h-16"
                    >
                        <Hand className="w-6 h-6" />
                    </Button>
                </motion.div>
          </div>
      )}
    </div>
  );
}
