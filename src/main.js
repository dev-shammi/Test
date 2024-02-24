// Set CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow requests from all origins (adjust as needed)
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specified HTTP methods
  'Access-Control-Allow-Headers': '*', // Allow all headers (adjust as needed)
  'Access-Control-Allow-Credentials': 'true',
};
// This is your Appwrite function
module.exports = async ({ req, res, log, error, context }) => {
  try {
    // Iterate over res.headers and add each header to corsHeaders
    for (const headerName in res.headers) {
      if (Object.prototype.hasOwnProperty.call(res.headers, headerName)) {
        corsHeaders[headerName] = res.headers[headerName];
      }
    }

    // Check if it's an OPTIONS request
    if (req.method === 'OPTIONS') {
      // Respond with 200 OK
      return res.send('Okay', 200, corsHeaders);
    }

    // For other request methods (GET, POST), proceed with your logic
    if (req.method === 'GET') {
      // Log a message to the console
      log('Hello! From GET');
      // Set status code and send the retrieved data as a response with 200 OK status code
      return res.send('Hello! From Get', 200, corsHeaders);
    } else if (req.method === 'POST') {
      // Log a message to the console
      log('Hello! From POST');
      return res.send('Hello! From POST', 200, corsHeaders);
    } else {
      // For unsupported request methods, send a 405 Method Not Allowed response
      return res.send(JSON.stringify({ error: 'Unsupported request method. Only GET and POST requests are allowed.' }), 405, corsHeaders);
    }
  } catch (err) {
    // Log and handle errors
    error('Error processing request');
    // Set status code and send an appropriate error response to the client with the error message
    return res.send(JSON.stringify({ error: 'An error occurred while processing the request.', message: err.message }), 500, corsHeaders);
  }
};