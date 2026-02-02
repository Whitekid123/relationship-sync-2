import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import ResultCard from './components/ResultCard';
import { Toaster, toast } from 'react-hot-toast';

const GAME_STATES = {
    LOBBY: 'LOBBY',
    PLAYING: 'PLAYING',
    RESULTS: 'RESULTS'
};

function App() {
    const { socket, isConnected } = useSocket();
    const [gameState, setGameState] = useState(GAME_STATES.LOBBY);

    // Game Data
    const [roomCode, setRoomCode] = useState('');
    const [question, setQuestion] = useState('');
    const [round, setRound] = useState(0);
    const [results, setResults] = useState(null);
    
    // NEW: Score / Streak State
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!socket) return;

        // Room Created
        socket.on('room_created', (code) => {
            setRoomCode(code);
            setScore(0); // Reset score on new game
            toast.success(`Room Created! Code: ${code}`);
        });

        // Game Started
        socket.on('game_started', ({ question, round }) => {
            setQuestion(question);
            setRound(round);
            setScore(0); // Reset score on game start
            setGameState(GAME_STATES.PLAYING);
            toast.success('Game Started! Good Luck!');
        });

        // Round Results (THIS IS WHERE THE MAGIC HAPPENS)
        socket.on('round_results', (data) => {
            setResults(data);

            if (data.match) {
                // 1. INCREASE STREAK
                setScore(prev => prev + 1);

                // 2. VIBRATE (Mobile Only) - 200ms buzz
                if (navigator.vibrate) navigator.vibrate(200);

                // 3. PLAY SOUND (Optional)
                new Audio('/sounds/match.mp3').play().catch(() => {}); 
            } else {
                // 1. RESET STREAK (Challenge Mode!)
                setScore(0);

                // 2. VIBRATE - Double buzz for error
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

                // 3. PLAY SOUND (Optional)
                new Audio('/sounds/fail.mp3').play().catch(() => {});
            }

            setGameState(GAME_STATES.RESULTS);
        });

        // Next Round
        socket.on('next_round', ({ question, round }) => {
            setQuestion(question);
            setRound(round);
            setGameState(GAME_STATES.PLAYING);
        });

        // Errors
        socket.on('error', (msg) => {
            toast.error(msg);
        });

        // Waiting
        socket.on('waiting_for_partner', () => {
            toast('Waiting for partner to join...', { icon: '⏳' });
        });

        // Partner Disconnected
        socket.on('partner_disconnected', () => {
            toast.error('Partner disconnected!');
            setGameState(GAME_STATES.LOBBY);
            setRoomCode('');
            setQuestion('');
            setScore(0);
        });

        return () => {
            socket.off('room_created');
            socket.off('game_started');
            socket.off('round_results');
            socket.off('next_round');
            socket.off('error');
            socket.off('waiting_for_partner');
            socket.off('partner_disconnected');
        };
    }, [socket]);

    const handleNextRound = () => {
        socket.emit('next_question', roomCode);
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-indigo-900 font-bold text-xl">
                    Connecting to server...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 flex flex-col items-center pt-12">
            <Toaster position="top-center" />

            <div className="w-full max-w-4xl z-10">
                {gameState === GAME_STATES.LOBBY && (
                    <Lobby 
                        socket={socket} 
                        onJoin={(code) => setRoomCode(code)} 
                    />
                )}

                {gameState === GAME_STATES.PLAYING && (
                    <GameRoom
                        socket={socket}
                        roomCode={roomCode}
                        question={question}
                        round={round}
                        // Pass score so we can see it while playing!
                        score={score} 
                        onAnswerSubmit={() => { }}
                    />
                )}

                {gameState === GAME_STATES.RESULTS && (
                    <ResultCard
                        results={results}
                        round={round}
                        // Pass score to show the streak
                        score={score}
                        onNext={handleNextRound}
                    />
                )}
            </div>

            {/* Room Code Indicator */}
            {roomCode && gameState !== GAME_STATES.LOBBY && (
                <div className="fixed bottom-4 right-4 glass px-4 py-2 text-xs font-mono text-indigo-900 opacity-60 hover:opacity-100 transition-opacity">
                    ROOM: {roomCode}
                </div>
            )}
        </div>
    );
}

export default App;