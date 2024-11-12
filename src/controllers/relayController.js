import { RealtimeRelay } from '../services/relayService.js';
import { config } from '../config/config.js';

export const startRelayServer = () => {
    if (!config.openaiApiKey) {
        console.error(
            `Environment variable "OPENAI_API_KEY" is required. Please set it in your .env file.`
        );
        process.exit(1);
    }

    const relay = new RealtimeRelay(config.openaiApiKey);
    relay.listen(config.port);
};
