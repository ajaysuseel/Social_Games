
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/use-settings';
import { Timer, Rabbit, Turtle } from 'lucide-react';

const animals = [
  { name: 'Cat', src: '/images/animal-tap/cat.png' },
  { name: 'Dog', src: '/images/animal-tap/dog.png' },
  { name: 'Lion', src: '/images/animal-tap/lion.png' },
  { name: 'Duck', src: '/images/animal-tap/duck.png' },
  { name: 'Rabbit', src: '/images/animal-tap/rabbit.png' },
];

const GAME_DURATION = 30; // in seconds

type AnimalOnScreen = {
  id: number;
  name: string;
  src: string;
  x: number;
  y: number;
  size: number;
};

export function AnimalTapClient() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [animalsOnScreen, setAnimalsOnScreen] = useState<AnimalOnScreen[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const { soundEnabled, animationsEnabled } = useSettings();
  const gameIntervalRef = useRef<NodeJS.Timeout>();
  const timerIntervalRef = useRef<NodeJS.Timeout>();

  const playSound = useCallback((type: 'pop' | 'end') => {
    if (!soundEnabled) return;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    if (type === 'pop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440 + Math.random() * 200, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    } else if (type === 'end') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
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
      size: 60 + Math.random() * 60,
    };
    setAnimalsOnScreen((prev) => [...prev, newAnimal].slice(-10)); // Max 10 animals
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setAnimalsOnScreen([]);

    gameIntervalRef.current = setInterval(addAnimal, 1200);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  };
  
  const endGame = useCallback(() => {
    clearInterval(gameIntervalRef.current);
    clearInterval(timerIntervalRef.current);
    setGameState('end');
    playSound('end');
  }, [playSound]);

  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing') {
      endGame();
    }
  }, [timeLeft, gameState, endGame]);
  
  useEffect(() => {
    return () => {
      clearInterval(gameIntervalRef.current);
      clearInterval(timerIntervalRef.current);
    };
  }, []);


  const handleAnimalTap = (id: number) => {
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
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-white/70 dark:bg-black/70 backdrop-blur-sm p-3 rounded-full shadow-lg">
        <div className="flex items-center gap-2 font-bold text-lg">
            <Rabbit className="text-primary"/>
            <span>Score: {score}</span>
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
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 }}}
            transition={{ type: 'spring', stiffness: 260, damping: 15 }}
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
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
