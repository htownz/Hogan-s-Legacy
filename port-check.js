import * as net from 'net';

// Check port 80
const port = 80;
const host = '0.0.0.0';

const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is in use - something is already listening on this port.`);
  } else if (err.code === 'EACCES') {
    console.log(`Access denied to port ${port} - you might need elevated privileges.`);
  } else {
    console.log(`Error checking port ${port}: ${err.message}`);
  }
});

server.once('listening', () => {
  console.log(`Port ${port} is available (not in use).`);
  server.close();
});

console.log(`Checking if port ${port} is in use...`);
server.listen(port, host);