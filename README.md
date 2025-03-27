# Craftverse 🏴‍☠️

A multiplayer voxel-based game built with Three.js and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Procedurally generated terrain
- Multiple biomes (plains, desert, forest, tundra)
- Crafting system
- Inventory management
- Different game modes (survival, creative, adventure)
- Chat system
- Player interactions
- Block breaking and placing
- Tools and items with durability

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Controls

- WASD: Move
- Space: Jump
- Left Click: Break blocks
- Right Click: Place blocks
- E: Open/Close inventory
- C: Open/Close crafting menu
- Enter: Send chat message
- 1-9: Select hotbar slot

## Game Modes

### Survival
- Limited resources
- Health system
- Tool durability
- Crafting required

### Creative
- Unlimited resources
- No health damage
- No tool durability
- Flying enabled

### Adventure
- Limited resources
- Health system
- Tool durability
- Block breaking restrictions

## Development

To run the server in development mode with auto-reload:
```bash
npm run dev
```

## Technologies Used

- Three.js for 3D graphics
- Socket.IO for real-time multiplayer
- Express.js for server
- HTML5/CSS3 for UI
