// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error, context}) => {
  try {
    // Set CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Allow requests from all origins (adjust as needed)
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specified HTTP methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allow specified headers
    };

    // Send the response with CORS headers
    return res.send('Function executed successfully!', 200, corsHeaders);
  } catch (error) {
    // Handle errors
    return res.send({ error: 'An error occurred' });
  }
};