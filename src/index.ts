import { processDirectory, getSummary } from './fileProcessor';
import process from 'process';

async function main() {
  const legacyProjectPath: string | undefined = process.argv[2];
  if (!legacyProjectPath) {
    console.error("Please provide the path to the legacy project directory.");
    process.exit(1);
  }
  console.log(`Processing legacy project at: ${legacyProjectPath}`);
  await processDirectory(legacyProjectPath);
  
  const summary = getSummary();
  console.log("\n=== Refactoring Summary ===");
  console.log("Number of files attempted:", summary.attempted);
  console.log("Number of files succeeded:", summary.succeeded);
  console.log("Number of files refactored with gpt-3.5-turbo:", summary.gpt35Success);
  console.log("Number of files refactored with gpt-4o:", summary.fouroSuccess);
  console.log("Number of files failed initially but succeeded:", summary.failedInitiallyButSucceeded);
  console.log("Number of files failed:", summary.failed);
  if (summary.failedFiles.length > 0) {
    console.log("List of failed files:", summary.failedFiles.join(", "));
  }
}

main().catch((err) => {
  console.error("Application error:", err);
  process.exit(1);
}); 