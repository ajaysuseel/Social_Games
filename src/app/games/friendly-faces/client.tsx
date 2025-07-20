'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, RefreshCw } from 'lucide-react';

const animalTypes = ['Dog', 'Cat', 'Bear', 'Rabbit', 'Fox'];

type AnimalVideo = {
  name: string;
  src: string;
};

type FriendlyFacesGameClientProps = {
  handleGenerateVideo: (animalType: string) => Promise<string>;
};

export function FriendlyFacesGameClient({ handleGenerateVideo }: FriendlyFacesGameClientProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [animalVideos, setAnimalVideos] = useState<AnimalVideo[]>([]);
  const [gameState, setGameState] = useState<'start' | 'loading' | 'playing' | 'end'>('start');
  const [animalIndex, setAnimalIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animalVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const preloadAnimalVideos = useCallback(async () => {
    setGameState('loading');
    setLoadingProgress(0);
    const generatedVideos: AnimalVideo[] = [];
    try {
      for (let i = 0; i < animalTypes.length; i++) {
        const animalType = animalTypes[i];
        const videoUrl = await handleGenerateVideo(animalType);
        if (videoUrl) {
          generatedVideos.push({ name: animalType, src: videoUrl });
        } else {
           // If one fails, maybe we just skip it or show an error and stop.
           // For now, let's stop and show an error.
           throw new Error(`Failed to generate video for ${animalType}`);
        }
        setLoadingProgress(((i + 1) / animalTypes.length) * 100);
      }
      setAnimalVideos(generatedVideos);
      setGameState('playing');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Generating Animals',
        description: 'Could not create new friends. Please try again later.',
      });
      setGameState('start');
    }
  }, [handleGenerateVideo, toast]);

  useEffect(() => {
    if (gameState !== 'playing') {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

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
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [gameState, toast]);

  const handleWaveBack = () => {
    const nextIndex = animalIndex + 1;
    if (nextIndex < animalVideos.length) {
      setAnimalIndex(nextIndex);
    } else {
      setGameState('end');
    }
  };
  
  const handleStart = () => {
    setAnimalIndex(0);
    setAnimalVideos([]);
    preloadAnimalVideos();
  };
  
  const handleRestart = () => {
    setGameState('start');
    setAnimalVideos([]);
    setAnimalIndex(0);
    setHasCameraPermission(null);
  };

  useEffect(() => {
    if(animalVideoRef.current){
        animalVideoRef.current.load();
    }
  }, [animalIndex])

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to make new friends?</h2>
        <Button onClick={handleStart}>Start Game</Button>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <RefreshCw className="w-16 h-16 text-primary animate-spin"/>
        <p className="text-muted-foreground mt-4 mb-2">Making new friends... this might take a minute.</p>
        <Progress value={loadingProgress} className="w-64" />
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
  
  const currentAnimal = animalVideos[animalIndex];

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay muted playsInline />
      <AnimatePresence>
        {currentAnimal && (
          <motion.div
            key={currentAnimal.name + animalIndex}
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-4"
          >
            <div
              className="w-48 h-48 md:w-64 md:h-64 relative drop-shadow-2xl"
            >
              <video
                ref={animalVideoRef}
                key={currentAnimal.src}
                className="w-full h-full object-contain rounded-full"
                autoPlay
                loop
                muted
                playsInline
              >
                  <source src={currentAnimal.src} type="video/mp4" />
              </video>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <Button onClick={handleWaveBack} size="lg">
          <Hand className="mr-2" /> Wave Back
        </Button>
      </div>

      {hasCameraPermission === false && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
              This game needs camera access to work. Please allow camera access in your browser and try again.
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
