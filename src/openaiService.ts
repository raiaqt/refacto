import OpenAI from 'openai';
import OPENAI_API_KEY from './config';
import { sleep } from './utils';

export interface ChatCompletionMessage {
  content: string;
}

export interface ChatCompletionChoice {
  message?: ChatCompletionMessage;
}

export interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}

const openaiApi = new OpenAI({
  apiKey: OPENAI_API_KEY
});

/**
 * Calls the OpenAI API with retry logic for rate limit errors.
 */
export async function callOpenAIWithRetries(options: any): Promise<ChatCompletionResponse> {
  const maxRetries = 5;
  const baseDelay = 2000;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await openaiApi.chat.completions.create(options);
    } catch (err: any) {
      const status = err.status || (err.response && err.response.status);
      if (status === 429) {
        const jitter = Math.floor(Math.random() * 1000);
        const delayTime = baseDelay * Math.pow(2, attempt) + jitter;
        console.warn(`Rate limit error encountered. Retrying in ${delayTime} ms (attempt ${attempt + 1}/${maxRetries})...`);
        await sleep(delayTime);
      } else {
        throw err;
      }
    }
  }
  throw new Error("Exceeded maximum retries due to persistent rate limit errors.");
}

/**
 * Sends file content to the OpenAI API for refactoring.
 */
export async function refactorCode(fileContent: string, isReactComponent: boolean, model: string = "gpt-3.5-turbo"): Promise<string> {
  const prompt = isReactComponent
    ? `
Refactor the following legacy React class component code to modern standards:
- Convert all class components into functional components.
- Convert the code from JavaScript to TypeScript (tsx) syntax.
- Do not modify internal import statements; retain the original filenames and extensions.
- If the file is too long, split it into multiple files for better readability and maintainability.
- Apply modern React, TypeScript, and frontend best practices.
- Return only code in your response, without any markdown formatting or extra commentary.
- Respond with text format, not markdown.

Legacy code:
${fileContent}`
    : `
Refactor the following JavaScript code to modern standards:
- Convert the code from JavaScript to TypeScript (ts) syntax.
- Use modern JavaScript/TypeScript features and ensure type safety.
- Remove any usage of PropTypes if present, replacing them with appropriate TypeScript types.
- Optimize functions and definitions for clarity and maintainability.
- Retain original import statements without changes.
- Return only code in your response, without any markdown formatting or extra commentary.
- Respond with text format, not markdown.

Legacy code:
${fileContent}`;

  const response = await callOpenAIWithRetries({
    model,
    messages: [
      {
        role: "system",
        content: "You are concise and opinionated, return clean, maintainable, readable code in code-only format without any markdown formatting or additional commentary."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.1
  });

  const message = response.choices[0]?.message;
  if (!message || !message.content) {
    throw new Error("No content received from OpenAI response.");
  }
  return message.content;
} 