import React, { useState } from 'react';
import type { Quest, CharacterStats as CharacterStatsType, Item, Equipment, EquipmentSlot } from '../types';
import { QuestStatus, ItemType } from '../types';
import { 
    BagIcon, QuestIcon, MapIcon, ArchitectIcon, CompassIcon, UserIcon,
    StrengthIcon, DexterityIcon, IntelligenceIcon, LightPantheonIcon, DarkPantheonIcon, NeutralPantheonIcon,
    WeaponIcon, ArmorIcon
} from './Icons';
import { WorldMap } from './WorldMap';

interface SidebarProps {
  stats: CharacterStatsType;
  inventory: Item[];
  newItem: Item | null;
  quests: Quest[];
  equipment: Equipment;
  currentLocation: string | null;
  locationDescription: string | null;
  onNavigate: (action: string) => void;
  onEquipItem: (item: Item) => void;
  onUnequipItem: (slot: EquipmentSlot) => void;
  onUseItem: (item: Item) => void;
  openFactions: Record<string, boolean>;
  onToggleFaction: (factionName: string) => void;
}

type ActiveTab = 'character' | 'info' | 'map';

const QuestItem: React.FC<{ quest: Quest }> = ({ quest }) => {
    const isCompleted = quest.status === QuestStatus.COMPLETED;
    const isArchitect = quest.type === 'architect';
    
    return (
        <li className={`p-3 rounded-lg border ${isCompleted ? 'bg-stone-800/50 border-stone-700/50 opacity-60' : 'bg-stone-800/80 border-stone-700'}`}>
            <div className="flex justify-between items-start">
                <h4 className={`font-semibold ${isCompleted ? 'text-stone-400 line-through' : 'text-amber-200'}`}>
                    {quest.title}
                </h4>
                {isArchitect && !isCompleted && <span title="Квест Архитектора"><ArchitectIcon className="h-5 w-5 text-cyan-400 flex-shrink-0 ml-2" /></span>}
            </div>
            <p className="text-sm text-stone-400 mt-1">{quest.description}</p>
        </li>
    );
};

// --- Helper components for stats and equipment ---
// FIX: Changed JSX.Element to React.ReactNode to resolve TypeScript namespace error.
const factionInfo: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
    pantheon_light: { name: 'Свет', icon: <LightPantheonIcon className="h-5 w-5 text-yellow-300" />, color: 'text-yellow-400' },
    pantheon_dark: { name: 'Тьма', icon: <DarkPantheonIcon className="h-5 w-5 text-indigo-300" />, color: 'text-indigo-400' },
    pantheon_neutral: { name: 'Нейтралитет', icon: <NeutralPantheonIcon className="h-5 w-5 text-stone-300" />, color: 'text-stone-400' },
};

const formatStatBonus = (stat: string, value: number) => {
    const sign = value > 0 ? '+' : '';
    const label = {
        strength: 'СИЛ',
        dexterity: 'ЛОВ',
        intelligence: 'ИНТ',
    }[stat] || stat.substring(0,3).toUpperCase();
    return `${sign}${value} ${label}`;
};

const formatEffect = (effect: Item['effect']) => {
    if (!effect) return '';
    if (effect.type === 'heal') {
        return `Восстанавливает ${effect.amount} HP`;
    }
    return 'Неизвестный эффект';
};

function StatDisplay({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string; }) {
    return (
        <div className="flex items-center gap-3 bg-stone-800/50 p-2 rounded-lg">
            <div className={`p-1 rounded-md ${color}`}>
                {icon}
            </div>
            <div className="flex-grow">
                <span className="text-xs text-stone-400">{label}</span>
                <p className="font-bold text-stone-100">{value}</p>
            </div>
        </div>
    );
}

