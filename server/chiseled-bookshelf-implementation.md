# Chiseled Bookshelf Implementation

## Overview
The Chiseled Bookshelf is a decorative storage block from the Trails & Tales Update. It can store up to 6 books (regular books, enchanted books, written books, or writable books) and outputs redstone signals based on how many slots are filled.

## Components Implemented

### ChiseledBookshelfBlock
- Located at: `server/blocks/chiseledBookshelfBlock.js`
- Features:
  - 6-slot inventory for book storage
  - Individual slot interaction based on where the player clicks
  - Redstone signal output (signal strength 0-6 based on number of books)
  - Rotation awareness for front-facing orientation
  - Serialization/deserialization for persistent storage
  - Drops all contained books when broken

### ChiseledBookshelfItem
- Located at: `server/items/chiseledBookshelfItem.js`
- Features:
  - Placement of Chiseled Bookshelf blocks in the world
  - Rotation based on player facing direction
  - Tooltip information describing functionality

### Tests
- Located at: `server/tests/chiseledBookshelfTest.js`
- Covers:
  - Basic properties validation
  - Book storage and retrieval
  - Slot-specific interaction
  - Redstone signal output
  - Serialization/deserialization

## Integration
- Added to BlockRegistry for block registration
- Added to ItemRegistry for item registration

## Usage
Players can:
- Place the Chiseled Bookshelf block in the world
- Store up to 6 book items by right-clicking on empty slots
- Retrieve stored books by right-clicking on filled slots
- Use the redstone signal output for redstone contraptions (signal strength varies with number of books)

## Technical Implementation
- `interact` method determines which slot was clicked and either stores or retrieves books
- `getSlotFromHitPosition` translates click coordinates to slot indices
- `emitRedstoneSignal` notifies the world of signal strength changes
- `storeBook` and `retrieveBook` handle inventory management
- Serialization methods preserve state across world saves 