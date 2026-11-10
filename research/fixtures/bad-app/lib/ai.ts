import OpenAI from 'openai';

// Runs in the browser, so the key is in every visitor's page.
export const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, dangerouslyAllowBrowser: true });
