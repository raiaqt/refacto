import express, { Request, Response } from 'express';

const app = express();
const port: number = 3000;

// Define a route for the home page
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Express.js with TypeScript!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 