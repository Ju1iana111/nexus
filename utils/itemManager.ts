import type { Item, Equipment, EquipmentSlot, CharacterStats } from '../types';
import { ItemType } from '../types';

/**
 * Handles equipping an item.
 * @returns The updated inventory and equipment.
 */
export function equipItem(
    itemToEquip: Item, 
    currentInventory: Item[], 
    currentEquipment: Equipment
): { newInventory: Item[], newEquipment: Equipment } {
    if (itemToEquip.type !== ItemType.WEAPON && itemToEquip.type !== ItemType.ARMOR) {
        return { newInventory: currentInventory, newEquipment: currentEquipment };
    }

    const slot: EquipmentSlot = itemToEquip.type;
    const currentlyEquipped = currentEquipment[slot];
    
    // Remove the item to be equipped from inventory
    const newInventory = currentInventory.filter(i => i.id !== itemToEquip.id);
    
    // If an item was already in the slot, add it back to inventory
    if (currentlyEquipped) {
        newInventory.push(currentlyEquipped);
    }
    
    // Place the new item in the equipment slot
    const newEquipment = {
        ...currentEquipment,
        [slot]: itemToEquip,
    };

    return { newInventory, newEquipment };
}

/**
 * Handles unequipping an item from a slot.
 * @returns The updated inventory and equipment.
 */
export function unequipItem(
    slot: EquipmentSlot, 
    currentInventory: Item[], 
    currentEquipment: Equipment
): { newInventory: Item[], newEquipment: Equipment } {
    const itemToUnequip = currentEquipment[slot];
    if (!itemToUnequip) {
        return { newInventory: currentInventory, newEquipment: currentEquipment };
    }

    // Add the unequipped item back to inventory
    const newInventory = [...currentInventory, itemToUnequip];
    
    // Clear the equipment slot
    const newEquipment = {
        ...currentEquipment,
        [slot]: null,
    };
    
    return { newInventory, newEquipment };
}

/**
 * Handles using a consumable item.
 * @returns The updated inventory and character stats.
 */
export function useConsumable(
    itemToUse: Item,
    currentInventory: Item[],
    currentBaseStats: CharacterStats
): { newInventory: Item[], newBaseStats: CharacterStats } {
    if (itemToUse.type !== ItemType.CONSUMABLE || !itemToUse.effect) {
        return { newInventory: currentInventory, newBaseStats: currentBaseStats };
    }

    let newBaseStats = { ...currentBaseStats };
    const { effect } = itemToUse;

    if (effect.type === 'heal') {
        newBaseStats.hp = Math.min(newBaseStats.maxHp, newBaseStats.hp + effect.amount);
    }
    
    // Remove one instance of the used item from inventory.
    // This simple filter works if items are unique. If they can stack, this logic would need to change.
    // For now, it matches the original implementation.
    const newInventory = currentInventory.filter(i => i.id !== itemToUse.id);

    return { newInventory, newBaseStats };
}
