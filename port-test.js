import * as http from 'http';

// Testing HTTP connection to port 80
console.log('Testing HTTP connection to port 80...');

// Make a simple HTTP request to the localhost on port 80
const options = {
  hostname: 'localhost',
  port: 80,
  path: '/health', // Use health check endpoint
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE BODY:');
    console.log(data);
    console.log('\nThe connection to port 80 works correctly!');
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});

// End the request
req.end();