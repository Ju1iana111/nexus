import React from 'react';
import { locationsByFaction, factionDetails, Location } from '../data/locations';
import { ChevronDownIcon } from './Icons';

interface WorldMapProps {
    onNavigate: (action: string) => void;
    currentLocation: string | null;
    openFactions: Record<string, boolean>;
    onToggleFaction: (factionName: string) => void;
}

interface FactionSectionProps {
    factionName: string;
    locations: Location[];
    isOpen: boolean;
    onToggle: () => void;
    onNavigate: (locationName: string) => void;
    currentLocation: string | null;
}

const FactionSection: React.FC<FactionSectionProps> = ({ factionName, locations, isOpen, onToggle, onNavigate, currentLocation }) => {
    const details = factionDetails[factionName];

    return (
        <div className={`border-b ${details.color}`}>
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-3 text-left hover:bg-stone-800/60 transition-colors duration-200"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {details.icon}
                    <h4 className="font-semibold text-stone-200 font-serif-header">{factionName}</h4>
                </div>
                <ChevronDownIcon className={`h-5 w-5 text-stone-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-3 bg-stone-900/50">
                    <ul className="space-y-2">
                        {locations.map(location => (
                            <li key={location.name}>
                                <button
                                    onClick={() => onNavigate(location.name)}
                                    disabled={location.name === currentLocation}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200 
                                        ${location.name === currentLocation 
                                            ? 'bg-amber-800/80 text-white font-bold cursor-default' 
                                            : 'text-stone-300 hover:bg-stone-700/70 hover:text-amber-100'
                                        }`}
                                >
                                    {location.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


export function WorldMap({ onNavigate, currentLocation, openFactions, onToggleFaction }: WorldMapProps) {
    
    const handleNavigation = (locationName: string) => {
        onNavigate(`Переместиться в: ${locationName}`);
    };

    return (
        <div className="overflow-y-auto custom-scrollbar h-full">
            {Object.entries(locationsByFaction).map(([factionName, locations]) => (
                <FactionSection
                    key={factionName}
                    factionName={factionName}
                    locations={locations}
                    isOpen={!!openFactions[factionName]}
                    onToggle={() => onToggleFaction(factionName)}
                    onNavigate={handleNavigation}
                    currentLocation={currentLocation}
                />
            ))}
        </div>
    );
}
