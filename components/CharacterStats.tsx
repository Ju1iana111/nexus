import React from 'react';
import type { CharacterStats as CharacterStatsType } from '../types';
import { StrengthIcon, DexterityIcon, IntelligenceIcon, LightPantheonIcon, DarkPantheonIcon, NeutralPantheonIcon } from './Icons';

interface CharacterStatsProps {
  stats: CharacterStatsType;
}

interface StatDisplayProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
}

const factionInfo: Record<string, { name: string; icon: JSX.Element; color: string }> = {
    pantheon_light: { name: 'Свет', icon: <LightPantheonIcon className="h-5 w-5 text-yellow-300" />, color: 'text-yellow-400' },
    pantheon_dark: { name: 'Тьма', icon: <DarkPantheonIcon className="h-5 w-5 text-indigo-300" />, color: 'text-indigo-400' },
    pantheon_neutral: { name: 'Нейтралитет', icon: <NeutralPantheonIcon className="h-5 w-5 text-stone-300" />, color: 'text-stone-400' },
};


function StatDisplay({ icon, label, value, color }: StatDisplayProps) {
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

export function CharacterStats({ stats }: CharacterStatsProps) {
  const { level, xp, xpToNextLevel, strength, dexterity, intelligence, hp, maxHp, reputation } = stats;
  const xpPercentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;
  const hpPercentage = maxHp > 0 ? (hp / maxHp) * 100 : 0;

  return (
    <div className="bg-stone-900/60 border border-amber-800/50 rounded-xl p-4 backdrop-blur-sm shadow-lg">
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-serif-header">Персонаж</h2>
        <span className="text-lg font-bold text-yellow-400">Уровень {level}</span>
      </div>
      
      {/* HP Bar */}
      <div className="mb-4">
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
      <div className="mb-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
          <StatDisplay icon={<StrengthIcon className="h-5 w-5 text-red-200" />} label="Сила" value={strength} color="bg-red-700/30" />
          <StatDisplay icon={<DexterityIcon className="h-5 w-5 text-green-200" />} label="Ловкость" value={dexterity} color="bg-green-700/30" />
          <StatDisplay icon={<IntelligenceIcon className="h-5 w-5 text-blue-200" />} label="Интеллект" value={intelligence} color="bg-blue-700/30" />
      </div>

      {/* Reputation Section */}
      {reputation && (
        <div className="mt-4 pt-4 border-t border-amber-800/60">
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
  );
}