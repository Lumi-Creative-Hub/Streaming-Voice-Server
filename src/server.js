import { startRelayServer } from './controllers/relayController.js';

try {
    startRelayServer();
    console.log('[Server] Server started successfully');
} catch (error) {
    console.error(`[Server] Failed to start server: ${error.message}`);
}
