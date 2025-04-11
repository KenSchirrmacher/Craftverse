const fs = require('fs');
const path = require('path');

// Create saves directory if it doesn't exist
const savesDir = path.join(__dirname, '../saves');
if (!fs.existsSync(savesDir)) {
  fs.mkdirSync(savesDir);
}

// Save game state to file
function saveGame(worldName, players, blocks, mobs) {
  try {
    const saveData = {
      timestamp: Date.now(),
      players,
      blocks,
      mobs
    };

    const saveFile = path.join(savesDir, `${worldName}.json`);
    fs.writeFileSync(saveFile, JSON.stringify(saveData, null, 2));
    
    console.log(`Game saved to ${saveFile}`);
    return true;
  } catch (error) {
    console.error('Error saving game:', error);
    return false;
  }
}

// Load game state from file
function loadGame(worldName) {
  try {
    const saveFile = path.join(savesDir, `${worldName}.json`);
    
    if (!fs.existsSync(saveFile)) {
      console.error(`Save file not found: ${saveFile}`);
      return null;
    }
    
    const saveData = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
    console.log(`Game loaded from ${saveFile}`);
    
    return saveData;
  } catch (error) {
    console.error('Error loading game:', error);
    return null;
  }
}

// List available saved games
function listSaves() {
  try {
    const files = fs.readdirSync(savesDir);
    const saves = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const worldName = file.replace('.json', '');
        try {
          const saveData = JSON.parse(fs.readFileSync(path.join(savesDir, file), 'utf8'));
          return {
            name: worldName,
            timestamp: saveData.timestamp
          };
        } catch (error) {
          return {
            name: worldName,
            timestamp: null,
            error: 'Corrupted save file'
          };
        }
      });
    
    return saves;
  } catch (error) {
    console.error('Error listing saves:', error);
    return [];
  }
}

// Delete a saved game
function deleteSave(worldName) {
  try {
    const saveFile = path.join(savesDir, `${worldName}.json`);
    
    if (!fs.existsSync(saveFile)) {
      console.error(`Save file not found: ${saveFile}`);
      return false;
    }
    
    fs.unlinkSync(saveFile);
    console.log(`Save deleted: ${saveFile}`);
    return true;
  } catch (error) {
    console.error('Error deleting save:', error);
    return false;
  }
}

module.exports = {
  saveGame,
  loadGame,
  listSaves,
  deleteSave
}; 