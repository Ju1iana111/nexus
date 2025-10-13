import { GoogleGenAI, Type } from '@google/genai';
import type { Message, GameResponse, Quest, CharacterStats, CombatState, PlayerInfo, Item, Equipment } from '../types';
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

// FIX: Added response schemas for all types to enforce a strict output format from the API.
const itemStatsSchema = {
    type: Type.OBJECT,
    properties: {
        strength: { type: Type.INTEGER },
        dexterity: { type: Type.INTEGER },
        intelligence: { type: Type.INTEGER },
    },
};

const itemEffectSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING },
        amount: { type: Type.INTEGER },
    },
    required: ['type', 'amount'],
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        type: { type: Type.STRING },
        description: { type: Type.STRING },
        stats: itemStatsSchema, // Optional
        effect: itemEffectSchema, // Optional for consumables
    },
    required: ['id', 'name', 'type', 'description']
};

const questSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        status: { type: Type.STRING },
        type: { type: Type.STRING }, // Optional
    },
    required: ['id', 'title', 'description', 'status']
};

const characterStatsSchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.INTEGER },
        xp: { type: Type.INTEGER },
        xpToNextLevel: { type: Type.INTEGER },
        strength: { type: Type.INTEGER },
        dexterity: { type: Type.INTEGER },
        intelligence: { type: Type.INTEGER },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
        reputation: {
            type: Type.OBJECT,
            properties: {
                pantheon_light: { type: Type.INTEGER },
                pantheon_dark: { type: Type.INTEGER },
                pantheon_neutral: { type: Type.INTEGER },
            },
            required: ['pantheon_light', 'pantheon_dark', 'pantheon_neutral']
        }
    },
    required: ['level', 'xp', 'xpToNextLevel', 'strength', 'dexterity', 'intelligence', 'hp', 'maxHp', 'reputation'],
};

const enemySchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        hp: { type: Type.INTEGER },
        maxHp: { type: Type.INTEGER },
    },
    required: ['id', 'name', 'hp', 'maxHp'],
};

const combatStateSchema = {
    type: Type.OBJECT,
    properties: {
        isActive: { type: Type.BOOLEAN },
        enemies: {
            type: Type.ARRAY,
            items: enemySchema,
        },
        turn: { type: Type.STRING },
        log: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['isActive', 'enemies', 'turn', 'log'],
};

const equipmentSchema = {
    type: Type.OBJECT,
    properties: {
        weapon: itemSchema,
        armor: itemSchema,
    }
};

const randomEventSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
    },
    required: ['name', 'description'],
};

const gameResponseSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "Main narrative description of the events." },
        locationDescription: { type: Type.STRING, description: "Atmospheric description of the current location." },
        currentLocation: { type: Type.STRING, description: "Name of the player's current location." },
        suggested_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3-5 suggested actions for the player." },
        inventory: { type: Type.ARRAY, items: itemSchema, description: "The player's full inventory." },
        newItem: itemSchema,
        loot: { type: Type.ARRAY, items: itemSchema, description: "List of items just looted in this turn." },
        quests: { type: Type.ARRAY, items: questSchema, description: "The player's full list of quests." },
        characterStats: characterStatsSchema,
        equipment: equipmentSchema,
        xpGained: { type: Type.INTEGER },
        combatState: combatStateSchema,
        randomEvent: randomEventSchema,
    },
    required: [
        'description',
        'locationDescription',
        'currentLocation',
        'suggested_actions',
        'inventory',
        'quests',
        'characterStats',
        'equipment',
        'combatState',
    ]
};

function buildPlayerContext(
    currentInventory: Item[],
    currentQuests: Quest[],
    currentStats: CharacterStats,
    currentCombatState: CombatState,
    currentEquipment: Equipment,
    playerInfo: PlayerInfo | null,
): string {
    const playerInfoContext = playerInfo ? `[ПЕРСОНАЖ: Имя - ${playerInfo.name}. Описание - ${playerInfo.description}]` : '[ПЕРСОНАЖ: Информация отсутствует]';
    const statsContext = `[ХАРАКТЕРИСТИКИ: Уровень ${currentStats.level}, HP ${currentStats.hp}/${currentStats.maxHp}, Опыт ${currentStats.xp}/${currentStats.xpToNextLevel}, Сила ${currentStats.strength}, Ловкость ${currentStats.dexterity}, Интеллект ${currentStats.intelligence}]`;
    const reputationContext = `[РЕПУТАЦИЯ: Свет: ${currentStats.reputation?.pantheon_light ?? 0}, Тьма: ${currentStats.reputation?.pantheon_dark ?? 0}, Нейтралитет: ${currentStats.reputation?.pantheon_neutral ?? 0}]`;
    const inventoryContext = `[ИНВЕНТАРЬ: ${currentInventory.length > 0 ? currentInventory.map(i => i.name).join(', ') : 'пусто'}]`;
    const equipmentContext = `[ЭКИПИРОВКА: Оружие: ${currentEquipment.weapon?.name || 'нет'}, Броня: ${currentEquipment.armor?.name || 'нет'}]`;
    const questsContext = `[КВЕСТЫ: ${currentQuests.length > 0 ? currentQuests.map(q => `${q.title} (${q.status})`).join(', ') : 'нет'}]`;
    const combatContext = `[БОЙ: ${currentCombatState.isActive ? `Активен. Враги: ${currentCombatState.enemies.map(e => `${e.name} (${e.hp}/${e.maxHp})`).join(', ')}. Сейчас ходит: ${currentCombatState.turn}.` : 'Неактивен'}]`;
    
    return `${playerInfoContext}\n${statsContext}\n${reputationContext}\n${inventoryContext}\n${equipmentContext}\n${questsContext}\n${combatContext}`;
}

