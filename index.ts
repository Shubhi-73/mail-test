// TypeScript code to send an email via Gmail API
import { google, gmail_v1 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Type definitions
interface Credentials {
  installed?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
  web?: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface Token {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Function to get OAuth2 client
async function getOAuth2Client() {
  // Path to credentials file (downloaded from Google Cloud Console)
  const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
  const TOKEN_PATH = path.join(process.cwd(), 'token.json');
  
  // Load credentials from file
  const credentialsContent = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  const credentials: Credentials = JSON.parse(credentialsContent);
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web || { 
    client_secret: '', 
    client_id: '', 
    redirect_uris: [''] 
  };
  
  // Create OAuth2 client
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  
  // Check if we have a stored token
  try {
    const tokenContent = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const token: Token = JSON.parse(tokenContent);
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (error) {
    return getNewToken(oAuth2Client);
  }
}

// Function to get new OAuth2 token
async function getNewToken(oAuth2Client: any) {
  const TOKEN_PATH = path.join(process.cwd(), 'token.json');
  const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
  
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  
  console.log('Authorize this app by visiting this URL:', authUrl);
  
  // Get authorization code from user
  const code = await new Promise<string>(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      resolve(code);
    });
  });
  
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  
  // Save token for future use
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.log('Token stored to', TOKEN_PATH);
  
  return oAuth2Client;
}

// Function to send email
async function sendEmail(to: string, subject: string, body: string) {
  const auth = await getOAuth2Client();
  const gmail = google.gmail({ version: 'v1', auth }) as gmail_v1.Gmail;
  
  // Construct the email
  
  
  const from = 'srivastava.snigdha519@gmail.com';
  
  
  // Encode the email in base64
  const emailLines = [
    `From: ${from}`,
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body
  ];
  
  const email = emailLines.join('\r\n').trim();
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    
    console.log('Email sent successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Get authorized client
    
    const to = 'srivastava.snigdha519@gmail.com';
    const subject = 'Test Email';
    const body = 'Hello! This is a test email sent from the Gmail API.';
    
    // Send the email
    await sendEmail(to,subject,body);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the app
main();