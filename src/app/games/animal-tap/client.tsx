
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/use-settings';
import { Timer, Rabbit, Pause, Play, RefreshCw } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const animals = [
  { name: 'Cat', src: '/images/animal-tap/cat.png' },
  { name: 'Dog', src: '/images/animal-tap/dog.png' },
  { name: 'Lion', src: '/images/animal-tap/lion.png' },
  { name: 'Duck', src: '/images/animal-tap/duck.jpeg' },
  { name: 'Rabbit', src: '/images/animal-tap/rabbit.jpeg' },
];

const GAME_DURATION = 30; // in seconds
const TIME_UNTIL_MOVE = 3000; // in milliseconds

type AnimalOnScreen = {
  id: number;
  name: string;
  src: string;
  x: number;
  y: number;
  size: number;
  isMoving: boolean;
};

export function AnimalTapClient() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'end'>('start');
  const [animalsOnScreen, setAnimalsOnScreen] = useState<AnimalOnScreen[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const { soundEnabled } = useSettings();
  const gameIntervalRef = useRef<NodeJS.Timeout>();
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const movementTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const playSound = useCallback((type: 'pop' | 'end') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    if (type === 'pop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300 + Math.random() * 200, audioContext.currentTime); // Lowered frequency for softer sound
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.4);
    } else if (type === 'end') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
    }

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
  }, [soundEnabled]);

  const addAnimal = useCallback(() => {
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const newAnimal: AnimalOnScreen = {
      id: Date.now(),
      ...randomAnimal,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 40 + Math.random() * 40, // Varying animal sizes
      isMoving: false,
    };

    const timeout = setTimeout(() => {
      setAnimalsOnScreen((prev) =>
        prev.map((a) => (a.id === newAnimal.id ? { ...a, isMoving: true } : a))
      );
      movementTimeoutsRef.current.delete(newAnimal.id);
    }, TIME_UNTIL_MOVE);

    movementTimeoutsRef.current.set(newAnimal.id, timeout);
    setAnimalsOnScreen((prev) => [...prev, newAnimal].slice(-15)); // Max 15 animals
  }, []);

  const clearAllTimeouts = () => {
      movementTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      movementTimeoutsRef.current.clear();
  };
  
  const stopAllTimers = useCallback(() => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  },[]);


  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setAnimalsOnScreen([]);
    clearAllTimeouts();
    stopAllTimers();

    gameIntervalRef.current = setInterval(addAnimal, 1500); // Slower appearance
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  };
  
  const endGame = useCallback(() => {
    stopAllTimers();
    clearAllTimeouts();
    setGameState('end');
    playSound('end');
  }, [playSound, stopAllTimers]);
  
  const pauseGame = () => {
    if (gameState !== 'playing') return;
    stopAllTimers();
    setGameState('paused');
  }

  const resumeGame = () => {
    if (gameState !== 'paused') return;
    setGameState('playing');
    gameIntervalRef.current = setInterval(addAnimal, 1500);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  }

  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState, endGame]);
  
  useEffect(() => {
    return () => {
      stopAllTimers();
      clearAllTimeouts();
    };
  }, [stopAllTimers]);


  const handleAnimalTap = (id: number) => {
    if (gameState !== 'playing') return;
    if (movementTimeoutsRef.current.has(id)) {
        clearTimeout(movementTimeoutsRef.current.get(id)!);
        movementTimeoutsRef.current.delete(id);
    }
    playSound('pop');
    setAnimalsOnScreen((prev) => prev.filter((a) => a.id !== id));
    setScore((prev) => prev + 1);
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to tap some animals?</h2>
        <p className="text-muted-foreground mb-6">Tap as many as you can before time runs out!</p>
        <Button onClick={startGame} size="lg">Start Game</Button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Time's up!</h2>
        <p className="text-4xl font-bold text-primary mb-6">Your score: {score}</p>
        <Button onClick={startGame} size="lg">Play Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-green-100 dark:bg-green-900/50 overflow-hidden rounded-lg border-4 border-green-200 dark:border-green-800">
       <AnimatePresence>
        {gameState === 'paused' && (
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
            >
              <h2 className="text-3xl font-bold text-white">Paused</h2>
              <Button onClick={resumeGame} size="lg">
                <Play className="mr-2"/> Resume
              </Button>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-white/70 dark:bg-black/70 backdrop-blur-sm p-3 rounded-full shadow-lg">
        <div className="flex items-center gap-2 font-bold text-lg">
            <Rabbit className="text-primary"/>
            <span>Score: {score}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={gameState === 'paused' ? resumeGame : pauseGame} size="icon" variant="ghost" className="rounded-full">
              {gameState === 'paused' ? <Play /> : <Pause />}
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button size="icon" variant="ghost" className="rounded-full"><RefreshCw /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                        <AlertDialogDescription>Your current score will be lost.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={startGame}>Restart</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        <div className="flex items-center gap-2 font-bold text-lg">
            <Timer className="text-destructive"/>
            <span>Time: {timeLeft}s</span>
        </div>
      </div>
      
      <AnimatePresence>
        {animalsOnScreen.map((animal) => (
          <motion.div
            key={animal.id}
            initial={{ scale: 0, rotate: (Math.random() - 0.5) * 45 }}
            animate={{ 
                scale: 1, 
                rotate: 0,
                ...(animal.isMoving ? { 
                    x: (Math.random() - 0.5) * 200, 
                    y: (Math.random() - 0.5) * 200,
                } : {})
            }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 }}}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="absolute cursor-pointer drop-shadow-lg"
            style={{
              width: animal.size,
              height: animal.size,
              top: `${animal.y}%`,
              left: `${animal.x}%`,
            }}
            onClick={() => handleAnimalTap(animal.id)}
          >
            <Image
              src={animal.src}
              alt={animal.name}
              width={animal.size}
              height={animal.size}
              data-ai-hint="animal character"
              className={cn("pointer-events-none rounded-full object-cover w-full h-full", gameState === 'paused' && 'opacity-50')}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
