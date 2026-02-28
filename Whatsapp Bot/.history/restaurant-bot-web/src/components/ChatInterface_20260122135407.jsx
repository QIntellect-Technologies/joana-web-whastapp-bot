import React, { useRef, useEffect, useState } from 'react';
import { Message } from './Message';
import { useBotEngine } from '../hooks/useBotEngine';
import { Send, Phone, Video, MoreVertical, Smile, Paperclip, Mic } from 'lucide-react';

export function ChatInterface() {
    const { messages, isTyping, sendMessage } = useBotEngine();
    const [inputObj, setInputObj] = useState('');
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US'; // Default to English

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputObj(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
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

    const handleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    return (
        <div className="relative w-full max-w-md h-[850px] bg-[#efe7dd] shadow-2xl overflow-hidden flex flex-col font-sans border border-gray-300 rounded-3xl">
            {/* Header */}
            <div className="bg-[#075E54] p-3 text-white flex items-center justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                        <img src="https://cdn-icons-png.flaticon.com/512/194/194935.png" alt="Bot" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-base leading-tight">Gourmet Burger</h1>
                        <p className="text-xs text-green-100 opacity-90 truncate">Online</p>
                    </div>
                </div>
                <div className="flex gap-4 px-1">
                    <Video size={20} />
                    <Phone size={20} />
                    <MoreVertical size={20} />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar relative"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px' }}>
                <div className="absolute inset-0 bg-[#e5ddd5] opacity-90 -z-10"></div>

                {/* Messages */}
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} onOptionClick={sendMessage} />
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm inline-flex items-center gap-1 w-16 h-10">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[#F0F2F5] p-2 flex items-center gap-2 shrink-0">
                <div className="flex gap-3 text-gray-500 px-1">
                    <Smile size={24} />
                    <Paperclip size={24} />
                </div>
                <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 border border-gray-100 shadow-sm">
                    <input
                        type="text"
                        value={inputObj}
                        onChange={(e) => setInputObj(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message"
                        className="w-full outline-none text-gray-700 bg-transparent placeholder-gray-400 text-sm"
                    />
                </div>
                <button
                    onClick={inputObj ? handleSend : null}
                    className="w-10 h-10 rounded-full bg-[#075E54] text-white flex items-center justify-center shadow-sm hover:bg-[#064e46] transition-colors"
                >
                    {inputObj ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
                </button>
            </div>
        </div>
    );
}
