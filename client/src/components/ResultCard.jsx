import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { BadgeCheck, XCircle, ArrowRight } from 'lucide-react';

const ResultCard = ({ results, round, onNext }) => {
    const { answers, match } = results;
    const user1 = answers[0];
    const user2 = answers[1];

    useEffect(() => {
        if (match) {
            triggerConfetti();
        }
    }, [match]);

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            const timeLeft = end - Date.now();
            if (timeLeft <= 0) return;

            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FF9A9E', '#FECFEF', '#A1C4FD']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FF9A9E', '#FECFEF', '#A1C4FD']
            });

            requestAnimationFrame(frame);
        }());
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto w-full"
        >
            <div className={`glass p-8 text-center border-t-8 ${match ? 'border-green-400' : 'border-red-400'}`}>

                <div className="mb-8">
                    {match ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            type="spring"
                            className="inline-block p-4 bg-green-100 rounded-full"
                        >
                            <BadgeCheck className="w-16 h-16 text-green-500" />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            type="spring"
                            className="inline-block p-4 bg-red-100 rounded-full"
                        >
                            <XCircle className="w-16 h-16 text-red-500" />
                        </motion.div>
                    )}

                    <h2 className="text-4xl font-black mt-4 text-indigo-900 tracking-tight">
                        {match ? 'IT\'S A MATCH!' : 'NO MATCH!'}
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">Round {round} Results</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="glass bg-white/40 p-6 rounded-xl transform hover:-rotate-1 transition-transform duration-300">
                        <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Player 1</span>
                        <p className="text-2xl font-bold text-indigo-800 mt-2 break-words">"{user1.answer}"</p>
                    </div>
                    <div className="glass bg-white/40 p-6 rounded-xl transform hover:rotate-1 transition-transform duration-300">
                        <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Player 2</span>
                        <p className="text-2xl font-bold text-indigo-800 mt-2 break-words">"{user2.answer}"</p>
                    </div>
                </div>

                <button
                    onClick={onNext}
                    className="w-full md:w-auto bg-indigo-900 text-white font-bold py-3 px-12 rounded-full shadow-xl hover:bg-black transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                >
                    Next Question <ArrowRight className="w-5 h-5" />
                </button>

            </div>
        </motion.div>
    );
};

export default ResultCard;
