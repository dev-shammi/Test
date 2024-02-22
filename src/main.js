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

    // Use the additional data in your function logic
    // For example, log or process the data
    log('Custom Header Data:'); console.log(customHeaderData);

    // Send a response back to the client
    return res.send('Function executed successfully!');
  } catch (e) {
    // Handle JSON parsing errors
    error('Error parsing JSON:', e);
    return res.send('Error processing request.');
  }
};