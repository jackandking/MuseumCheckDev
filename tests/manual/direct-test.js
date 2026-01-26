// Direct test of BaseGame class
console.log('Testing BaseGame class directly...');

// Execute BaseGame definition
const baseGameCode = require('fs').readFileSync('js/base-game.js', 'utf8');
eval(baseGameCode);

console.log('BaseGame type:', typeof BaseGame);

if (typeof BaseGame === 'function') {
    const game = new BaseGame('test');
    console.log('Game created:', game);
    console.log('Game state:', game.state);
    console.log('Game type:', game.gameType);
} else {
    console.log('BaseGame is not a function');
}
