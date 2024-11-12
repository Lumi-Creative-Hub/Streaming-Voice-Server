import { WebSocketServer } from 'ws';
import { RealtimeClient } from '@openai/realtime-api-beta';

export class RealtimeRelay {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.sockets = new WeakMap();
        this.wss = null;
    }

    listen(port) {
        try {
            this.wss = new WebSocketServer({ port });
            this.wss.on('connection', this.connectionHandler.bind(this));
            console.log(`[RealtimeRelay] Listening on wss://0.0.0.0:${port}`);
        } catch (error) {
            console.error(`[RealtimeRelay] Error initializing WebSocket Server: ${error.message}`);
        }
    }

    async connectionHandler(ws, req) {
        if (!req.url) {
            console.log('[RealtimeRelay] No URL provided, closing connection.');
            ws.close();
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        if (pathname !== '/') {
            console.log(`[RealtimeRelay] Invalid pathname: "${pathname}"`);
            ws.close();
            return;
        }

        console.log(`[RealtimeRelay] Connecting with key "${this.apiKey.slice(0, 3)}..."`);
        const client = new RealtimeClient({ apiKey: this.apiKey });

        // Handle OpenAI Realtime API events
        client.realtime.on('server.*', (event) => {
            console.log(`[RealtimeRelay] Relaying "${event.type}" to Client`);
            ws.send(JSON.stringify(event));
        });

        client.realtime.on('close', () => ws.close());

        const messageQueue = [];
        const messageHandler = (data) => {
            try {
                const event = JSON.parse(data);
                console.log(`[RealtimeRelay] Relaying "${event.type}" to OpenAI`);
                client.realtime.send(event.type, event);
            } catch (error) {
                console.error(`[RealtimeRelay] Error parsing client event: ${error.message}`);
            }
        };

        ws.on('message', (data) => {
            if (!client.isConnected()) {
                messageQueue.push(data);
            } else {
                messageHandler(data);
            }
        });

        ws.on('close', () => client.disconnect());

        try {
            console.log(`[RealtimeRelay] Connecting to OpenAI...`);
            await client.connect();
            console.log(`[RealtimeRelay] Connected to OpenAI successfully!`);
            while (messageQueue.length) {
                messageHandler(messageQueue.shift());
            }
        } catch (error) {
            console.log(`[RealtimeRelay] Error connecting to OpenAI: ${error.message}`);
            ws.close();
        }
    }
}
