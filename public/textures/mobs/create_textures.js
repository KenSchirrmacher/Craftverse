// Simple script to generate mob textures
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create mob textures
function createMobTexture(type, width, height, colorFn) {
    console.log(`Creating texture for ${type}...`);
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Call the color function to draw the mob
    colorFn(ctx, width, height);
    
    // Save the texture
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`${type}.png`, buffer);
    
    console.log(`${type}.png created!`);
}

// Create sheep texture
createMobTexture('sheep', 64, 64, (ctx, w, h) => {
    // Body (white/light gray)
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(16, 20, 32, 24);
    
    // Head
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(20, 12, 24, 16);
    
    // Legs
    ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(20, 44, 6, 16);
    ctx.fillRect(38, 44, 6, 16);
    ctx.fillRect(20, 44, 6, 16);
    ctx.fillRect(38, 44, 6, 16);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 20, 4, 4); // Eyes
    ctx.fillRect(36, 20, 4, 4);
});

// Create cow texture
createMobTexture('cow', 64, 64, (ctx, w, h) => {
    // Body (brown)
    ctx.fillStyle = '#4D3B24';
    ctx.fillRect(12, 20, 40, 24);
    
    // White patches
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(14, 22, 16, 10);
    ctx.fillRect(34, 30, 14, 12);
    
    // Head
    ctx.fillStyle = '#4D3B24';
    ctx.fillRect(18, 10, 28, 20);
    
    // White face patch
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(24, 10, 16, 12);
    
    // Legs
    ctx.fillStyle = '#4D3B24';
    ctx.fillRect(18, 44, 8, 16);
    ctx.fillRect(38, 44, 8, 16);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 18, 4, 4); // Eyes
    ctx.fillRect(36, 18, 4, 4);
    ctx.fillRect(28, 22, 8, 4); // Nose
});

// Create pig texture
createMobTexture('pig', 64, 64, (ctx, w, h) => {
    // Body (pink)
    ctx.fillStyle = '#F1A7A5';
    ctx.fillRect(12, 20, 40, 24);
    
    // Head
    ctx.fillStyle = '#F1A7A5';
    ctx.fillRect(18, 12, 28, 20);
    
    // Snout
    ctx.fillStyle = '#FFBDBD';
    ctx.fillRect(26, 24, 12, 8);
    
    // Legs
    ctx.fillStyle = '#F1A7A5';
    ctx.fillRect(18, 44, 8, 12);
    ctx.fillRect(38, 44, 8, 12);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(22, 18, 4, 4); // Eyes
    ctx.fillRect(38, 18, 4, 4);
    ctx.fillRect(28, 26, 4, 4); // Nose
    ctx.fillRect(32, 26, 4, 4);
});

// Create chicken texture
createMobTexture('chicken', 64, 64, (ctx, w, h) => {
    // Body (light cream)
    ctx.fillStyle = '#FFEEDD';
    ctx.fillRect(20, 24, 24, 16);
    
    // Head
    ctx.fillStyle = '#FFEEDD';
    ctx.fillRect(24, 12, 16, 12);
    
    // Beak
    ctx.fillStyle = '#FF9933';
    ctx.fillRect(28, 18, 8, 4);
    
    // Comb
    ctx.fillStyle = '#DD4444';
    ctx.fillRect(24, 8, 4, 6);
    ctx.fillRect(28, 8, 4, 4);
    
    // Legs
    ctx.fillStyle = '#FF9933';
    ctx.fillRect(26, 40, 4, 12);
    ctx.fillRect(34, 40, 4, 12);
    
    // Wings
    ctx.fillStyle = '#EEDDCC';
    ctx.fillRect(16, 24, 8, 12);
    ctx.fillRect(40, 24, 8, 12);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 16, 3, 3); // Eyes
    ctx.fillRect(37, 16, 3, 3);
});

// Create zombie texture
createMobTexture('zombie', 64, 64, (ctx, w, h) => {
    // Body (green)
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(16, 20, 32, 26);
    
    // Head
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(20, 8, 24, 20);
    
    // Arms
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(10, 20, 6, 22);
    ctx.fillRect(48, 20, 6, 22);
    
    // Legs
    ctx.fillStyle = '#4A5A28';
    ctx.fillRect(20, 46, 10, 18);
    ctx.fillRect(34, 46, 10, 18);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 16, 4, 4); // Eyes
    ctx.fillRect(36, 16, 4, 4);
    ctx.fillRect(28, 22, 8, 4); // Mouth
});

// Create skeleton texture
createMobTexture('skeleton', 64, 64, (ctx, w, h) => {
    // Body (light gray)
    ctx.fillStyle = '#E3E3E3';
    ctx.fillRect(24, 20, 16, 26);
    
    // Ribs
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(20, 22 + i * 4, 24, 2);
    }
    
    // Head
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(20, 8, 24, 20);
    
    // Arms
    ctx.fillStyle = '#E3E3E3';
    ctx.fillRect(10, 20, 6, 22);
    ctx.fillRect(48, 20, 6, 22);
    
    // Legs
    ctx.fillStyle = '#E3E3E3';
    ctx.fillRect(24, 46, 6, 18);
    ctx.fillRect(34, 46, 6, 18);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 16, 4, 4); // Eyes
    ctx.fillRect(36, 16, 4, 4);
    ctx.fillRect(28, 22, 8, 2); // Mouth
});

// Create creeper texture
createMobTexture('creeper', 64, 64, (ctx, w, h) => {
    // Body (green)
    ctx.fillStyle = '#52A652';
    ctx.fillRect(16, 20, 32, 32);
    
    // Head
    ctx.fillStyle = '#52A652';
    ctx.fillRect(20, 8, 24, 20);
    
    // Legs
    ctx.fillStyle = '#448844';
    ctx.fillRect(18, 52, 10, 12);
    ctx.fillRect(36, 52, 10, 12);
    
    // Face details
    ctx.fillStyle = '#222222';
    ctx.fillRect(24, 16, 4, 4); // Eyes
    ctx.fillRect(36, 16, 4, 4);
    ctx.fillRect(28, 24, 4, 8); // Mouth vertical
    ctx.fillRect(32, 24, 4, 8);
    ctx.fillRect(24, 28, 4, 4); // Mouth horizontal
    ctx.fillRect(36, 28, 4, 4);
});

console.log('All textures created successfully!'); 