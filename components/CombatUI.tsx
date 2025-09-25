import React from 'react';
import type { CombatState, Enemy } from '../types';
import { SwordsIcon, ScrollIcon } from './Icons';

interface EnemyDisplayProps {
    enemy: Enemy;
}

function EnemyDisplay({ enemy }: EnemyDisplayProps) {
    const hpPercentage = enemy.maxHp > 0 ? (enemy.hp / enemy.maxHp) * 100 : 0;
    return (
        <div className="bg-stone-800/70 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-red-300">{enemy.name}</p>
                <p className="text-xs font-mono text-red-200">{enemy.hp} / {enemy.maxHp}</p>
            </div>
            <div className="w-full bg-red-900/50 rounded-full h-2">
                <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${hpPercentage}%` }}
                ></div>
            </div>
        </div>
    );
}

interface CombatUIProps {
    combatState: CombatState;
}

export function CombatUI({ combatState }: CombatUIProps) {
  return (
    <div className="border-2 border-red-800/50 bg-stone-950/60 rounded-xl mb-6 p-4 backdrop-blur-sm shadow-lg animate-fade-in">
        <h2 className="text-2xl font-bold text-red-500 mb-4 text-center tracking-wider uppercase font-serif-header">В БОЮ</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
            {/* Enemies Section */}
            <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300 mb-3 border-b border-stone-700 pb-2 font-serif-header">
                    <SwordsIcon className="h-5 w-5 text-red-400" />
                    <span>Противники</span>
                </h3>
                <div className="space-y-3">
                    {combatState.enemies.map(enemy => (
                        <EnemyDisplay key={enemy.id} enemy={enemy} />
                    ))}
                </div>
            </div>

            {/* Combat Log Section */}
            <div>
                 <h3 className="flex items-center gap-2 text-lg font-semibold text-stone-300 mb-3 border-b border-stone-700 pb-2 font-serif-header">
                    <ScrollIcon className="h-5 w-5 text-amber-300" />
                    <span>Журнал боя</span>
                 </h3>
                 <div className="bg-stone-800/50 p-3 rounded-lg h-40 overflow-y-auto custom-scrollbar">
                    <ul className="text-sm text-stone-400 space-y-2">
                       {combatState.log.map((entry, index) => (
                           <li key={index} className="leading-tight">{entry}</li>
                       ))}
                    </ul>
                 </div>
            </div>
        </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}