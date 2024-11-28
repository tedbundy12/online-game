const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state management
const gameState = {
    players: new Map(),
    enemies: [],
    world: { width: 8000, height: 638 }
};

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    // Когда игрок подключается, передаем его состояние
    socket.on('join', (nickname) => {
        const player = {
            id: socket.id,
            x: 50,
            y: gameState.world.height / 2,
            nickname: nickname,
            radius: 15,
            dx: 0, // скорость по оси X
            dy: 0, // скорость по оси Y
        };
        gameState.players.set(socket.id, player);

        // Отправляем всем игрокам обновленное состояние игры
        socket.emit('gameState', {
            players: Array.from(gameState.players),
            enemies: gameState.enemies
        });

        // Оповещаем других игроков о подключении нового игрока
        socket.broadcast.emit('playerJoined', player);
    });

    // Обработка движения игрока
    socket.on('playerMove', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.dx = data.dx;
            player.dy = data.dy;
            
            // Оповещаем других игроков о движении этого игрока
            socket.broadcast.emit('playerMoved', player);
        }
    });

    // Когда игрок отключается, удаляем его из игры
    socket.on('disconnect', () => {
        gameState.players.delete(socket.id);
        socket.broadcast.emit('playerLeft', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
