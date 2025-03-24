import dotenv from 'dotenv';
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY in environment variables.");
}

export default OPENAI_API_KEY; 