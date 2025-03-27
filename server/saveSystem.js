const fs = require('fs');
const path = require('path');

// Save directory
const SAVE_DIR = path.join(__dirname, 'saves');

// Ensure save directory exists
if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR);
}

// Save game state
function saveGame(worldName, players, blocks) {
    const saveData = {
        players,
        blocks,
        timestamp: Date.now()
    };

    const savePath = path.join(SAVE_DIR, `${worldName}.json`);
    fs.writeFileSync(savePath, JSON.stringify(saveData, null, 2));
    return true;
}

// Load game state
function loadGame(worldName) {
    const savePath = path.join(SAVE_DIR, `${worldName}.json`);
    
    if (!fs.existsSync(savePath)) {
        return null;
    }

    try {
        const saveData = JSON.parse(fs.readFileSync(savePath, 'utf8'));
        return saveData;
    } catch (error) {
        console.error('Error loading save:', error);
        return null;
    }
}

// List available saves
function listSaves() {
    return fs.readdirSync(SAVE_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
}

// Delete save
function deleteSave(worldName) {
    const savePath = path.join(SAVE_DIR, `${worldName}.json`);
    
    if (fs.existsSync(savePath)) {
        fs.unlinkSync(savePath);
        return true;
    }
    return false;
}

module.exports = {
    saveGame,
    loadGame,
    listSaves,
    deleteSave
}; 