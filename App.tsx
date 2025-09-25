import React, { useState, useEffect, useCallback } from 'react';
import { GameHeader } from './components/GameHeader';
import { GameScreen } from './components/GameScreen';
import { ActionInput } from './components/ActionInput';
import { Inventory } from './components/Inventory';
import { LoadingIndicator } from './components/LoadingIndicator';
import { RegistrationScreen } from './components/RegistrationScreen';
import { getGameResponse, getInitialStats } from './services/geminiService';
import * as db from './utils/db';
import { saveGameToFile } from './utils/fileSaver';
import type { Message, Quest, CharacterStats as CharacterStatsType, CombatState, PlayerInfo, GameState } from './types';
import { MessageRole, QuestStatus } from './types';
import { locationsByFaction } from './data/locations';

// Locally defined Notification Components
const QuestNotification: React.FC<{ quest: Quest; type: 'new' | 'completed' }> = ({ quest, type }) => {
  const message = type === 'new' ? 'Новый квест' : 'Квест завершен';
  const bgColor = type === 'new' ? 'bg-green-900 border border-green-600' : 'bg-amber-800 border border-amber-500';
  return (
    <div className={`fixed bottom-10 right-10 ${bgColor} text-white p-4 rounded-lg shadow-xl animate-fade-in-out z-50`}>
      <p className="font-bold font-serif-header">{message}</p><p>{quest.title}</p>
    </div>
  );
};

const StatNotification: React.FC<{ type: 'xp' | 'level'; value: number }> = ({ type, value }) => {
  const isLevelUp = type === 'level';
  const message = isLevelUp ? `Новый уровень: ${value}!` : `Получено опыта: +${value} XP`;
  const bgColor = isLevelUp ? 'bg-yellow-600 border border-yellow-400' : 'bg-indigo-800 border border-indigo-500';
  return (
    <div className={`fixed bottom-24 right-10 ${bgColor} text-white p-4 rounded-lg shadow-xl animate-fade-in-out z-50`}>
      <p className="font-bold font-serif-header">{message}</p>
    </div>
  );
};

const EventNotification: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className={`fixed bottom-40 right-10 bg-orange-800 border border-orange-500 text-white p-4 rounded-lg shadow-xl animate-fade-in-out z-50`}>
      <p className="font-bold font-serif-header">Случайное событие!</p>
      <p>{message}</p>
    </div>
  );
};


const initialStats: CharacterStatsType = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  strength: 5,
  dexterity: 5,
  intelligence: 5,
  hp: 20,
  maxHp: 20,
  reputation: {
    pantheon_light: 0,
    pantheon_dark: 0,
    pantheon_neutral: 0,
  },
};

const initialCombatState: CombatState = {
    isActive: false,
    enemies: [],
    turn: 'player',
    log: [],
};