function buildGeminiContents(history: Message[], context: string) {
    const contents = history.slice(0, -1).map(msg => ({
        role: msg.role === MessageRole.PLAYER ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));
    const lastPlayerAction = history.length > 0 ? history[history.length - 1].content : "Начать игру";
    const finalUserMessage = `${context}\n\n${lastPlayerAction}`;
    contents.push({ role: 'user', parts: [{ text: finalUserMessage }] });
    return contents;
}

function buildOpenRouterMessages(history: Message[], context: string) {
    const messages = history.slice(0, -1).map(msg => ({
        role: msg.role === MessageRole.PLAYER ? 'user' : 'assistant',
        content: msg.content,
    }));
    const lastPlayerAction = history.length > 0 ? history[history.length - 1].content : "Начать игру";
    const finalUserMessage = `${context}\n\n${lastPlayerAction}`;

    return [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'user', content: finalUserMessage }
    ];
}

async function getGameResponseFromOpenRouter(history: Message[], currentInventory: Item[], currentQuests: Quest[], currentStats: CharacterStats, currentCombatState: CombatState, currentEquipment: Equipment, playerInfo: PlayerInfo | null): Promise<GameResponse> {
    const OPENROUTER_API_KEY = "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";
    if (!OPENROUTER_API_KEY) {
        throw new Error("OpenRouter API key is not configured.");
    }

    const context = buildPlayerContext(currentInventory, currentQuests, currentStats, currentCombatState, currentEquipment, playerInfo);
    const messages = buildOpenRouterMessages(history, context);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
            messages: messages,
            response_format: { type: "json_object" },
            temperature: 0.8,
            top_p: 0.95,
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorBody}`);
    }

    const responseData = await response.json();
    const jsonText = responseData.choices?.[0]?.message?.content;

    if (!jsonText) {
        throw new Error("Invalid response structure from OpenRouter API.");
    }

    const parsedResponse = JSON.parse(jsonText);
    return parsedResponse as GameResponse;
}

export async function getGameResponse(history: Message[], currentInventory: Item[], currentQuests: Quest[], currentStats: CharacterStats, currentCombatState: CombatState, currentEquipment: Equipment, playerInfo: PlayerInfo | null): Promise<GameResponse> {
  try {
    const context = buildPlayerContext(currentInventory, currentQuests, currentStats, currentCombatState, currentEquipment, playerInfo);
    const contents = buildGeminiContents(history, context);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: gameResponseSchema,
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
    
    if (!parsedResponse.description || !Array.isArray(parsedResponse.suggested_actions) || !Array.isArray(parsedResponse.inventory) || !Array.isArray(parsedResponse.quests) || !parsedResponse.characterStats || !parsedResponse.combatState || !('currentLocation' in parsedResponse) || !('locationDescription' in parsedResponse) || !parsedResponse.equipment) {
        throw new Error("Неверный формат JSON в ответе от API.");
    }

    return parsedResponse as GameResponse;

  } catch (error) {
    console.error("Ошибка при вызове Gemini API:", error);
    if (error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("resource_exhausted"))) {
        console.warn("Gemini limit reached, falling back to OpenRouter.");
        try {
            return await getGameResponseFromOpenRouter(history, currentInventory, currentQuests, currentStats, currentCombatState, currentEquipment, playerInfo);
        } catch (fallbackError) {
             console.error("Fallback to OpenRouter failed:", fallbackError);
             throw fallbackError; // Re-throw the fallback error
        }
    }
    if (error instanceof SyntaxError) {
        throw new Error("Ошибка при обработке ответа от Нексуса. Формат данных искажен.");
    }
    if (error instanceof Error) {
        throw new Error(`${error.message}`);
    }
    throw new Error("Произошла неизвестная ошибка при обращении к Gemini API.");
  }
}