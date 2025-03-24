import fs from 'fs';
import path from 'path';
import { refactorCode } from './openaiService';
import { sleep } from './utils';

export interface Summary {
  attempted: number;
  succeeded: number;
  failedInitiallyButSucceeded: number;
  failed: number;
  failedFiles: string[];
  gpt35Success: number;
  fouroSuccess: number;
}

const summary: Summary = {
  attempted: 0,
  succeeded: 0,
  failedInitiallyButSucceeded: 0,
  failed: 0,
  failedFiles: [],
  gpt35Success: 0,
  fouroSuccess: 0,
};

/**
 * Processes a single file: reads its content, refactors it, writes the new file, and deletes the original.
 */
export async function processFile(filePath: string): Promise<void> {
  summary.attempted++;
  const content: string = fs.readFileSync(filePath, "utf-8");

  const isReactComponent: boolean = /class\s+\w+\s+extends\s+(React\.Component|Component)/.test(content);
  let refactored: string;
  let initialAttemptFailed = false;

  try {
    refactored = await refactorCode(content, isReactComponent);
    summary.gpt35Success++;
  } catch (err: any) {
    initialAttemptFailed = true;
    console.error(`Error refactoring ${filePath} with gpt-3.5-turbo: ${err.message}. Retrying with gpt-4o...`);
    try {
      refactored = await refactorCode(content, isReactComponent, "gpt-4o");
      summary.fouroSuccess++;
    } catch (err2: any) {
      console.error(`Failed refactoring ${filePath} with both models: ${err2.message}`);
      summary.failed++;
      summary.failedFiles.push(filePath);
      return;
    }
  }

  try {
    const parsedPath = path.parse(filePath);
    const newExtension = isReactComponent ? ".tsx" : ".ts";
    const newFilePath = path.join(parsedPath.dir, `${parsedPath.name}${newExtension}`);

    fs.writeFileSync(newFilePath, refactored, "utf-8");
    console.log(`Refactored file written to: ${newFilePath}`);

    fs.unlinkSync(filePath);
    console.log(`Removed original file: ${filePath}`);

    summary.succeeded++;
    if (initialAttemptFailed) {
      summary.failedInitiallyButSucceeded++;
    }

    await sleep(1000);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    summary.failed++;
    summary.failedFiles.push(filePath);
  }
}

/**
 * Recursively processes a directory, refactoring all eligible files.
 */
export async function processDirectory(directory: string): Promise<void> {
  const entries: string[] = fs.readdirSync(directory);
  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      await processDirectory(fullPath);
    } else if ((fullPath.endsWith(".js") || fullPath.endsWith(".jsx")) && !fullPath.endsWith(".test.js")) {
      await processFile(fullPath);
    } else if (fullPath.endsWith(".test.js")) {
      console.log(`Skipping test file: ${fullPath}`);
    }
  }
}

/**
 * Returns the summary of the file processing.
 */
export function getSummary(): Summary {
  return summary;
} 