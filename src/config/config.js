import dotenv from 'dotenv';

dotenv.config();

export const config = {
    openaiApiKey: process.env.OPENAI_API_KEY,
    port: parseInt(process.env.PORT) || 8081,
};
