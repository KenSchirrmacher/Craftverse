const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const World = require('./server/world/world');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize world
const world = new World();
world.initialize();

// Game state
const gameState = {
    players: new Map(),
    blocks: world.blocks,
    worldSeed: world.seed
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Handle player join
    socket.on('playerJoin', (playerData) => {
        gameState.players.set(socket.id, {
            id: socket.id,
            position: playerData.position || { x: 0, y: 64, z: 0 },
            rotation: playerData.rotation || { y: 0 },
            inventory: playerData.inventory || {
                grass: 64,
                dirt: 64,
                stone: 64,
                wood: 64,
                leaves: 64,
                sand: 64
            },
            health: playerData.health || 100,
            gameMode: playerData.gameMode || 'survival'
        });

        // Send current world state to new player
        socket.emit('worldUpdate', {
            blocks: Object.fromEntries(gameState.blocks),
            worldSeed: gameState.worldSeed
        });

        // Broadcast player join to others
        socket.broadcast.emit('playerJoin', gameState.players.get(socket.id));
    });

    // Handle player updates
    socket.on('playerUpdate', (update) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.position = update.position;
            player.rotation = update.rotation;
            player.gameMode = update.gameMode;
            socket.broadcast.emit('playerUpdate', player);
        }
    });

    // Handle block updates
    socket.on('blockUpdate', (update) => {
        const { position, type } = update;
        if (type === null) {
            gameState.blocks.delete(position);
        } else {
            gameState.blocks.set(position, { type });
        }
        socket.broadcast.emit('blockUpdate', update);
    });

    // Handle chat messages
    socket.on('chatMessage', (message) => {
        const player = gameState.players.get(socket.id);
        const playerName = player ? (player.name || socket.id.slice(0, 6)) : 'Anonymous';
        io.emit('chatMessage', `${playerName}: ${message.message}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        gameState.players.delete(socket.id);
        io.emit('playerLeave', socket.id);
    });
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 