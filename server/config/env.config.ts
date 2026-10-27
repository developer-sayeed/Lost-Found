import path from 'path';
import { GoogleGenAI } from '@google/genai';

export const PORT = 3000;
export const DATA_DIR = path.join(process.cwd(), 'data');
export const DB_FILE = path.join(DATA_DIR, 'db.json');

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});
