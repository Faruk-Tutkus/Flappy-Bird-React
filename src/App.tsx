import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bird } from 'lucide-react';
import { soundManager } from './sounds';

const GRAVITY = 0.5;
const JUMP_FORCE = -10;
const PIPE_SPEED = 2;
const PIPE_GAP = 200;
const PIPE_SPAWN_RATE = 2000;

interface Pipe {
  x: number;
  height: number;
  id: number;
}

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [birdPosition, setBirdPosition] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const pipeIdRef = useRef(0);

  const generatePipe = useCallback(() => {
    const minHeight = 50;
    const maxHeight = 300;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    return {
      x: 480,
      height,
      id: pipeIdRef.current++
    };
  }, []);

  const startGame = useCallback(() => {
    setGameStarted(true);
    soundManager.startMusic();
    setBirdVelocity(JUMP_FORCE);
    soundManager.playSound('JUMP');
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      if (!gameStarted && !gameOver) {
        startGame();
      } else if (!gameOver) {
        setBirdVelocity(JUMP_FORCE);
        soundManager.playSound('JUMP');
      }
    }
  }, [gameStarted, gameOver, startGame]);

  const resetGame = useCallback(() => {
    setBirdPosition(250);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    soundManager.stopAll();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    let pipeInterval: number;
    
    if (gameStarted && !gameOver) {
      pipeInterval = setInterval(() => {
        setPipes(pipes => [...pipes, generatePipe()]);
      }, PIPE_SPAWN_RATE);
    }

    return () => clearInterval(pipeInterval);
  }, [gameStarted, gameOver, generatePipe]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const updateGame = () => {
      setBirdPosition(pos => {
        const newPos = pos + birdVelocity;
        if (newPos < 0 || newPos > 500) {
          setGameOver(true);
          soundManager.playSound('HIT');
          return pos;
        }
        return newPos;
      });

      setBirdVelocity(vel => vel + GRAVITY);

      setPipes(pipes => {
        return pipes
          .map(pipe => ({
            ...pipe,
            x: pipe.x - PIPE_SPEED,
          }))
          .filter(pipe => pipe.x > -60);
      });

      // Collision detection
      const birdRect = {
        left: 100,
        right: 140,
        top: birdPosition,
        bottom: birdPosition + 40,
      };

      pipes.forEach(pipe => {
        const upperPipeRect = {
          left: pipe.x,
          right: pipe.x + 60,
          top: 0,
          bottom: pipe.height,
        };

        const lowerPipeRect = {
          left: pipe.x,
          right: pipe.x + 60,
          top: pipe.height + PIPE_GAP,
          bottom: 500,
        };

        if (
          (birdRect.right > upperPipeRect.left &&
            birdRect.left < upperPipeRect.right &&
            birdRect.top < upperPipeRect.bottom) ||
          (birdRect.right > lowerPipeRect.left &&
            birdRect.left < lowerPipeRect.right &&
            birdRect.bottom > lowerPipeRect.top)
        ) {
          setGameOver(true);
          soundManager.playSound('HIT');
        }

        // Score increment
        if (pipe.x === 98) {
          setScore(s => {
            const newScore = s + 1;
            setHighScore(hs => Math.max(hs, newScore));
            soundManager.playSound('SCORE');
            return newScore;
          });
        }
      });

      if (!gameOver) {
        frameRef.current = requestAnimationFrame(updateGame);
      }
    };

    frameRef.current = requestAnimationFrame(updateGame);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [gameStarted, gameOver, pipes, birdPosition, birdVelocity]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-500 to-sky-600 flex items-center justify-center">
      <div className="relative w-[480px] h-[500px] bg-transparent rounded-lg shadow-2xl overflow-hidden" ref={gameRef}>
        {/* Parallax Background */}
        <div className="absolute inset-0">
          {/* Far clouds */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1567571393863-c1db49c5c59a?auto=format&fit=crop&w=1280&q=80')] bg-cover bg-center opacity-40 scale-150 animate-[float_20s_linear_infinite]" 
               style={{ transform: 'translateX(-10%)' }} />
          {/* Near clouds */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1567571393863-c1db49c5c59a?auto=format&fit=crop&w=1280&q=80')] bg-cover bg-center opacity-30 scale-125 animate-[float_15s_linear_infinite]" 
               style={{ transform: 'translateX(-20%)' }} />
        </div>
        
        {/* Bird */}
        <div
          className="absolute left-[100px] w-10 h-10 transition-transform duration-100"
          style={{
            top: `${birdPosition}px`,
            transform: `rotate(${birdVelocity * 2}deg)`,
          }}
        >
          <div className={`relative ${gameStarted && !gameOver ? 'animate-wing-flap' : ''}`}>
            <Bird 
              className="w-full h-full text-yellow-400 drop-shadow-lg" 
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                transformOrigin: 'center'
              }}
            />
          </div>
        </div>

        {/* Pipes */}
        {pipes.map(pipe => (
          <React.Fragment key={pipe.id}>
            {/* Upper pipe */}
            <div
              className="absolute w-[60px] bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-b-lg shadow-lg"
              style={{
                left: `${pipe.x}px`,
                height: `${pipe.height}px`,
                top: 0,
              }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-emerald-700 rounded-b-lg" />
            </div>
            {/* Lower pipe */}
            <div
              className="absolute w-[60px] bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-lg shadow-lg"
              style={{
                left: `${pipe.x}px`,
                top: `${pipe.height + PIPE_GAP}px`,
                bottom: 0,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-emerald-700 rounded-t-lg" />
            </div>
          </React.Fragment>
        ))}

        {/* UI Elements */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <div className="bg-white/90 px-6 py-2 rounded-full font-bold text-3xl text-blue-900 shadow-lg">
            {score}
          </div>
        </div>

        {!gameStarted && !gameOver && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={startGame}
          >
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Flappy Bird</h1>
              <p className="text-white text-xl mb-8 drop-shadow">Press SPACE or Click to start</p>
              {highScore > 0 && (
                <p className="text-white text-lg">High Score: {highScore}</p>
              )}
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Game Over!</h2>
              <p className="text-white text-xl mb-2">Score: {score}</p>
              <p className="text-white text-xl mb-8">High Score: {highScore}</p>
              <button
                onClick={resetGame}
                className="bg-white text-blue-900 px-8 py-3 rounded-full text-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;