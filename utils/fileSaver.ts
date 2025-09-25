import type { GameState } from '../types';

/**
 * Transliterates Cyrillic text to a basic Latin representation for filenames.
 * @param text The Cyrillic text.
 * @returns A Latin string.
 */
function transliterate(text: string): string {
    const map: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    
    return text.toLowerCase().split('').map(char => map[char] || char).join('');
}


/**
 * Creates a sanitized filename from a character's name.
 * @param name The character's name.
 * @returns A safe string for use in a filename.
 */
function sanitizeFilename(name: string): string {
    const transliteratedName = transliterate(name);
    return transliteratedName.replace(/[^a-z0-9_\-]/gi, '_').toLowerCase();
}

/**
 * Saves the game state to a JSON file and triggers a download.
 * @param gameState The complete game state to save.
 */
export function saveGameToFile(gameState: GameState): void {
  if (!gameState.playerInfo) {
    console.error("Cannot save game to file: Player info is missing.");
    return;
  }

  try {
    const jsonString = JSON.stringify(gameState, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const sanitizedName = sanitizeFilename(gameState.playerInfo.name);
    link.download = `nexus-save-${sanitizedName || 'character'}.json`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Failed to save game to file:", error);
  }
}