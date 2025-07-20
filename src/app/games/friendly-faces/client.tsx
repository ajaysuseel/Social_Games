'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from 'lucide-react';

const animals = [
  { name: 'Dog', src: 'https://placehold.co/400x400.png', hint: 'cartoon dog' },
  { name: 'Cat', src: 'https://placehold.co/400x400.png', hint: 'cartoon cat' },
  { name: 'Bear', src: 'https://placehold.co/400x400.png', hint: 'cartoon bear' },
  { name: 'Rabbit', src: 'https://placehold.co/400x400.png', hint: 'cartoon rabbit' },
  { name: 'Fox', src: 'https://placehold.co/400x400.png', hint: 'cartoon fox' },
];

export function FriendlyFacesGame() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (gameState !== 'playing') return;

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to continue.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [gameState, toast]);

  const handleWaveBack = () => {
    if (currentAnimalIndex < animals.length - 1) {
      setCurrentAnimalIndex(prev => prev + 1);
    } else {
      setGameState('end');
    }
  };
  
  const handleStart = () => {
    setGameState('playing');
    setCurrentAnimalIndex(0);
  }

  const handleRestart = () => {
    setGameState('start');
    setHasCameraPermission(null);
  }

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to make new friends?</h2>
        <Button onClick={handleStart}>Start Game</Button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">You made so many friends!</h2>
        <Button onClick={handleRestart}>Play Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
      <AnimatePresence>
        <motion.div
          key={currentAnimalIndex}
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col items-center justify-end p-4"
        >
          <motion.div 
            animate={{ rotate: [0, 15, -10, 15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-48 h-48 md:w-64 md:h-64 relative"
          >
            <Image
              src={animals[currentAnimalIndex].src}
              alt={`A friendly ${animals[currentAnimalIndex].name}`}
              data-ai-hint={animals[currentAnimalIndex].hint}
              fill
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
         <Button onClick={handleWaveBack} size="lg">
            <Hand className="mr-2"/> Wave Back
        </Button>
      </div>

       {hasCameraPermission === false && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-md">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                    This game needs camera access to work. Please allow camera access in your browser and try again.
                    <Button onClick={handleRestart} className="mt-4 w-full">Back to Start</Button>
                </AlertDescription>
            </Alert>
        </div>
       )}
    </div>
  );
}
