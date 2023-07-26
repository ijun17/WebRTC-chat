//node js


const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const connections = new Set();

wss.on('connection', (ws) => {
    console.log('New client connected.');
    connections.add(ws);
    ws.on('message', (message) => {
        console.log('Received message:', message);

        // 모든 연결된 클라이언트들에게 메시지를 전달합니다.
        connections.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });


    ws.on('close', () => {
        console.log('Client disconnected.');
        connections.delete(ws);
    });
});
