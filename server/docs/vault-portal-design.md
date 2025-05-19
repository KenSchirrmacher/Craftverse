# Vault Portal Design Document

## Overview
The Vault Portal is a new feature in Minecraft 1.24 (Trail Tales) that allows players to create portals to special vault dimensions containing unique treasures and challenges.

## Components

### 1. VaultPortalBlock
- Special block that forms the portal frame
- Requires specific block pattern for activation
- Emits particles and sounds when active
- Handles portal state (inactive, forming, active)
- Manages dimension transition

### 2. VaultPortalItem
- Item used to create the portal frame
- Special crafting recipe required
- Handles placement logic and frame validation

### 3. VaultDimension
- New dimension type for vault instances
- Procedurally generated vault rooms
- Unique loot and challenges
- Time-limited access

### 4. VaultPortalManager
- Manages portal state and transitions
- Handles player teleportation
- Controls dimension access timing
- Manages loot generation

## Implementation Plan

1. Create VaultPortalBlock class
   - Implement block properties and states
   - Add frame validation logic
   - Create activation mechanics
   - Add visual and audio effects

2. Create VaultPortalItem class
   - Implement item properties
   - Add placement logic
   - Create crafting recipe

3. Implement VaultDimension
   - Create dimension type
   - Implement room generation
   - Add loot tables
   - Create challenge system

4. Create VaultPortalManager
   - Implement portal state management
   - Add teleportation logic
   - Create timing system
   - Implement loot generation

5. Add Tests
   - Block placement and activation tests
   - Dimension transition tests
   - Loot generation tests
   - Challenge system tests

## Technical Requirements

1. Block Properties
   - Frame validation
   - State management
   - Particle effects
   - Sound effects

2. Dimension Properties
   - Unique world generation
   - Time limit system
   - Loot tables
   - Challenge mechanics

3. Player Interaction
   - Portal activation
   - Teleportation
   - Time tracking
   - Loot collection

## Testing Requirements

1. Block Tests
   - Frame validation
   - State transitions
   - Effect generation
   - Player interaction

2. Dimension Tests
   - World generation
   - Time limit
   - Loot generation
   - Challenge mechanics

3. Integration Tests
   - Portal creation
   - Dimension transition
   - Player experience
   - Loot collection 