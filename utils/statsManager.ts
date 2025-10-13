import type { CharacterStats, Equipment } from '../types';

/**
 * Calculates the total character stats by combining base stats with stats from equipped items.
 * @param baseStats The character's base statistics without equipment.
 * @param equipment The character's currently equipped items.
 * @returns A new CharacterStats object with the combined stats.
 */
export function calculateTotalStats(baseStats: CharacterStats, equipment: Equipment): CharacterStats {
    // Create a deep copy of base stats to avoid mutating the original object.
    const totalStats: CharacterStats = JSON.parse(JSON.stringify(baseStats));

    // Iterate over each piece of equipment.
    Object.values(equipment).forEach(item => {
        if (item?.stats) {
            // Add stats from the item to the total stats.
            for (const [stat, value] of Object.entries(item.stats)) {
                // Ensure the stat exists on our character stats and the value is a number.
                if (typeof totalStats[stat as keyof CharacterStats] === 'number' && typeof value === 'number') {
                    (totalStats[stat as keyof CharacterStats] as number) += value;
                }
            }
        }
    });

    return totalStats;
}
