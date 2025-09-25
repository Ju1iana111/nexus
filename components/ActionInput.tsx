import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface ActionInputProps {
  onSubmit: (action: string) => void;
  suggestedActions: string[];
  disabled?: boolean;
}

export function ActionInput({ onSubmit, suggestedActions, disabled = false }: ActionInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };
  
  const handleSuggestionClick = (action: string) => {
    onSubmit(action);
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
        {suggestedActions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4">
                {suggestedActions.map((action, index) => (
                    <button
                        key={index}
                        onClick={() => handleSuggestionClick(action)}
                        disabled={disabled}
                        className="bg-stone-800/90 border border-amber-700/50 text-amber-200 px-4 py-2 rounded-md text-sm hover:bg-amber-800/60 hover:text-amber-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        {action}
                    </button>
                ))}
            </div>
        )}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-stone-900/80 border border-amber-800/50 rounded-lg p-2 shadow-lg">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={disabled ? "Судьба плетёт свой узор..." : "Что предпринять?"}
          disabled={disabled}
          className="flex-grow bg-transparent text-amber-100 placeholder-stone-500 focus:outline-none px-3 py-1 disabled:opacity-50"
        />
        <button
          type="submit"
          className="bg-amber-700 text-stone-900 rounded-lg p-3 hover:bg-amber-600 transition-colors duration-200 disabled:bg-stone-600/70 disabled:hover:bg-stone-600/70 disabled:cursor-not-allowed flex items-center justify-center shadow-inner shadow-amber-900/50"
          disabled={!inputValue.trim() || disabled}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}