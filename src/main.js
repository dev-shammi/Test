// This is your Appwrite function
// It's executed each time we get a request
export default async ({ req, res, log, error }) => {
  // You can log messages to the console
  log('Hello, Logs!');

  // If something goes wrong, log an error
  error('Hello, Errors!');

  try {
    // Parse the request body to extract additional data
    const requestBody = req.body ? JSON.parse(req.body) : {};

    // Access additional data sent by the client
    const customHeaderData = requestBody.customHeaderData;

    // Check if customHeaderData is undefined
    if (customHeaderData === undefined) {
      // Handle the case where customHeaderData is undefined
      log('customHeaderData is undefined');
      // Send an appropriate response to the client
      return res.send('customHeaderData is undefined');
    }

    // Use the additional data in your function logic
    // For example, log or process the data
    log('Custom Header Data:', customHeaderData);

    // Set CORS headers in the response data
    const responseData = {
      customHeaderData: customHeaderData,
      corsHeaders: {
        'Access-Control-Allow-Origin': '*', // Allow requests from all origins (adjust as needed)
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specified HTTP methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allow specified headers
      },
      message: 'Function executed successfully!'
    };

    // Send the response data back to the client
    return res.send(responseData);
  } catch (e) {
    // Handle JSON parsing errors
    error('Error parsing JSON:', e);
    return res.send('Error processing request.');
  }
};