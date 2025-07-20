'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/use-settings';

const players = {
  P1: { name: 'Player 1', color: 'bg-blue-300' },
  P2: { name: 'Player 2', color: 'bg-yellow-300' },
};

const BUBBLES_PER_TURN = 3;
const GAME_ROUNDS = 2;

type Bubble = {
  id: number;
  x: number;
  y: number;
  size: number;
};

export function BubbleHarmonyGame() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [currentPlayer, setCurrentPlayer] = useState<'P1' | 'P2'>('P1');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [tapsLeft, setTapsLeft] = useState(BUBBLES_PER_TURN);
  const [scores, setScores] = useState({ P1: 0, P2: 0 });
  const [round, setRound] = useState(1);
  const [showTurnIndicator, setShowTurnIndicator] = useState(false);
  const { soundEnabled, animationsEnabled } = useSettings();

  const playSound = useCallback((type: 'pop' | 'reward' | 'turn') => {
    if (!soundEnabled) return;
    // In a real app, you would have different audio files.
    // We'll simulate with browser audio for now.
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    if (type === 'pop') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(300 + Math.random() * 200, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);
    } else if (type === 'reward') {
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1);
    } else if (type === 'turn') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
    }

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);
  }, [soundEnabled]);

  const generateBubbles = () => {
    const newBubbles: Bubble[] = [];
    for (let i = 0; i < 7; i++) {
      newBubbles.push({
        id: Date.now() + i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        size: 40 + Math.random() * 40,
      });
    }
    setBubbles(newBubbles);
  };

  const handleStartGame = () => {
    setScores({ P1: 0, P2: 0 });
    setRound(1);
    setCurrentPlayer('P1');
    setTapsLeft(BUBBLES_PER_TURN);
    generateBubbles();
    setGameState('playing');
    setShowTurnIndicator(true);
  };

  const handleBubbleTap = (id: number) => {
    if (tapsLeft === 0) return;
    playSound('pop');
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setScores((prev) => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 }));
    setTapsLeft((prev) => prev - 1);
  };

  useEffect(() => {
    if (tapsLeft === 0) {
      setTimeout(() => {
        if (currentPlayer === 'P2') {
          if (round < GAME_ROUNDS) {
            setRound(r => r + 1);
            setCurrentPlayer('P1');
            setTapsLeft(BUBBLES_PER_TURN);
            generateBubbles();
            setShowTurnIndicator(true);
            playSound('turn');
          } else {
            setGameState('end');
            playSound('reward');
          }
        } else {
          setCurrentPlayer('P2');
          setTapsLeft(BUBBLES_PER_TURN);
          generateBubbles();
          setShowTurnIndicator(true);
          playSound('turn');
        }
      }, 1500);
    }
  }, [tapsLeft, currentPlayer, round, playSound]);

  useEffect(() => {
    if (showTurnIndicator) {
      const timer = setTimeout(() => setShowTurnIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showTurnIndicator]);

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
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Great job!</h2>
        <p className="mb-2">Player 1: {scores.P1} points</p>
        <p className="mb-4">Player 2: {scores.P2} points</p>
        <Button onClick={handleStartGame}>Play Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] bg-blue-50 dark:bg-gray-800 overflow-hidden">
        <AnimatePresence>
        {showTurnIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <h2 className="text-4xl font-bold text-white drop-shadow-lg">{players[currentPlayer].name}'s Turn!</h2>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex justify-between items-center bg-white/50 dark:bg-black/50 p-2 rounded-full shadow-md">
           <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full ${players.P1.color} border-2 ${currentPlayer === 'P1' ? 'border-primary' : 'border-transparent'}`}></div>
            <span className="font-bold">{scores.P1}</span>
           </div>
           <div className="flex-1 px-4 text-center">
             <p className="font-bold">Round {round}/{GAME_ROUNDS}</p>
             <p className="text-sm text-muted-foreground">{players[currentPlayer].name}, {tapsLeft} taps left</p>
           </div>
            <div className="flex items-center gap-2">
            <span className="font-bold">{scores.P2}</span>
            <div className={`w-8 h-8 rounded-full ${players.P2.color} border-2 ${currentPlayer === 'P2' ? 'border-primary' : 'border-transparent'}`}></div>
           </div>
        </div>
        <Progress value={(BUBBLES_PER_TURN - tapsLeft) / BUBBLES_PER_TURN * 100} className="mt-2 h-2" />
      </div>

      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: Math.random() * 0.2 }}
            className="absolute rounded-full bg-primary/30 border-2 border-primary/50 cursor-pointer"
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
