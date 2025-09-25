import React, { useState } from 'react';
import { RestartIcon, SaveIcon, DownloadIcon } from './Icons';

interface GameHeaderProps {
    onNewGame: () => void;
    onSaveGame: () => void;
    onSaveAs: () => void;
}

export function GameHeader({ onNewGame, onSaveGame, onSaveAs }: GameHeaderProps) {
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    const handleSaveClick = () => {
        onSaveGame();
        setSaveMessage('Сохранено!');
        const timer = setTimeout(() => {
            setSaveMessage(null);
        }, 2000);
        return () => clearTimeout(timer);
    };

    return (
        <header className="relative text-center py-4 md:py-6 border-b border-amber-900/50">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-serif-header">
                    Nexus — Искра Утраты
                </h1>
                <p className="text-stone-400 mt-2 text-sm md:text-base">
                    Текстовая RPG на базе Gemini
                </p>
            </div>
            <div className="absolute top-1/2 right-4 md:right-6 -translate-y-1/2 flex items-center gap-2">
                 <button
                    onClick={onSaveAs}
                    title="Сохранить как..."
                    className="flex items-center gap-2 text-stone-400 hover:text-white transition-all duration-200 bg-stone-800/50 hover:bg-stone-700/70 px-3 py-2 rounded-lg text-sm"
                >
                    <DownloadIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Сохранить как</span>
                </button>
                <button
                    onClick={handleSaveClick}
                    title="Сохранить игру"
                    className="flex items-center gap-2 text-stone-400 hover:text-white transition-all duration-200 bg-stone-800/50 hover:bg-stone-700/70 px-3 py-2 rounded-lg text-sm"
                    disabled={!!saveMessage}
                >
                    <SaveIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">{saveMessage || 'Сохранить'}</span>
                </button>
                <button
                    onClick={onNewGame}
                    title="Начать новую игру"
                    className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors duration-200 bg-stone-800/50 hover:bg-stone-700/70 px-3 py-2 rounded-lg text-sm"
                >
                    <RestartIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">Новая игра</span>
                </button>
            </div>
        </header>
    );
}