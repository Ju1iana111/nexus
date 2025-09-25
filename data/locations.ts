import React from 'react';
import { LightPantheonIcon, DarkPantheonIcon, NeutralPantheonIcon, CloudIcon } from '../components/Icons';

export const Factions = {
  LIGHT: 'Пантеон Света',
  DARK: 'Силы Инферно',
  NEUTRAL: 'Нейтральные Земли',
  SKY: 'Независимые Острова',
};

export const factionDetails: Record<string, { icon: React.ReactNode; color: string }> = {
  [Factions.LIGHT]: { icon: React.createElement(LightPantheonIcon, { className: "h-5 w-5 text-yellow-300" }), color: "border-yellow-700/50" },
  [Factions.DARK]: { icon: React.createElement(DarkPantheonIcon, { className: "h-5 w-5 text-indigo-300" }), color: "border-indigo-700/50" },
  [Factions.NEUTRAL]: { icon: React.createElement(NeutralPantheonIcon, { className: "h-5 w-5 text-stone-300" }), color: "border-stone-600/50" },
  [Factions.SKY]: { icon: React.createElement(CloudIcon, { className: "h-5 w-5 text-cyan-300" }), color: "border-cyan-700/50" },
};

export interface Location {
    name: string;
    faction: string;
}

export const worldLocations: Location[] = [
  // Пантеон Света
  { name: 'Асприон', faction: Factions.LIGHT },
  { name: 'Фиорес', faction: Factions.LIGHT },
  { name: 'Эридион', faction: Factions.LIGHT },
  { name: 'Храм Семи Огней', faction: Factions.LIGHT },
  { name: 'Луга Рассвета', faction: Factions.LIGHT },
  { name: 'Морской Утёс', faction: Factions.LIGHT },
  
  // Силы Инферно
  { name: 'Крамора', faction: Factions.DARK },
  { name: 'Миркара', faction: Factions.DARK },
  { name: 'Башня Сарнока', faction: Factions.DARK },
  { name: 'Ядовитые Топи', faction: Factions.DARK },
  { name: 'Кузня Арзагала', faction: Factions.DARK },
  { name: 'Пламенные Пики', faction: Factions.DARK },
  { name: 'Пепельные Котловины', faction: Factions.DARK },
  { name: 'Кровавый Каньон', faction: Factions.DARK },

  // Нейтральные Земли
  { name: 'Ранталис', faction: Factions.NEUTRAL },
  { name: 'Зубья Великана', faction: Factions.NEUTRAL },
  { name: 'Подземный рынок', faction: Factions.NEUTRAL },
  { name: 'Разлом Зари', faction: Factions.NEUTRAL },
  { name: 'Иллюзорные Пустоши', faction: Factions.NEUTRAL },
  { name: 'Лунная Долина', faction: Factions.NEUTRAL },
  { name: 'Лес Шёпотов', faction: Factions.NEUTRAL },
  { name: 'Оазис Зари', faction: Factions.NEUTRAL },
  { name: 'Пещера Лайбы', faction: Factions.NEUTRAL },
  { name: 'Соляные Пещеры', faction: Factions.NEUTRAL },
  { name: 'Парк Древних', faction: Factions.NEUTRAL },

  // Независимые Острова
  { name: 'Остров Облачных Архивов', faction: Factions.SKY },
  { name: 'Осколки Забвения', faction: Factions.SKY },
  { name: 'Остров Вечных Садов', faction: Factions.SKY },
  { name: 'Парящие Гробницы', faction: Factions.SKY },
  { name: 'Мост Сквозь Бури', faction: Factions.SKY },
  { name: 'Небесный Ковчег', faction: Factions.SKY },
  { name: 'Гармониум', faction: Factions.SKY },
  { name: 'Кристальный Остров', faction: Factions.SKY },
  { name: 'Остров Звёздного Круга', faction: Factions.SKY },
  { name: 'Остров Механизмов', faction: Factions.SKY },
];


export const locationsByFaction = worldLocations.reduce((acc, location) => {
    if (!acc[location.faction]) {
        acc[location.faction] = [];
    }
    acc[location.faction].push(location);
    return acc;
}, {} as Record<string, Location[]>);