const App: React.FC = () => {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [characterStats, setCharacterStats] = useState<CharacterStatsType>(initialStats);
  const [combatState, setCombatState] = useState<CombatState>(initialCombatState);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [locationDescription, setLocationDescription] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [newItem, setNewItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questUpdate, setQuestUpdate] = useState<{ quest: Quest; type: 'new' | 'completed' } | null>(null);
  const [statUpdate, setStatUpdate] = useState<{ type: 'xp' | 'level'; value: number } | null>(null);
  const [eventNotification, setEventNotification] = useState<string | null>(null);
  const [isCoolingDown, setIsCoolingDown] = useState<boolean>(false);
  
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [openFactions, setOpenFactions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadGame = async () => {
        const savedGame = await db.loadGameState();
        if (savedGame && savedGame.playerInfo) {
            handleLoadGame(savedGame);
        }
        setIsInitialLoading(false);
    };
    loadGame();
  }, []);

  useEffect(() => {
    if (currentLocation) {
        const initialOpenState: Record<string, boolean> = {};
        for (const faction in locationsByFaction) {
            if (locationsByFaction[faction].some(loc => loc.name === currentLocation)) {
                initialOpenState[faction] = true;
                break;
            }
        }
        setOpenFactions(prev => ({ ...prev, ...initialOpenState }));
    }
  }, [currentLocation]);


  const startGame = useCallback(async (newPlayerInfo: Omit<PlayerInfo, 'playerId'>) => {
    setIsLoading(true);
    setError(null);
    
    const initialHistory: Message[] = [];
    setMessages(initialHistory);
    setInventory([]);
    setQuests([]);
    setCombatState(initialCombatState);
    setCurrentLocation(null);
    setLocationDescription(null);
    setSuggestedActions([]);
    
    const playerId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const fullPlayerInfo = { ...newPlayerInfo, playerId };
    
    try {
        const generatedStats = await getInitialStats(fullPlayerInfo);
        const startingStats: CharacterStatsType = {
            ...initialStats,
            ...generatedStats,
        };
        
        const response = await getGameResponse(initialHistory, [], [], startingStats, initialCombatState, fullPlayerInfo);

        const firstMessage: Message = { role: MessageRole.GAME_MASTER, content: response.description };
        setMessages([firstMessage]);
        setInventory(response.inventory);
        setQuests(response.quests);
        setCharacterStats(response.characterStats);
        setCombatState(response.combatState);
        setCurrentLocation(response.currentLocation ?? 'unknown');
        setLocationDescription(response.locationDescription ?? null);
        setSuggestedActions(response.suggested_actions);
        setPlayerInfo(fullPlayerInfo);

        const gameState: GameState = {
            messages: [firstMessage],
            inventory: response.inventory,
            quests: response.quests,
            characterStats: response.characterStats,
            combatState: response.combatState,
            currentLocation: response.currentLocation ?? 'unknown',
            locationDescription: response.locationDescription ?? null,
            playerInfo: fullPlayerInfo,
        };
        await db.saveGameState(gameState);

    } catch (e) {
        setError(e instanceof Error ? e.message : "Произошла ошибка при начале новой игры.");
        setMessages([{ role: MessageRole.GAME_MASTER, content: "Не удалось загрузить мир Нексуса. Попробуйте обновить страницу."}]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleGameStart = (name: string, description: string) => {
    startGame({ name, description });
  };

  const handleLoadGame = (loadedState: GameState) => {
    if (loadedState && loadedState.playerInfo) {
      setMessages(loadedState.messages);
      setInventory(loadedState.inventory);
      setQuests(loadedState.quests || []);
      setCharacterStats({ ...initialStats, ...loadedState.characterStats });
      setCombatState(loadedState.combatState || initialCombatState);
      setCurrentLocation(loadedState.currentLocation || null);
      setLocationDescription(loadedState.locationDescription || null);
      setPlayerInfo(loadedState.playerInfo);
      setSuggestedActions([]);
    } else {
      setError("Не удалось загрузить сохранение. Данные повреждены.");
    }
  };

  const handleLoadGameFromFile = (fileContent: string) => {
    try {
        const loadedState = JSON.parse(fileContent) as GameState;
        // Basic validation to ensure it's a valid save file
        if (loadedState && loadedState.playerInfo && loadedState.messages && loadedState.characterStats) {
            handleLoadGame(loadedState);
        } else {
            throw new Error("Файл сохранения имеет неверный формат или поврежден.");
        }
    } catch (e) {
        console.error("Failed to load game from file:", e);
        throw new Error("Не удалось прочитать файл сохранения. Убедитесь, что это правильный JSON-файл.");
    }
  };

  const handleNewGame = async () => {
    if (window.confirm("Вы уверены, что хотите начать новую игру? Весь текущий прогресс будет потерян.")) {
        await db.clearGameState();
        setPlayerInfo(null);
        setMessages([]);
        setInventory([]);
        setQuests([]);
        setCharacterStats(initialStats);
        setCombatState(initialCombatState);
        setCurrentLocation(null);
        setLocationDescription(null);
        setError(null);
    }
  };

  const handleSaveGame = async () => {
    if (playerInfo) {
      const gameState: GameState = {
        messages,
        inventory,
        quests,
        characterStats,
        combatState,
        currentLocation,
        locationDescription,
        playerInfo,
      };
      await db.saveGameState(gameState);
    }
  };

  const handleSaveAs = () => {
    if (playerInfo) {
      const gameState: GameState = {
        messages,
        inventory,
        quests,
        characterStats,
        combatState,
        currentLocation,
        locationDescription,
        playerInfo,
      };
      saveGameToFile(gameState);
    }
  };

  useEffect(() => {
    if (newItem) {
      const timer = setTimeout(() => setNewItem(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [newItem]);
  
  useEffect(() => {
    const notificationTimer = (setter: React.Dispatch<React.SetStateAction<any>>) => {
        const timer = setTimeout(() => setter(null), 5000);
        return () => clearTimeout(timer);
    };
    if (questUpdate) notificationTimer(setQuestUpdate);
    if (statUpdate) notificationTimer(setStatUpdate);
    if (eventNotification) notificationTimer(setEventNotification);
  }, [questUpdate, statUpdate, eventNotification]);


  const handlePlayerAction = async (action: string) => {
    if (isLoading || isCoolingDown || !playerInfo || !currentLocation) return;

    setIsLoading(true);
    setError(null);
    setSuggestedActions([]);
    if (newItem) setNewItem(null);

    const newPlayerMessage: Message = { role: MessageRole.PLAYER, content: action };
    const history = [...messages, newPlayerMessage];
    setMessages(history);

    try {
      const response = await getGameResponse(history, inventory, quests, characterStats, combatState, playerInfo);
      
      const newGameMasterMessage: Message = { role: MessageRole.GAME_MASTER, content: response.description };
      setMessages(prev => [...prev, newGameMasterMessage]);
      setInventory(response.inventory);
      setSuggestedActions(response.suggested_actions);
      setCombatState(response.combatState);
      setCurrentLocation(response.currentLocation ?? 'unknown');
      setLocationDescription(response.locationDescription ?? null);

      const oldQuestIds = new Set(quests.map(q => q.id));
      const oldCompletedQuestIds = new Set(quests.filter(q => q.status === QuestStatus.COMPLETED).map(q => q.id));
      response.quests.forEach(newQuest => {
        if (!oldQuestIds.has(newQuest.id)) {
          setQuestUpdate({ quest: newQuest, type: 'new' });
        } else if (!oldCompletedQuestIds.has(newQuest.id) && newQuest.status === QuestStatus.COMPLETED) {
          setQuestUpdate({ quest: newQuest, type: 'completed' });
        }
      });
      setQuests(response.quests);

      if (response.xpGained && response.xpGained > 0) {
          setStatUpdate({ type: 'xp', value: response.xpGained });
      }
      if (response.characterStats.level > characterStats.level) {
          setStatUpdate({ type: 'level', value: response.characterStats.level });
      }
      setCharacterStats(response.characterStats);

      if (response.randomEvent) {
          setEventNotification(response.randomEvent.name);
      }

      if (response.newItem && !inventory.includes(response.newItem)) {
        setNewItem(response.newItem);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Произошла неизвестная ошибка.";
      if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("resource_exhausted")) {
        setError("Вы действуете слишком быстро! Нексусу нужно время, чтобы обработать ваш запрос. Пожалуйста, подождите немного.");
      } else {
        setError(`Ошибка связи с Нексусом: ${errorMessage}`);
      }
      const errorGmMesssage: Message = { role: MessageRole.GAME_MASTER, content: "Возникла аномалия в ткани реальности... Попробуйте ваше действие еще раз." };
      setMessages(prev => [...prev, errorGmMesssage]);
    } finally {
      setIsLoading(false);
      setIsCoolingDown(true);
      setTimeout(() => {
        setIsCoolingDown(false);
      }, 2000);
    }
  };
  
  // Auto-save whenever a meaningful part of the game state changes.
  useEffect(() => {
    if (!isInitialLoading && playerInfo) {
      const gameState = {
        messages,
        inventory,
        quests,
        characterStats,
        combatState,
        currentLocation,
        locationDescription,
        playerInfo,
      };
      db.saveGameState(gameState);
    }
  }, [messages, inventory, quests, characterStats, combatState, currentLocation, isInitialLoading, playerInfo, locationDescription]);


  const toggleFaction = (factionName: string) => {
    setOpenFactions(prev => ({ ...prev, [factionName]: !prev[factionName] }));
  };

  if (isInitialLoading) {
    return (
        <div className="bg-stone-950 h-screen flex items-center justify-center">
            <LoadingIndicator />
        </div>
    );
  }

  if (!playerInfo) {
    return <RegistrationScreen 
      onStartGame={handleGameStart} 
      onLoadGameFromFile={handleLoadGameFromFile}
      isLoading={isLoading} 
    />;
  }

  return (
    <div className="bg-stone-950 text-amber-50 font-serif-body h-screen flex flex-col bg-fantasy-pattern">
      <GameHeader onNewGame={handleNewGame} onSaveGame={handleSaveGame} onSaveAs={handleSaveAs} />
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-6 overflow-hidden custom-scrollbar">
        
        {/* Main Content: first in DOM for mobile, second for desktop */}
        <div className="lg:w-2/3 lg:order-2 flex flex-col h-3/5 lg:h-full">
          <GameScreen messages={messages} combatState={combatState} />
          <div className="pt-4 mt-auto">
            {isLoading && <LoadingIndicator />}
            {error && <p className="text-red-400 text-center mb-2">{error}</p>}
            {!isLoading && (
              <ActionInput onSubmit={handlePlayerAction} suggestedActions={suggestedActions} disabled={isCoolingDown} />
            )}
          </div>
        </div>

        {/* Sidebar: second in DOM for mobile, first for desktop */}
        <div className="lg:w-1/3 lg:order-1 flex flex-col h-2/5 lg:h-full overflow-y-auto custom-scrollbar">
          <Inventory 
            stats={characterStats}
            inventory={inventory} 
            newItem={newItem} 
            quests={quests} 
            currentLocation={currentLocation}
            locationDescription={locationDescription}
            onNavigate={handlePlayerAction}
            openFactions={openFactions}
            onToggleFaction={toggleFaction}
          />
        </div>

      </main>
      {questUpdate && <QuestNotification quest={questUpdate.quest} type={questUpdate.type} />}
      {statUpdate && <StatNotification type={statUpdate.type} value={statUpdate.value} />}
      {eventNotification && <EventNotification message={eventNotification} />}
      <style>{`
        :root {
          --font-serif-header: 'Cinzel Decorative', serif;
          --font-serif-body: 'Lora', serif;
        }
        .font-serif-header { font-family: var(--font-serif-header); }
        .font-serif-body { font-family: var(--font-serif-body); }
        
        .bg-fantasy-pattern {
          background-color: #1c1917;
          background-image: radial-gradient(circle at center, rgba(255, 237, 213, 0.08) 0%, transparent 60%),
                            url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2392400e" fill-opacity="0.04"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
        }
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 5s ease-in-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(41, 37, 36, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(202, 138, 4, 0.6);
            border-radius: 10px;
            border: 1px solid rgba(41, 37, 36, 1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(202, 138, 4, 0.8);
        }
      `}</style>
    </div>
  );
};

export default App;
