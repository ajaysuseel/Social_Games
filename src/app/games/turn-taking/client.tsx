
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { Play, Pause, RefreshCw, Timer } from 'lucide-react';
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


const players = {
  P1: { name: 'Player 1', color: 'bg-blue-300' },
  P2: { name: 'Player 2', color: 'bg-yellow-300' },
};

const GAME_ROUNDS = 2;
const TURN_DURATION = 10; // 10 seconds per turn

const bubbleColors = [
  'bg-blue-200/70 border-blue-300/90',
  'bg-green-200/70 border-green-300/90',
  'bg-yellow-200/70 border-yellow-300/90',
  'bg-pink-200/70 border-pink-300/90',
  'bg-purple-200/70 border-purple-300/90',
  'bg-orange-200/70 border-orange-300/90',
];

type Bubble = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
};

export function BubbleHarmonyGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'end'>('start');
  const [currentPlayer, setCurrentPlayer] = useState<'P1' | 'P2'>('P1');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [round, setRound] = useState(1);
  const [showTurnIndicator, setShowTurnIndicator] = useState(false);
  const { soundEnabled } = useSettings();
  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_DURATION);
  
  const turnSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAllTimers = useCallback(() => {
    if (turnSwitchTimeoutRef.current) clearTimeout(turnSwitchTimeoutRef.current);
    if (turnTimerRef.current) clearInterval(turnTimerRef.current);
  }, []);

  const playSound = useCallback((type: 'pop' | 'reward' | 'turn') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    if (type === 'pop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300 + Math.random() * 200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    } else if (type === 'reward') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
    } else if (type === 'turn') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    }

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
  }, [soundEnabled]);

  const generateBubbles = useCallback(() => {
    const newBubbles: Bubble[] = [];
    const numBubbles = Math.floor(Math.random() * 6) + 5; // Randomly 5 to 10 bubbles

    for (let i = 0; i < numBubbles; i++) {
      newBubbles.push({
        id: Date.now() + i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 40 + Math.random() * 60, // A bit more size variation
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
      });
    }
    setBubbles(newBubbles);
  }, []);
  
  const handleTurnEnd = useCallback(() => {
      stopAllTimers();
      turnSwitchTimeoutRef.current = setTimeout(() => {
        if (currentPlayer === 'P2') {
          if (round < GAME_ROUNDS) {
            setRound(r => r + 1);
            setCurrentPlayer('P1');
          } else {
            setGameState('end');
            playSound('reward');
            return;
          }
        } else {
          setCurrentPlayer('P2');
        }
        setTurnTimeLeft(TURN_DURATION);
        generateBubbles();
        setShowTurnIndicator(true);
        playSound('turn');
      }, 1500);
  },[currentPlayer, round, playSound, generateBubbles, stopAllTimers]);
  
  const handleStartGame = () => {
    stopAllTimers();
    setScores({ P1: 0, P2: 0 });
    setRound(1);
    setCurrentPlayer('P1');
    setTurnTimeLeft(TURN_DURATION);
    generateBubbles();
    setGameState('playing');
    setShowTurnIndicator(true);
  };
  
  const handlePause = () => {
    if (gameState !== 'playing') return;
    stopAllTimers();
    setGameState('paused');
  }

  const handleResume = () => {
    if (gameState !== 'paused') return;
    setGameState('playing');
  }

  const handleBubbleTap = (id: number) => {
    if (gameState !== 'playing') return;
    playSound('pop');
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setScores((prev) => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
  };

  useEffect(() => {
    if (gameState === 'playing') {
      if (turnTimeLeft <= 0) {
        handleTurnEnd();
      } else {
        turnTimerRef.current = setInterval(() => {
          setTurnTimeLeft(t => t - 1);
        }, 1000);
      }
    }
    return () => {
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
    };
  }, [gameState, turnTimeLeft, handleTurnEnd]);

  useEffect(() => {
    if (showTurnIndicator) {
      const timer = setTimeout(() => setShowTurnIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showTurnIndicator]);
  
   useEffect(() => {
    return () => {
      stopAllTimers();
    };
  }, [stopAllTimers]);


  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to play?</h2>
        <Button onClick={handleStartGame}>Start Game</Button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Great job!</h2>
        <p className="mb-2 text-lg">Player 1: <span className="font-bold">{scores.P1}</span> points</p>
        <p className="mb-4 text-lg">Player 2: <span className="font-bold">{scores.P2}</span> points</p>
        <Button onClick={handleStartGame}>Play Again</Button>
      </div>
    );
  }

  const getStatusText = () => {
    if (gameState === 'paused') return "Game Paused";
    return `It's ${players[currentPlayer].name}'s turn!`;
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-blue-50 dark:bg-gray-800 overflow-hidden rounded-lg">
        <AnimatePresence>
        {(showTurnIndicator && gameState === 'playing') && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg text-center">{players[currentPlayer].name}'s Turn!</h2>
          </motion.div>
        )}
         {gameState === 'paused' && (
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-3xl font-bold text-white">Paused</h2>
              <Button onClick={handleResume} size="lg">
                <Play className="mr-2"/> Resume
              </Button>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-10 space-y-2">
        <div className="flex justify-between items-center bg-white/50 dark:bg-black/50 p-2 rounded-full shadow-md backdrop-blur-sm">
           <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 md:w-8 md:h-8 rounded-full border-4', players.P1.color, currentPlayer === 'P1' && gameState==='playing' ? 'border-primary' : 'border-transparent')}></div>
            <span className="font-bold text-lg">{scores.P1}</span>
           </div>
           <div className="flex-1 px-2 text-center">
             <div className="flex items-center justify-center gap-2">
                <Button onClick={gameState === 'paused' ? handleResume : handlePause} size="icon" variant="ghost" className="rounded-full w-8 h-8 md:w-10 md:h-10">
                  {gameState === 'paused' ? <Play /> : <Pause />}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="icon" variant="ghost" className="rounded-full w-8 h-8 md:w-10 md:h-10"><RefreshCw /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                            <AlertDialogDescription>Your current progress will be lost.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStartGame}>Restart</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
           </div>
            <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{scores.P2}</span>
            <div className={cn('w-6 h-6 md:w-8 md:h-8 rounded-full border-4', players.P2.color, currentPlayer === 'P2' && gameState==='playing' ? 'border-primary' : 'border-transparent')}></div>
           </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 text-center">
            <p className="font-bold text-sm md:text-base">Round {round}/{GAME_ROUNDS}</p>
            <p className="text-xs md:text-sm text-muted-foreground -mt-2">{getStatusText()}</p>
            <div className="flex items-center gap-1 text-sm font-bold bg-white/50 dark:bg-black/50 px-3 py-1 rounded-full w-24 justify-center">
                <Timer className="w-4 h-4"/>
                <span>{turnTimeLeft}s</span>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            layout
            initial={{ scale: 0 }}
            animate={{ 
                scale: 1,
                x: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 0],
                y: [0, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, 0],
            }}
            exit={{ scale: 0, transition: { duration: 0.3 } }}
            transition={{ 
                type: 'spring', 
                stiffness: 50, 
                damping: 10,
                ...{
                    duration: 8 + Math.random() * 8,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                }
            }}
            className={cn("absolute rounded-full border-2 cursor-pointer shadow-lg", bubble.color, gameState === 'paused' && 'opacity-50')}
            style={{
              width: bubble.size,
              height: bubble.size,
              top: `${bubble.y}%`,
              left: `${bubble.x}%`,
            }}
            onClick={() => handleBubbleTap(bubble.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
