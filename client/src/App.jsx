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

    useEffect(() => {
        if (!socket) return;

        // Room Created
        socket.on('room_created', (code) => {
            setRoomCode(code);
            toast.success(`Room Created! Code: ${code}`);
        });

        // Game Started
        socket.on('game_started', ({ question, round }) => {
            setQuestion(question);
            setRound(round);
            setGameState(GAME_STATES.PLAYING);
            toast.success('Game Started! Good Luck!');
        });

        // Round Results
        socket.on('round_results', (data) => {
            setResults(data);
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
                        // FIX 1: Save the code when joining!
                        onJoin={(code) => setRoomCode(code)} 
                    />
                )}

                {gameState === GAME_STATES.PLAYING && (
                    <GameRoom
                        socket={socket}
                        roomCode={roomCode}
                        // FIX 2: Correct spelling "question"
                        question={question} 
                        round={round}
                        onAnswerSubmit={() => { }}
                    />
                )}

                {gameState === GAME_STATES.RESULTS && (
                    <ResultCard
                        results={results}
                        round={round}
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