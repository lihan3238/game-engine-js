// This script reads the URL parameter and loads the correct game file.

// 1. Get the query parameters from the URL
const urlParams = new URLSearchParams(window.location.search);
const gameToLoad = urlParams.get('game');

// 2. A map of available games to their script files and titles
const games = {
    'breakout': {
        script: 'breakout.js',
        title: 'Breakout'
    },
    'camera-demo': {
        script: 'camera-demo.js',
        title: 'Camera Demo'
    }
};

// 3. Check if the requested game exists in our map
if (gameToLoad && games[gameToLoad]) {
    const gameInfo = games[gameToLoad];

    // Set the page title
    document.title = `Game Engine - ${gameInfo.title}`;

    // Create a new script element
    const script = document.createElement('script');
    script.src = gameInfo.script;
    
    // Append the script to the body to load and run it
    document.body.appendChild(script);
} else {
    // Handle the case where the game parameter is missing or invalid
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Error: Game not found.', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText('Please return to the main menu.', canvas.width / 2, canvas.height / 2 + 20);
}