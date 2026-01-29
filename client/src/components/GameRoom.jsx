import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Clock } from 'lucide-react';

const GameRoom = ({ socket, roomCode, question, round, onAnswerSubmit }) => {
    const [answer, setAnswer] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [partnerDone, setPartnerDone] = useState(false);

    useEffect(() => {
        // Listen for partner activity
        const handlePartnerAnswer = () => {
            setPartnerDone(true);
        };

        socket.on('partner_answered', handlePartnerAnswer);

        return () => {
            socket.off('partner_answered', handlePartnerAnswer);
        };
    }, [socket]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!answer.trim()) return;

        socket.emit('submit_answer', { roomId: roomCode, answer });
        setHasSubmitted(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto w-full"
        >
            <div className="glass p-8 min-h-[400px] flex flex-col items-center justify-between relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <div className="text-sm font-bold tracking-widest text-indigo-900 border border-indigo-200 px-3 py-1 rounded-full bg-white/30">
                        ROUND {round}
                    </div>
                </div>

                <div className="mt-8 mb-8 text-center w-full z-10">
                    <motion.h2
                        key={question} // Animate on new question
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-3xl font-bold text-indigo-900 leading-tight"
                    >
                        {question}
                    </motion.h2>
                </div>

                {/* Input Area */}
                <div className="w-full relative z-10">
                    {!hasSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full glass-input p-4 text-lg min-h-[120px] resize-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!answer.trim()}
                                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                Lock In Answer <Send className="w-4 h-4" />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-12">
                            <div className="mb-4 flex justify-center">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <Clock className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-indigo-900">Answer Locked In!</h3>
                            <p className="text-indigo-700/80 mt-2">
                                {partnerDone
                                    ? "Revealing results..."
                                    : "Waiting for partner to finish..."}
                            </p>
                        </div>
                    )}
                </div>

                {/* Partner Status Indicator (if waiting for current user) */}
                {!hasSubmitted && partnerDone && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-0 right-0 text-center"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100/50 text-indigo-800 rounded-full text-sm font-medium backdrop-blur-sm border border-indigo-200/50">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Partner has answered!
                        </span>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default GameRoom;
