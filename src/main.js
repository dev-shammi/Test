import { Client } from 'node-appwrite';
import cors from 'cors'; // Import the cors middleware

// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }) => {
  // Initialize the Appwrite client if needed
  // const client = new Client()
  //    .setEndpoint('https://cloud.appwrite.io/v1')
  //    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  //    .setKey(process.env.APPWRITE_API_KEY);

  // Enable CORS for all origins
  const corsMiddleware = cors();

  // Apply the CORS middleware to the request
  corsMiddleware(req, res, () => {
    // You can log messages to the console
    log('Hello, Logs!');

    // If something goes wrong, log an error
    error('Hello, Errors!');

    // The `req` object contains the request data
    if (req.method === 'GET') {
      // Send a response with the res object helpers
      // `res.send()` dispatches a string back to the client
      return res.send('Hello, World!');
    }

    // `res.json()` is a handy helper for sending JSON
    return res.json({
      motto: 'Build like a team of hundreds_',
      learn: 'https://appwrite.io/docs',
      connect: 'https://appwrite.io/discord',
      getInspired: 'https://builtwith.appwrite.io',
    });
  });
};