import { openDB, type IDBPDatabase } from 'idb';
import type { GameState } from '../types';

const DB_NAME = 'NexusGameDB';
const DB_VERSION = 1;
const STORE_NAME = 'gameState';
const SAVE_KEY = 'current_game';

const MIN_MESSAGES_TO_KEEP = 20;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Use a keyPath for the object store
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves the current game state to IndexedDB.
 * If a QuotaExceededError occurs, it trims the message history and retries.
 * @param state The complete game state to save.
 */
export async function saveGameState(state: GameState): Promise<void> {
  const attemptSave = async (currentState: GameState) => {
    const db = await getDB();
    const stateWithId = { ...currentState, id: SAVE_KEY };
    await db.put(STORE_NAME, stateWithId);
  };

  try {
    await attemptSave(state);
  } catch (error) {
    // Check if the error is a QuotaExceededError, which is a common storage limit error.
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn("IndexedDB quota exceeded. Attempting to trim message history and retry save.");

      // Create a mutable copy of the state for trimming
      const trimmedState = { ...state, messages: [...state.messages] };

      if (trimmedState.messages.length > MIN_MESSAGES_TO_KEEP) {
        const originalCount = trimmedState.messages.length;
        // Keep only the last MIN_MESSAGES_TO_KEEP messages
        trimmedState.messages = trimmedState.messages.slice(-MIN_MESSAGES_TO_KEEP);
        
        console.log(`Trimmed ${originalCount - MIN_MESSAGES_TO_KEEP} old messages. Retrying save with ${trimmedState.messages.length} messages.`);
        
        try {
          // Retry saving with the trimmed state
          await attemptSave(trimmedState);
          console.log("Successfully saved game state after trimming message history.");
        } catch (retryError) {
          console.error("Failed to save game state even after trimming message history:", retryError);
        }
      } else {
        console.error("Quota exceeded, but not enough messages to trim. Save failed.", error);
      }
    } else {
      console.error("Failed to save game state due to an unexpected error:", error);
    }
  }
}


/**
 * Loads the game state from IndexedDB.
 * @returns A promise that resolves to the saved GameState object, or null if not found.
 */
export async function loadGameState(): Promise<GameState | null> {
  try {
    const db = await getDB();
    const state = await db.get(STORE_NAME, SAVE_KEY);
    return state ? (state as GameState) : null;
  } catch (error) {
    console.error("Failed to load game state:", error);
    return null;
  }
}

/**
 * Clears the saved game state from IndexedDB.
 */
export async function clearGameState(): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(STORE_NAME, SAVE_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
}
