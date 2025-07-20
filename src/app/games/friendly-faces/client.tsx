
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { detectWave } from '@/ai/flows/detect-wave';
import { generateSpeech } from '@/ai/flows/speech';
import { Progress } from '@/components/ui/progress';

const character = { name: 'Friendly Character', src: '/videos/character.mp4' };

export function FriendlyFacesGameClient() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [isDetecting, setIsDetecting] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = undefined;
    }
    setIsDetecting(false);
  }, []);

  const handleWaveDetected = useCallback(async () => {
    try {
      const { audioUrl: generatedAudioUrl } = await generateSpeech({ text: 'Hello' });
      setAudioUrl(generatedAudioUrl);
    } catch(e) {
      console.error("Failed to generate speech", e);
      // Fallback or just end the game
      setGameState('end');
    }
  }, []);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().then(() => {
        setGameState('end');
      }).catch(e => {
        console.error("Failed to play audio", e);
        setGameState('end'); // Still end the game
      });
    }
  }, [audioUrl]);

  const handleDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isDetecting) return;

    setIsDetecting(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoDataUri = canvas.toDataURL('image/jpeg');
      
      try {
        const result = await detectWave({ photoDataUri });
        if (result.isWaving) {
          stopDetection();
          await handleWaveDetected();
        }
      } catch (error) {
        console.error("Detection failed:", error);
        // Do not stop detection on error, just log it. The user can try again.
      }
    }
    setIsDetecting(false);
  }, [isDetecting, stopDetection, handleWaveDetected]);

  useEffect(() => {
    if (gameState === 'playing' && hasCameraPermission) {
      detectionIntervalRef.current = setInterval(handleDetection, 5000); // Check every 5 seconds
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [gameState, hasCameraPermission, handleDetection, stopDetection]);

  useEffect(() => {
    const cleanup = () => {
      stopDetection();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (gameState !== 'playing') {
      cleanup();
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

    return cleanup;
  }, [gameState, toast, stopDetection]);
  
  const handleStart = () => {
    setGameState('playing');
    setAudioUrl(null);
  };
  
  const handleRestart = () => {
    setGameState('start');
    setHasCameraPermission(null);
  };

  if (gameState === 'start') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">Ready to make a new friend?</h2>
        <Button onClick={handleStart}>Start Game</Button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-96">
        <h2 className="text-2xl font-bold mb-4">You made a new friend!</h2>
        <Button onClick={handleRestart}>Play Again</Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1] hidden" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <div className="w-full h-full relative">
          <video
            key={character.src}
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={character.src} type="video/mp4" />
          </video>
        </div>
      </motion.div>

      {gameState === 'playing' && hasCameraPermission && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
               <div className="max-w-md mx-auto bg-white/30 backdrop-blur-sm p-3 rounded-full text-center">
                    <p className="font-bold text-card-foreground">Wave to the character to say hello!</p>
                    {isDetecting && <Progress value={100} className="h-1 mt-2 animate-pulse" />}
               </div>
          </div>
      )}

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
