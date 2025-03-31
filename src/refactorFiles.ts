import { promises as fs } from "fs";
import * as path from "path";
import { refactorReact, refactorJavascript } from "./refactorFunctions";
import dotenv from "dotenv";

dotenv.config();

// Metrics report interface
interface Metrics {
    attempted: number;
    success: number;
    retried: number;
    failed: number;
    failedFiles: string[];
}

// Global metrics object to track refactoring outcomes.
const metrics: Metrics = {
    attempted: 0,
    success: 0,
    retried: 0,
    failed: 0,
    failedFiles: [],
};

// A simple function to determine if a JS file is a React component
function isReactComponent(content: string): boolean {
    // Check for an import of React or a class that extends React.Component/Component.
    return /import\s+React\b/.test(content) ||
        /extends\s+React\.Component\b/.test(content) ||
        /extends\s+Component\b/.test(content);
}

// Recursively walk through the directory and process the files accordingly
async function processFiles(dir: string): Promise<void> {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath: string = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await processFiles(fullPath);
            } else if (entry.isFile() && path.extname(entry.name) === ".js") {
                // If the file is a test file, ignore it.
                if (entry.name.endsWith(".test.js")) {
                    console.log(`Skipping test file: ${fullPath}`);
                    continue;
                }
                
                try {
                    const content: string = await fs.readFile(fullPath, "utf8");
                    let result;
                    if (isReactComponent(content)) {
                        result = await refactorReact(fullPath, content);
                    } else {
                        result = await refactorJavascript(fullPath, content);
                    }
                    if (result) {
                        metrics.attempted++;
                        if (result.success) {
                            metrics.success++;
                            if (result.retried) {
                                metrics.retried++;
                            }
                        } else {
                            metrics.failed++;
                            metrics.failedFiles.push(fullPath);
                        }
                    }
                } catch (fileErr) {
                    console.error(`Error processing file ${fullPath}:`, fileErr);
                    metrics.failed++;
                    metrics.failedFiles.push(fullPath);
                }
            }
        }
    } catch (dirErr) {
        console.error(`Error reading directory ${dir}:`, dirErr);
    }
}

// Determine the input folder from a command line argument.
// Usage example: `node dist/refactorFiles.js /path/to/project/input`
const inputFolder: string = process.argv[2] || path.join(__dirname, "input");

console.log(`Processing files in: ${inputFolder}`);

processFiles(inputFolder)
    .then(() => {
        console.log("Processing complete.");
        console.log("Refactoring Report:");
        console.log(`Attempted files: ${metrics.attempted}`);
        console.log(`Successful files: ${metrics.success}`);
        console.log(`Retried and succeeded: ${metrics.retried}`);
        console.log(`Failed files: ${metrics.failed}`);
        if (metrics.failedFiles.length > 0) {
            console.log("List of failed files:");
            for (const file of metrics.failedFiles) {
                console.log(file);
            }
        }
    })
    .catch((error) => {
        console.error("Error processing files:", error);
    }); 