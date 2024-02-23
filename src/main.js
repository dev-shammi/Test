/*BazaaronKaBaap*/
const admin = require('firebase-admin');
const axios = require('axios');
const zlib = require('zlib');
const { promisify } = require('util');
const { google } = require('googleapis');
const crypto = require('crypto');
const gzipAsync = promisify(zlib.gzip);
const SCOPES = ['https://www.googleapis.com/auth/firebase.hosting'];
const projectId = 'bazaaronkabaap';
const key = require('./private/service.json');
let files;
let htmlContent, filePath, accessToken; // to be provided
// Set CORS headers
const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // Allow requests from all origins (adjust as needed)
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allow specified HTTP methods
        'Access-Control-Allow-Headers': '*', // Allow all headers (adjust as needed)
        'Access-Control-Allow-Credentials': 'true',
};
// Initialize Firebase Admin SDK
admin.initializeApp({
        credential: admin.credential.cert(key),
        databaseURL: 'https://bazaaronkabaap-default-rtdb.firebaseio.com',
});
// Function to get an access token
function getAccessToken() {
        return new Promise((resolve, reject) => {
                const jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);
                jwtClient.authorize((err, tokens) => {
                        if(err) {
                                reject(err);
                                return;
                        }
                        resolve(tokens.access_token);
                });
        });
}
// Function to create a new version
async function createNewVersion(siteId) {
        const versionEndpoint = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`;
        try {
                const accessToken = await getAccessToken();
                const response = await axios.post(versionEndpoint, {}, {
                        headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                        },
                });
                const versionId = response.data.name.split('/').pop();
                return versionId;
        }
        catch (error) {
                error('Error creating a new version:', error.response);
                throw error;
        }
}
async function getCurrentVersion(siteId) {
        const versionEndpoint = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions`;
        try {
                const accessToken = await getAccessToken(); // Assuming you have a function to get the access token
                const response = await axios.get(versionEndpoint, {
                        headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                        },
                });
                const currentVersion = response.data.versions[0];
                return currentVersion;
        }
        catch (error) {
                error('Error retrieving current version:', error);
                throw error;
        }
}
module.exports = async ({ req, res, log, error }) => {
        try {
                // Iterate over res.headers and add each header to corsHeaders
                for(const headerName in res.headers) {
                        if(Object.prototype.hasOwnProperty.call(res.headers, headerName)) {
                                corsHeaders[headerName] = res.headers[headerName];
                        }
                }
                // Check if it's an OPTIONS request
                if(req.method === 'OPTIONS') {
                        // Respond with 200 OK
                        return res.send('Okay', 200, corsHeaders);
                }
                // For other request methods (GET, POST), proceed with your logic
                if(req.method === 'GET') {
                        // Log a message to the console
                        log('Fetching data from Firebase Realtime Database...');
                        const db = admin.database();
                        const ref = db.ref('products');
                        // Retrieve data from the database
                        const snapshot = await ref.once('value');
                        const productsData = snapshot.val();
                        // Log retrieved data using logging function
                        log('Retrieved products data:', productsData);
                        // Set status code and send the retrieved data as a response with 200 OK status code
                        return res.send(JSON.stringify(productsData), 200, corsHeaders);
                }
                else if(req.method === 'POST') {
                        // Get data from the res.body and start posting
                        const postData = req.body;
                        if(postData) {
                                filePath = postData.path;
                                htmlContent = postData.content;
                                log({ message: "Initiated Posting...", f: filePath, h: htmlContent });

                                        //Download The Existing Files From Hosting
                                        log("Determining latest release...");
                                        const accessToken = await getAccessToken(); // Replace 'YOUR_ACCESS_TOKEN' with the actual access token obtained from Firebase Authentication
                                        const compressedContent = await gzipAsync(htmlContent);
                                        const hash = crypto.createHash('sha256').update(compressedContent).digest('hex');
                                        // Convert HTML content to Buffer
                                        const contentBuffer = Buffer.from(htmlContent, 'utf-8');
                                        let siteId = projectId;
                                        let newVersion = await createNewVersion(siteId);
                                        const headers = {
                                                'Authorization': `Bearer ${accessToken}`
                                        };
                                        let response = await axios.get(`https://firebasehosting.googleapis.com/v1beta1/sites/${projectId}/releases`, {
                                                headers
                                        });
                                        let releases = response.data.releases;
                                        releases.forEach((release) => {
                                                log( /*release.name, */ release.version.status, release.version.createTime, release.version.fileCount, release.version.name);
                                        })
                                        let latestVersion = releases[0].version.name;
                                        // Get the files in the latest version
                                        log("Getting files in latest version...");
                                        response = await axios.get(`https://firebasehosting.googleapis.com/v1beta1/${latestVersion}/files`, {
                                                headers
                                        });
                                        log(response.data);
                                        files = {};
                                        response.data.files.forEach(file => {
                                                files[file.path] = file.hash;
                                        });
                                        files[filePath] = hash;
                                        log("Deploying HTML Content To Firebase Hosting...");
                                        try {
                                                /*i also tried with the same version id but it doesn't work*/
                                                //await populateHtmlContent(siteId, versionId, htmlContent);
                                                const populateEndpoint = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${newVersion}:populateFiles`;
                                                log("Writing HTML Content To The Version...");
                                                try {
                                                        const response = await axios.post(populateEndpoint, {
                                                                files
                                                        }, {
                                                                headers: {
                                                                        Authorization: `Bearer ${accessToken}`,
                                                                        'Content-Type': 'application/json',
                                                                },
                                                        });
                                                        if(response.data) {
                                                                log('HTML Content Populated For The Version : ', response.data);
                                                                if(response.data.uploadRequiredHashes[0].length) {
                                                                        return Object.keys(files).forEach((d, i) => {
                                                                                let fileHash = response.data.uploadRequiredHashes[i];
                                                                                //finaliseHosting(siteId, versionId, response.data.uploadRequiredHashes[i]);
                                                                                log("Uploading File...");
                                                                                log("File Hash : ", fileHash)
                                                                                // Construct the file-specific URL
                                                                                const fileSpecificUrl = `https://upload-firebasehosting.googleapis.com/upload/sites/${siteId}/versions/${newVersion}/files/${fileHash}`;
                                                                                // Make the HTTP request to upload the HTML content using compressedContent directly
                                                                                return axios.post(fileSpecificUrl, compressedContent, {
                                                                                        headers: {
                                                                                                'Authorization': `Bearer ${accessToken}`,
                                                                                                'Content-Type': 'application/octet-stream',
                                                                                                'Content-Length': compressedContent.length.toString(),
                                                                                        },
                                                                                }).then(async (response) => {                                                                                
                                                                                        log('HTML Content Uploaded Successfully : ', response.data);
                                                                                        // Call this function after uploading all files and populating HTML content
                                                                                        //await finalizeVersion(SITE_ID, VERSION_ID);
                                                                                        const patchEndpoint = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/versions/${newVersion}?update_mask=status`;
                                                                                        log("Finalising Version...");
                                                                                        try {
                                                                                                const response = await axios.patch(patchEndpoint, {
                                                                                                        status: 'FINALIZED'
                                                                                                }, {
                                                                                                        headers: {
                                                                                                                Authorization: `Bearer ${accessToken}`,
                                                                                                                'Content-Type': 'application/json',
                                                                                                        },
                                                                                                });
                                                                                                log('Version Status Finalized : ', response.data);
                                                                                                const releaseEndpoint = `https://firebasehosting.googleapis.com/v1beta1/sites/${siteId}/releases?versionName=sites/${siteId}/versions/${newVersion}`;
                                                                                                try {
                                                                                                        const response = await axios.post(releaseEndpoint, {}, {
                                                                                                                headers: {
                                                                                                                        Authorization: `Bearer ${accessToken}`,
                                                                                                                        'Content-Type': 'application/json',
                                                                                                                },
                                                                                                        });
                                                                                                        log('Version released for deployment:', response.data);
                                                                                                        throw res.send("deployed", 200, corsHeaders);
                                                                                                }
                                                                                                catch (error) {
                                                                                                        error('Error releasing version:', error.response.data);
                                                                                                        throw error;
                                                                                                }
                                                                                        }
                                                                                        catch (error) {
                                                                                                error('Error Finalizing Version Status : ', error.response.data);
                                                                                                throw error;
                                                                                        }
                                                                                }).catch(error => {
                                                                                        error('Error uploading HTML content:', error.response.data);
                                                                                });
                                                                        })
                                                                }
                                                                else {
                                                                        log('No Upload Required Hashes Found')
                                                                }
                                                        }
                                                        else {
                                                                log("Error Occurred While Obtaining Content Hash Or URL");
                                                        }
                                                }
                                                catch (error) {
                                                        error('Error Populating HTML Content, The HTML or File May Exists Or : ', error);
                                                        throw error;
                                                }
                                        }
                                        catch (error) {
                                                error('Deployment failed:', error.message);
                                        }
                        }
                        else {
                                error("No Data Specified");
                                return res.send(JSON.stringify({ message: "No Data Specified", type: 'request has no body ' }), 200, corsHeaders); // Add this return statement
                        }
                }
        }
        catch (e) {
                error(e);
                return res.send(JSON.stringify({ message: e, data: "Error occurred while uploading" }), 200, corsHeaders);
        }
};