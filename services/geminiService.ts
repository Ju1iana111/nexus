import { GoogleGenAI, Type } from '@google/genai';
import type { Message, GameResponse, Quest, CharacterStats, CombatState, PlayerInfo } from '../types';
import { MessageRole } from '../types';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_STATS_GENERATION } from '../constants';

// Инициализация клиента Google GenAI с использованием ключа из переменных окружения
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface InitialStatsResponse {
    strength: number;
    dexterity: number;
    intelligence: number;
    reputation: Record<string, number>;
}

export async function getInitialStats(playerInfo: PlayerInfo): Promise<InitialStatsResponse> {
    try {
        const prompt = `Generate stats for the following character:\nName: ${playerInfo.name}\nDescription: ${playerInfo.description}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: SYSTEM_PROMPT_STATS_GENERATION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        strength: { type: Type.INTEGER, description: "Character's strength attribute. Must be between 1 and 10." },
                        dexterity: { type: Type.INTEGER, description: "Character's dexterity attribute. Must be between 1 and 10." },
                        intelligence: { type: Type.INTEGER, description: "Character's intelligence attribute. Must be between 1 and 10." },
                        reputation: {
                            type: Type.OBJECT,
                            properties: {
                                pantheon_light: { type: Type.INTEGER, description: "Reputation with the light pantheon. Default is 0." },
                                pantheon_dark: { type: Type.INTEGER, description: "Reputation with the dark pantheon. Default is 0." },
                                pantheon_neutral: { type: Type.INTEGER, description: "Reputation with the neutral pantheon. Default is 0." },
                            },
                            required: ['pantheon_light', 'pantheon_dark', 'pantheon_neutral'],
                        },
                    },
                    required: ['strength', 'dexterity', 'intelligence', 'reputation'],
                },
                temperature: 0.5,
            }
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("API response is empty.");
        }
        
        return JSON.parse(jsonText) as InitialStatsResponse;

    } catch (error) {
        console.error("Error generating initial stats:", error);
        // Fallback to default stats if generation fails
        return {
            strength: 6,
            dexterity: 6,
            intelligence: 6,
            reputation: {
                pantheon_light: 0,
                pantheon_dark: 0,
                pantheon_neutral: 0,
            },
        };
    }
}


/**
 * Преобразует историю сообщений и текущее состояние игры в формат,
 * понятный для Gemini API (массив Content).
 */
function buildGeminiContents(
  history: Message[],
  currentInventory: string[],
  currentQuests: Quest[],
  currentStats: CharacterStats,
  currentCombatState: CombatState,
  playerInfo: PlayerInfo | null,
) {
    const contents = history.slice(0, -1).map(msg => ({
        role: msg.role === MessageRole.PLAYER ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const playerInfoContext = playerInfo ? `[ПЕРСОНАЖ: Имя - ${playerInfo.name}. Описание - ${playerInfo.description}]` : '[ПЕРСОНАЖ: Информация отсутствует]';
    const statsContext = `[ХАРАКТЕРИСТИКИ: Уровень ${currentStats.level}, HP ${currentStats.hp}/${currentStats.maxHp}, Опыт ${currentStats.xp}/${currentStats.xpToNextLevel}, Сила ${currentStats.strength}, Ловкость ${currentStats.dexterity}, Интеллект ${currentStats.intelligence}]`;
    const reputationContext = `[РЕПУТАЦИЯ: Свет: ${currentStats.reputation?.pantheon_light ?? 0}, Тьма: ${currentStats.reputation?.pantheon_dark ?? 0}, Нейтралитет: ${currentStats.reputation?.pantheon_neutral ?? 0}]`;
    const inventoryContext = `[ИНВЕНТАРЬ: ${currentInventory.length > 0 ? currentInventory.join(', ') : 'пусто'}]`;
    const questsContext = `[КВЕСТЫ: ${currentQuests.length > 0 ? currentQuests.map(q => `${q.title} (${q.status})`).join(', ') : 'нет'}]`;
    const combatContext = `[БОЙ: ${currentCombatState.isActive ? `Активен. Враги: ${currentCombatState.enemies.map(e => `${e.name} (${e.hp}/${e.maxHp})`).join(', ')}. Сейчас ходит: ${currentCombatState.turn}.` : 'Неактивен'}]`;
    
    const playerContext = `${playerInfoContext}\n${statsContext}\n${reputationContext}\n${inventoryContext}\n${questsContext}\n${combatContext}`;

    const lastPlayerAction = history.length > 0 ? history[history.length - 1].content : "Начать игру";
    
    const finalUserMessage = `${playerContext}\n\n${lastPlayerAction}`;

    contents.push({
        role: 'user',
        parts: [{ text: finalUserMessage }],
    });

    return contents;
}


export async function getGameResponse(history: Message[], currentInventory: string[], currentQuests: Quest[], currentStats: CharacterStats, currentCombatState: CombatState, playerInfo: PlayerInfo | null): Promise<GameResponse> {
  try {
    const contents = buildGeminiContents(history, currentInventory, currentQuests, currentStats, currentCombatState, playerInfo);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            temperature: 0.8,
            topP: 0.95,
        }
    });

    let jsonText = response.text;

    if (!jsonText) {
        throw new Error("Ответ от API не содержит текста.");
    }
    
    const jsonRegex = /^```json\s*([\s\S]*?)\s*```$/;
    const match = jsonText.trim().match(jsonRegex);
    if (match) {
        jsonText = match[1];
    }

    const parsedResponse = JSON.parse(jsonText);
    
    if (!parsedResponse.description || !Array.isArray(parsedResponse.suggested_actions) || !Array.isArray(parsedResponse.inventory) || !Array.isArray(parsedResponse.quests) || !parsedResponse.characterStats || !parsedResponse.combatState || !('currentLocation' in parsedResponse) || !('locationDescription' in parsedResponse)) {
        throw new Error("Неверный формат JSON в ответе от API.");
    }

    return parsedResponse as GameResponse;

  } catch (error) {
    console.error("Ошибка при вызове Gemini API:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Ошибка при обработке ответа от Нексуса. Формат данных искажен.");
    }
    if (error instanceof Error) {
        throw new Error(`${error.message}`);
    }
    throw new Error("Произошла неизвестная ошибка при обращении к Gemini API.");
  }
}
