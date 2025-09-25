import React, { useState, useRef } from 'react';

interface RegistrationScreenProps {
  onStartGame: (name: string, description: string) => void;
  onLoadGameFromFile: (fileContent: string) => void;
  isLoading: boolean;
}

export function RegistrationScreen({ onStartGame, onLoadGameFromFile, isLoading }: RegistrationScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
        setError('Имя и описание не могут быть пустыми.');
        return;
    }
    setError('');
    onStartGame(name.trim(), description.trim());
  };
  
  const handleLoadClick = () => {
    // Clear previous errors before opening file dialog
    setError('');
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        try {
          onLoadGameFromFile(text);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неверный формат файла.');
        }
      } else {
         setError('Не удалось прочитать файл.');
      }
    };
    reader.onerror = () => {
        setError('Ошибка при чтении файла.');
    };
    reader.readAsText(file);
    // Reset file input value to allow loading the same file again
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-fantasy-pattern p-4">
        <div className="w-full max-w-lg bg-stone-900/70 border border-amber-800/50 rounded-xl p-8 backdrop-blur-sm shadow-2xl text-center animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-serif-header mb-2">
                Nexus
            </h1>
            <p className="text-stone-400 mb-8">
                Опишите своего пробужденного, чтобы начать поиски истины, или загрузите сохранение.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="char-name" className="block text-amber-200 text-left mb-2 font-semibold">Имя персонажа</label>
                    <input
                        id="char-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Например, Кайден из Тени"
                        className="w-full bg-stone-800/80 border border-amber-700/50 text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-4 py-2 transition-all duration-200"
                        maxLength={50}
                        required
                        disabled={isLoading}
                        aria-label="Имя персонажа"
                    />
                </div>
                <div>
                    <label htmlFor="char-desc" className="block text-amber-200 text-left mb-2 font-semibold">Краткое описание</label>
                    <textarea
                        id="char-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Например: Бывший страж, ищущий искупление в обломках миров..."
                        className="w-full bg-stone-800/80 border border-amber-700/50 text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-4 py-2 transition-all duration-200 resize-none"
                        rows={3}
                        maxLength={1000}
                        required
                        disabled={isLoading}
                        aria-label="Краткое описание персонажа"
                    />
                     <p className="text-xs text-stone-500 text-right mt-1" aria-live="polite">{description.length} / 1000</p>
                </div>

                {error && <p className="text-red-400" role="alert">{error}</p>}
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="button"
                        onClick={handleLoadClick}
                        className="w-full sm:w-1/2 bg-stone-700 text-amber-100 font-bold rounded-lg py-3 text-lg hover:bg-stone-600 transition-colors duration-200 disabled:bg-stone-800 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        Загрузить
                    </button>
                    <button
                        type="submit"
                        className="w-full sm:w-1/2 bg-amber-700 text-stone-900 font-bold rounded-lg py-3 text-lg hover:bg-amber-600 transition-colors duration-200 disabled:bg-stone-600 disabled:cursor-wait shadow-lg shadow-amber-900/30"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Пробуждение...' : 'Начать'}
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json,application/json"
                    aria-hidden="true"
                />
            </form>
        </div>
         <style>{`
            @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
            }
        `}</style>
    </div>
  );
}