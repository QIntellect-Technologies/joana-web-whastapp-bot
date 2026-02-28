import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { CheckCheck } from 'lucide-react';
import { translations } from '../data/translations';

export function Message({ message, onOptionClick, language }) {
    const isUser = message.sender === 'user';
    const [clickedButtonId, setClickedButtonId] = useState(null);
    const t = translations[language || 'en'];

    const handleButtonClick = (optionId) => {
        if (clickedButtonId) return; // Prevent clicking if already clicked
        setClickedButtonId(optionId);
        onOptionClick(optionId);
    };

    return (
        <div className={cn("flex w-full mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-xl shadow-sm relative text-sm leading-relaxed overflow-hidden",
                    isUser ? "bg-[#d9fdd3] rounded-tr-none text-gray-900" : "bg-white rounded-tl-none text-gray-900"
                )}
            >
                <div className="px-3 py-2">
                    {/* Render Text with Markdown-like bold detection (simple) */}
                    {/* Render Image or Text */}
                    {message.type === 'image' ? (
                        <div className="mb-2">
                            <img
                                src={message.text}
                                alt="Shared image"
                                className="w-full h-auto rounded-lg object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.textContent = '❌ Image not found';
                                }}
                            />
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap">
                            {message.text.split('\n').map((line, i) => (
                                <p key={i} className="min-h-[1.2em]">
                                    {line.split(/(\*[^*]+\*)/).map((part, j) => {
                                        if (part.startsWith('*') && part.endsWith('*')) {
                                            return <strong key={j} className="font-bold text-gray-900">{part.slice(1, -1)}</strong>;
                                        }
                                        return part;
                                    })}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Render Options Buttons */}
                    {message.options && message.options.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-dashed border-gray-200 pt-2">
                            <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-wide">
                                {t.select_option}
                            </p>
                            {message.options.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleButtonClick(opt.id)}
                                    disabled={clickedButtonId !== null}
                                    className={cn(
                                        "w-full border rounded-lg font-semibold py-2.5 transition-all text-center shadow-sm",
                                        clickedButtonId === null
                                            ? "bg-slate-50 border-transparent text-[#008a71] hover:bg-slate-100 active:scale-95 cursor-pointer"
                                            : clickedButtonId === opt.id
                                                ? "bg-[#008a71] border-[#008a71] text-white cursor-not-allowed"
                                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex justify-end items-center gap-1 mt-1 opacity-50 select-none">
                        <span className="text-[10px] font-medium">{message.timestamp}</span>
                        {isUser && <CheckCheck size={14} className="text-[#53bdeb]" />}
                    </div>
                </div>
            </div>
        </div>
    );
}
