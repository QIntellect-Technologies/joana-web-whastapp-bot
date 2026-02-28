import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChefAnimationProps {
    branchName: string;
}

const ChefAnimation: React.FC<ChefAnimationProps> = ({ branchName }) => {
    const [phase, setPhase] = useState<'welcome' | 'cooking'>('welcome');

    useEffect(() => {
        const timer = setTimeout(() => setPhase('cooking'), 3500);
        return () => clearTimeout(timer);
    }, []);

    const CHEF_AVATAR_URL = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People%20with%20professions/Man%20Cook%20Medium-Light%20Skin%20Tone.png";

    return (
        <div className="relative w-80 h-80 flex items-center justify-center">
            {/* 1. Background Glow */}
            <motion.div
                className="absolute inset-0 bg-orange-400/10 blur-[50px] rounded-full"
                animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 5 }}
            />

            {/* 2. Welcome Message */}
            <AnimatePresence>
                {phase === 'welcome' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        className="absolute -top-12 left-0 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-xl border border-slate-100 z-50 min-w-[200px]"
                    >
                        <h3 className="text-slate-800 font-bold text-sm leading-tight text-center">
                            Welcome to <span className="text-primary block text-base">{branchName}</span>
                        </h3>
                        <div className="absolute bottom-0 left-10 w-4 h-4 bg-white transform rotate-45 translate-y-1/2 rounded-bl-sm"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. The Chef (Central Pillar) */}
            <motion.div
                className="relative z-20 w-48 h-48 flex items-center justify-center"
                animate={phase === 'cooking' ? { y: [0, -5, 0] } : { y: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
                <img
                    src={CHEF_AVATAR_URL}
                    alt="Chef"
                    className="w-full h-full object-contain drop-shadow-2xl filter brightness-105"
                />
            </motion.div>

            {/* 4. Revolving Food Orbit */}
            {/* Container rotates, items counter-rotate to stay upright if needed, or just float */}
            <AnimatePresence>
                {phase === 'cooking' && (
                    <div className="absolute inset-0 pointer-events-none z-10 w-full h-full">
                        {/* We create a rotating ring */}
                        <motion.div
                            className="w-full h-full relative"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        >
                            {/* Items placed at absolute positions on the circle */}
                            {/* Radius approx 120px (container is 320px wide/high roughly) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
                                <FoodItem icon="🍔" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4">
                                <FoodItem icon="🍕" />
                            </div>
                            <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2">
                                <FoodItem icon="🍟" />
                            </div>
                            <div className="absolute top-1/2 left-0 -translate-x-4 -translate-y-1/2">
                                <FoodItem icon="🥤" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 5. Status Badge */}
            <div className="absolute bottom-6 bg-white/95 shadow-xl px-5 py-2 rounded-full border border-slate-100 flex items-center gap-2 z-30">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                    Preparing Fresh
                </span>
            </div>
        </div>
    );
};

// Helper for rotating items to keep them upright (Counter Rotation)
const FoodItem = ({ icon }: { icon: string }) => (
    <motion.div
        className="w-12 h-12 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center text-2xl"
        animate={{ rotate: -360 }} // Counter rotate to keep emoji upright relative to screen
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
    >
        {icon}
    </motion.div>
);

export default ChefAnimation;
