import React, { useRef, useEffect, useState } from 'react';
import { Message } from './Message';
import { useBotEngine } from '../hooks/useBotEngine';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic } from 'lucide-react';

import { translations } from '../data/translations';

export function ChatInterface() {
    const { messages, isTyping, sendMessage, language, voiceTrigger } = useBotEngine();
    const t = translations[language || 'en'];
    const [inputObj, setInputObj] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Auto-trigger voice when requested from bot engine (Standardized)
    useEffect(() => {
        if (voiceTrigger && !isListening) {
            startVoiceRecognition();
        }
    }, [voiceTrigger]);

    // Internal start helper
    const startVoiceRecognition = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert(t.speech_unsupported);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        // Stop any current instance
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }

        // Create FRESH instance for this session
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';

        recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            setIsListening(true);
            setInputObj('');
        };

        recognition.onresult = (event) => {
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            if (fullTranscript) {
                setInputObj(fullTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error('🎤 Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                alert(t.mic_denied);
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            console.log('🎤 Voice recognition ended');
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (e) {
            console.error('🎤 Failed to start recognition:', e);
            setIsListening(false);
        }
    };

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }
        setIsListening(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { }
            }
        };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = () => {
        if (inputObj.trim()) {
            sendMessage(inputObj);
            setInputObj('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleVoiceToggle = () => {
        if (isListening) {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    };

    return (
        <div className="relative w-full max-w-full h-screen bg-[#efe7dd] shadow-2xl overflow-hidden flex flex-col font-sans border-x border-gray-300">
            {/* Header */}
            <div className="bg-[#075E54] p-3 text-white flex items-center justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/10">
                        <img src="https://cdn-icons-png.flaticon.com/512/194/194935.png" alt="Bot" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-base leading-tight">Gourmet Burger</h1>
                        <p className="text-xs text-green-100 opacity-90 truncate flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 px-1 opacity-90">
                    <Video size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                    <Phone size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                    <MoreVertical size={20} className="cursor-pointer hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar relative"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                <div className="absolute inset-0 bg-[#e5ddd5] opacity-92 -z-10"></div>

                {/* Messages */}
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} onOptionClick={sendMessage} language={language} />
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm inline-flex items-center gap-1.5 min-w-[64px]">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#F0F2F5] p-3 flex items-center gap-2 shrink-0 relative">
                {isListening && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-2.5 rounded-full shadow-[0_4px_20px_rgba(220,38,38,0.3)] animate-bounce flex items-center gap-3 border-2 border-white/50 z-50">
                        <div className="relative">
                            <span className="block w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                            <span className="absolute inset-0 w-2.5 h-2.5 bg-white rounded-full"></span>
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase">{t.listening}</span>
                    </div>
                )}
                <div className="flex gap-3 text-gray-500 px-1 opacity-70">
                    <Smile size={24} className="cursor-pointer hover:text-gray-700" />
                    <Paperclip size={24} className="cursor-pointer hover:text-gray-700" />
                </div>
                <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-2.5 border border-gray-200 shadow-sm focus-within:border-[#075E54] focus-within:ring-1 focus-within:ring-[#075E54]/20 transition-all">
                    <input
                        type="text"
                        value={inputObj}
                        onChange={(e) => setInputObj(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={t.type_message}
                        className="w-full outline-none text-gray-700 bg-transparent placeholder-gray-400 text-sm md:text-base"
                    />
                </div>
                <button
                    onClick={isListening ? handleVoiceToggle : (inputObj ? handleSend : handleVoiceToggle)}
                    className={`w-11 h-11 rounded-full ${isListening ? 'bg-red-500 ring-4 ring-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#075E54] hover:bg-[#064e46]'} text-white flex items-center justify-center shadow-lg active:scale-95 transition-all outline-none z-10`}
                >
                    {isListening ? (
                        <Mic size={22} className="relative z-10" />
                    ) : (
                        inputObj ? <Send size={22} className="ml-0.5" /> : <Mic size={22} />
                    )}
                </button>
            </div>
        </div>
    );
}
