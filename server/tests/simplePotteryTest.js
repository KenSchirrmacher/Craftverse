/**
 * Simple Pottery System Test
 * 
 * Basic tests for the pottery system to identify and fix issues
 */

const PotBase = require('../items/potBase');
const DecoratedPotItem = require('../items/decoratedPotItem');
const DecoratedPot = require('../blocks/decoratedPot');

// Test PotBase
console.log('Testing PotBase...');
const potBase = new PotBase();
console.log('PotBase type:', potBase.type);
console.log('PotBase name:', potBase.name);
console.log('PotBase stackable:', potBase.stackable);
console.log('PotBase maxStackSize:', potBase.maxStackSize);

// Test serialization
const potBaseSerialized = potBase.serialize();
console.log('PotBase serialized:', potBaseSerialized);
const potBaseDeserialized = PotBase.deserialize(potBaseSerialized);
console.log('PotBase deserialized type:', potBaseDeserialized ? potBaseDeserialized.type : 'null');

// Test DecoratedPotItem
console.log('\nTesting DecoratedPotItem...');
const decoratedPotItem = new DecoratedPotItem();
console.log('DecoratedPotItem type:', decoratedPotItem.type);
console.log('DecoratedPotItem name:', decoratedPotItem.name);
console.log('DecoratedPotItem stackable:', decoratedPotItem.stackable);
console.log('DecoratedPotItem maxStackSize:', decoratedPotItem.maxStackSize);
console.log('DecoratedPotItem placeable:', decoratedPotItem.placeable);
console.log('DecoratedPotItem sherds:', decoratedPotItem.sherds);
console.log('DecoratedPotItem hasCustomSherds:', decoratedPotItem.hasCustomSherds);

// Test with custom sherds
const customPot = new DecoratedPotItem({
  sherds: {
    north: 'arms_up',
    east: 'skull',
    south: null,
    west: null
  }
});
console.log('Custom pot hasCustomSherds:', customPot.hasCustomSherds);
console.log('Custom pot sherds:', customPot.sherds);

// Test serialization
const potItemSerialized = customPot.serialize();
console.log('DecoratedPotItem serialized:', potItemSerialized);
const potItemDeserialized = DecoratedPotItem.deserialize(potItemSerialized);
console.log('DecoratedPotItem deserialized type:', potItemDeserialized ? potItemDeserialized.type : 'null');
console.log('DecoratedPotItem deserialized sherds:', potItemDeserialized ? potItemDeserialized.sherds : 'null');

// Test DecoratedPot block
console.log('\nTesting DecoratedPot block...');
const decoratedPotBlock = new DecoratedPot();
console.log('DecoratedPot type:', decoratedPotBlock.type);
console.log('DecoratedPot displayName:', decoratedPotBlock.displayName);
console.log('DecoratedPot hardness:', decoratedPotBlock.hardness);
console.log('DecoratedPot toolType:', decoratedPotBlock.toolType);
console.log('DecoratedPot sherds:', decoratedPotBlock.sherds);
console.log('DecoratedPot inventory slots:', decoratedPotBlock.inventory.slots);
console.log('DecoratedPot inventory items:', decoratedPotBlock.inventory.items.length);

// Test serialization
const blockSerialized = decoratedPotBlock.serialize();
console.log('DecoratedPot serialized:', blockSerialized);
const blockDeserialized = DecoratedPot.deserialize(blockSerialized);
console.log('DecoratedPot deserialized type:', blockDeserialized ? blockDeserialized.type : 'null');
console.log('DecoratedPot deserialized sherds:', blockDeserialized ? blockDeserialized.sherds : 'null'); 