const EquipmentSlotDisplay: React.FC<{
    slot: EquipmentSlot;
    item: Item | null;
    onUnequip: (slot: EquipmentSlot) => void;
}> = ({ slot, item, onUnequip }) => {
    const icon = slot === 'weapon' ? <WeaponIcon className="h-6 w-6 text-red-400" /> : <ArmorIcon className="h-6 w-6 text-sky-400" />;
    const label = slot === 'weapon' ? 'Оружие' : 'Броня';

    return (
        <div className="flex items-center gap-3 bg-stone-800/50 p-2 rounded-lg min-h-[60px]">
            <div className="p-1">{icon}</div>
            <div className="flex-grow">
                <span className="text-xs text-stone-400">{label}</span>
                {item ? (
                    <>
                        <p className="font-bold text-stone-100">{item.name}</p>
                        {item.stats && (
                             <p className="text-xs text-green-400 font-mono">
                                {/* FIX: Cast value to number as Object.entries types it as unknown. */}
                                {Object.entries(item.stats).map(([key, value]) => formatStatBonus(key, value as number)).join(', ')}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-stone-500 italic">Пусто</p>
                )}
            </div>
            {item && (
                <button 
                    onClick={() => onUnequip(slot)}
                    className="text-stone-400 hover:text-white text-xs bg-stone-700 hover:bg-red-800/50 px-2 py-1 rounded transition-colors"
                >
                    Снять
                </button>
            )}
        </div>
    );
};
// --- End Helper components ---


export function Inventory({ 
    stats,
    inventory, 
    newItem, 
    quests, 
    equipment,
    currentLocation, 
    locationDescription,
    onNavigate,
    onEquipItem,
    onUnequipItem,
    onUseItem,
    openFactions,
    onToggleFaction,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('character');
  const activeQuests = quests.filter(q => q.status === QuestStatus.ACTIVE);
  const completedQuests = quests.filter(q => q.status === QuestStatus.COMPLETED);

  const { level, xp, xpToNextLevel, strength, dexterity, intelligence, hp, maxHp, reputation } = stats;
  const xpPercentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;
  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;

  return (
    <div className="bg-stone-900/60 border border-amber-800/50 rounded-xl backdrop-blur-sm shadow-lg flex flex-col h-full max-h-[calc(100vh-200px)] lg:max-h-full overflow-hidden">
        <div className="flex border-b border-amber-800/50">
            <button
                onClick={() => setActiveTab('character')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors duration-200 ${activeTab === 'character' ? 'bg-amber-900/40 text-amber-200' : 'text-stone-400 hover:bg-stone-800/60'}`}
                aria-selected={activeTab === 'character'}
                role="tab"
            >
                <UserIcon className="h-5 w-5" />
                <span>Персонаж</span>
            </button>
            <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors duration-200 ${activeTab === 'info' ? 'bg-amber-900/40 text-amber-200' : 'text-stone-400 hover:bg-stone-800/60'}`}
                aria-selected={activeTab === 'info'}
                role="tab"
            >
                <BagIcon className="h-5 w-5" />
                <span>Инфо</span>
            </button>
             <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors duration-200 ${activeTab === 'map' ? 'bg-amber-900/40 text-amber-200' : 'text-stone-400 hover:bg-stone-800/60'}`}
                aria-selected={activeTab === 'map'}
                role="tab"
            >
                <CompassIcon className="h-5 w-5" />
                <span>Карта</span>
            </button>
        </div>
      
        <div className="flex-grow overflow-y-auto custom-scrollbar">
            {activeTab === 'character' && (
                <div className="p-4 space-y-4">
                     <div>
                        <div className="flex justify-between items-baseline mb-3">
                            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-serif-header">Персонаж</h2>
                            <span className="text-lg font-bold text-yellow-400">Уровень {level}</span>
                        </div>
                        
                        {/* HP Bar */}
                        <div className="mb-2">
                            <div className="flex justify-between text-xs text-red-300 mb-1">
                                <span>Здоровье</span>
                                <span>{hp} / {maxHp}</span>
                            </div>
                            <div className="w-full bg-stone-700 rounded-full h-2.5">
                            <div 
                                className="bg-red-700 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${hpPercentage}%` }}
                            ></div>
                            </div>
                        </div>

                        {/* XP Bar */}
                        <div>
                            <div className="flex justify-between text-xs text-stone-400 mb-1">
                                <span>Опыт</span>
                                <span>{xp} / {xpToNextLevel}</span>
                            </div>
                            <div className="w-full bg-stone-700 rounded-full h-2.5">
                            <div 
                                className="bg-amber-600 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${xpPercentage}%` }}
                            ></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatDisplay icon={<StrengthIcon className="h-5 w-5 text-red-200" />} label="Сила" value={strength} color="bg-red-700/30" />
                        <StatDisplay icon={<DexterityIcon className="h-5 w-5 text-green-200" />} label="Ловкость" value={dexterity} color="bg-green-700/30" />
                        <StatDisplay icon={<IntelligenceIcon className="h-5 w-5 text-blue-200" />} label="Интеллект" value={intelligence} color="bg-blue-700/30" />
                    </div>

                    {/* Equipment Section */}
                    <div className="pt-4 border-t border-amber-800/60">
                        <h3 className="text-sm font-semibold text-stone-400 mb-2 text-center font-serif-header">Экипировка</h3>
                        <div className="space-y-2">
                            <EquipmentSlotDisplay slot="weapon" item={equipment.weapon} onUnequip={onUnequipItem} />
                            <EquipmentSlotDisplay slot="armor" item={equipment.armor} onUnequip={onUnequipItem} />
                        </div>
                    </div>


                    {/* Reputation Section */}
                    {reputation && (
                        <div className="pt-4 border-t border-amber-800/60">
                            <h3 className="text-sm font-semibold text-stone-400 mb-2 text-center font-serif-header">Репутация</h3>
                            <div className="space-y-2">
                                {Object.entries(reputation).map(([key, value]) => {
                                    const info = factionInfo[key] || { name: key, icon: null, color: 'text-stone-300' };
                                    return (
                                        <div key={key} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                {info.icon}
                                                <span className={info.color}>{info.name}</span>
                                            </div>
                                            <span className={`font-mono font-bold ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-stone-400'}`}>
                                                {value > 0 ? `+${value}`: value}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'info' && (
                <div className="p-4 flex flex-col gap-6">
                    {/* Current Location */}
                    {currentLocation && (
                        <div>
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300 mb-3 border-b border-stone-700 pb-2 font-serif-header">
                                <MapIcon className="h-5 w-5 text-green-400" />
                                <span>Текущая локация</span>
                            </h3>
                            <div className="space-y-3">
                            <p className="text-stone-300 font-bold">{currentLocation}</p>
                            <p className="text-stone-400 text-sm italic border-l-2 border-amber-800/60 pl-3">
                                {locationDescription || 'Описание недоступно...'}
                            </p>
                            </div>
                        </div>
                    )}

                    {/* Inventory Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300 mb-3 border-b border-stone-700 pb-2 font-serif-header">
                            <BagIcon className="h-5 w-5 text-amber-300" />
                            <span>Инвентарь</span>
                        </h3>
                        {inventory.length > 0 ? (
                        <ul className="space-y-2">
                            {inventory.map((item) => {
                                const isHealAtFullHp = item.effect?.type === 'heal' && stats.hp >= stats.maxHp;

                                return (
                                <li key={item.id} className={`p-3 rounded-lg border bg-stone-800/80 border-stone-700 ${item.id === newItem?.id ? 'new-item-glow' : ''}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h4 className="font-semibold text-amber-200">{item.name}</h4>
                                            <p className="text-sm text-stone-400 mt-1">{item.description}</p>
                                            {item.stats && (
                                                <p className="text-xs text-green-400 font-mono mt-1">
                                                    {/* FIX: Cast value to number as Object.entries types it as unknown. */}
                                                    {Object.entries(item.stats).map(([key, value]) => formatStatBonus(key, value as number)).join(', ')}
                                                </p>
                                            )}
                                            {item.effect && (
                                                <p className="text-xs text-sky-300 font-mono mt-1">
                                                    {formatEffect(item.effect)}
                                                </p>
                                            )}
                                        </div>
                                        {(item.type === ItemType.WEAPON || item.type === ItemType.ARMOR) && (
                                            <button 
                                                onClick={() => onEquipItem(item)}
                                                className="text-stone-200 hover:text-white text-xs bg-green-800/60 hover:bg-green-700/60 px-3 py-1 rounded transition-colors whitespace-nowrap"
                                            >
                                                Надеть
                                            </button>
                                        )}
                                        {item.type === ItemType.CONSUMABLE && (
                                            <button
                                                onClick={() => onUseItem(item)}
                                                disabled={isHealAtFullHp}
                                                className="text-stone-200 hover:text-white text-xs bg-sky-800/60 hover:bg-sky-700/60 px-3 py-1 rounded transition-colors whitespace-nowrap disabled:bg-stone-700/50 disabled:text-stone-400 disabled:cursor-not-allowed"
                                                title={isHealAtFullHp ? "Здоровье уже полное" : `Использовать ${item.name}`}
                                            >
                                                Использовать
                                            </button>
                                        )}
                                    </div>
                                </li>
                            )})}
                        </ul>
                        ) : (
                        <p className="text-stone-500 italic text-sm">Ваш инвентарь пуст.</p>
                        )}
                    </div>

                    {/* Quests Section */}
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300 mb-3 border-b border-stone-700 pb-2 font-serif-header">
                            <QuestIcon className="h-5 w-5 text-sky-400" />
                            <span>Задания</span>
                        </h3>
                        {quests.length > 0 ? (
                            <div className="space-y-4">
                                {activeQuests.length > 0 && (
                                    <div>
                                        <h4 className="text-amber-400 font-semibold mb-2 text-sm">Активные</h4>
                                        <ul className="space-y-3">
                                            {activeQuests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
                                        </ul>
                                    </div>
                                )}
                                {completedQuests.length > 0 && (
                                    <div>
                                        <h4 className="text-stone-500 font-semibold mb-2 text-sm">Завершенные</h4>
                                        <ul className="space-y-3">
                                            {completedQuests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                        <p className="text-stone-500 italic text-sm">У вас нет активных заданий.</p>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'map' && (
                <WorldMap
                    onNavigate={onNavigate}
                    currentLocation={currentLocation}
                    openFactions={openFactions}
                    onToggleFaction={onToggleFaction}
                />
            )}
        </div>

       <style>{`
        .new-item-glow {
            animation: glow 2s ease-in-out;
            border-color: #fde047;
            box-shadow: 0 0 5px #fde047, 0 0 10px #fde047;
        }
        @keyframes glow {
          0%, 100% { border-color: #fde047; box-shadow: 0 0 5px #fde047, 0 0 10px #fde047; }
          50% { border-color: #fbbf24; box-shadow: 0 0 10px #fde047, 0 0 20px #fcd34d; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(41, 37, 36, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(202, 138, 4, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(202, 138, 4, 0.7);
        }
       `}</style>
    </div>
  );
}