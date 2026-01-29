import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Users, ArrowRight } from 'lucide-react';

const Lobby = ({ socket, onJoin }) => {
    const [roomCode, setRoomCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState('');

    const createRoom = () => {
        socket.emit('create_room');
    };

    const joinRoom = (e) => {
        e.preventDefault();
        if (roomCode.length !== 4) {
            setError('Code must be 4 characters');
            return;
        }
        
        const code = roomCode.toUpperCase();
        
        // 1. Tell the Server
        socket.emit('join_room', code);
        
        // 2. Tell the App (THIS WAS MISSING!)
        onJoin(code); 
        
        setIsJoining(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto w-full"
        >
            <div className="glass p-8 text-center bg-white/30">
                <div className="mb-6 flex justify-center">
                    <div className="bg-white/50 p-4 rounded-full shadow-lg">
                        <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold mb-2 text-gray-800 tracking-tight">Relationship Sync</h1>
                <p className="text-gray-600 mb-8 font-medium">Test how well you know your partner!</p>

                <div className="space-y-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={createRoom}
                        className="w-full glass-btn text-lg py-4 px-6 text-indigo-900 flex items-center justify-center gap-2 group"
                    >
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Create New Room
                    </motion.button>

                    <div className="relative flex items-center gap-4 py-2">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-gray-400 text-sm font-semibold">OR</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <form onSubmit={joinRoom} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                maxLength={4}
                                value={roomCode}
                                onChange={(e) => {
                                    setRoomCode(e.target.value.toUpperCase());
                                    setError('');
                                }}
                                placeholder="ENTER ROOM CODE"
                                className="w-full glass-input text-center text-2xl font-bold tracking-[0.5em] py-3 placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-normal uppercase"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={!roomCode}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            Join Room <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
};

export default Lobby;