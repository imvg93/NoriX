const { exec } = require('child_process');
const util = require('util');
const net = require('net');

const execAsync = util.promisify(exec);

/**
 * Kill all Node.js processes (nuclear option)
 */
async function killAllNodeProcesses() {
  try {
    console.log('🔧 Killing all Node.js processes...');
    await execAsync('taskkill /F /IM node.exe');
    console.log('✅ All Node.js processes terminated');
    return true;
  } catch (error) {
    console.log('ℹ️ No Node.js processes found or already terminated');
    return false;
  }
}

/**
 * Kill specific process by PID
 */
async function killProcessByPID(pid) {
  try {
    console.log(`🔧 Killing process ${pid}...`);
    await execAsync(`taskkill /PID ${pid} /F`);
    console.log(`✅ Process ${pid} terminated`);
    return true;
  } catch (error) {
    console.log(`⚠️ Could not kill process ${pid}:`, error.message);
    return false;
  }
}

/**
 * Find process using specific port
 */
async function findProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    const pids = [];
    
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        
        if (pid && !isNaN(parseInt(pid))) {
          pids.push(pid);
        }
      }
    }
    
    return pids;
  } catch (error) {
    return [];
  }
}

/**
 * Kill all processes using specific port
 */
async function killProcessesOnPort(port) {
  const pids = await findProcessOnPort(port);
  
  if (pids.length === 0) {
    console.log(`ℹ️ No processes found on port ${port}`);
    return true;
  }
  
  console.log(`🔧 Found ${pids.length} process(es) using port ${port}`);
  
  for (const pid of pids) {
    await killProcessByPID(pid);
  }
  
  return true;
}

/**
 * Check if port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find next available port starting from given port
 */
async function findNextAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
  }
  
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
}

/**
 * Clean up port and find available port
 */
async function cleanupAndFindPort(preferredPort = 5000) {
  console.log(`🔍 Checking port ${preferredPort}...`);
  
  // Check if preferred port is available
  const isAvailable = await isPortAvailable(preferredPort);
  
  if (isAvailable) {
    console.log(`✅ Port ${preferredPort} is available`);
    return preferredPort;
  }
  
  console.log(`⚠️ Port ${preferredPort} is in use`);
  
  // Try to kill processes on the port
  await killProcessesOnPort(preferredPort);
  
  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check again
  const isAvailableAfterCleanup = await isPortAvailable(preferredPort);
  
  if (isAvailableAfterCleanup) {
    console.log(`✅ Port ${preferredPort} is now available after cleanup`);
    return preferredPort;
  }
  
  // Find next available port
  console.log(`🔄 Finding next available port...`);
  const availablePort = await findNextAvailablePort(preferredPort);
  console.log(`✅ Found available port: ${availablePort}`);
  
  return availablePort;
}

// Export functions for use in other scripts
module.exports = {
  killAllNodeProcesses,
  killProcessByPID,
  findProcessOnPort,
  killProcessesOnPort,
  isPortAvailable,
  findNextAvailablePort,
  cleanupAndFindPort
};

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const port = parseInt(args[1]) || 5000;
  
  switch (command) {
    case 'kill-all':
      killAllNodeProcesses();
      break;
    case 'kill-port':
      killProcessesOnPort(port);
      break;
    case 'check-port':
      isPortAvailable(port).then(available => {
        console.log(`Port ${port} is ${available ? 'available' : 'in use'}`);
      });
      break;
    case 'find-port':
      cleanupAndFindPort(port).then(foundPort => {
        console.log(`Available port: ${foundPort}`);
      });
      break;
    default:
      console.log(`
Port Manager CLI Usage:
  node port-manager.js kill-all          # Kill all Node.js processes
  node port-manager.js kill-port [port]  # Kill processes on specific port
  node port-manager.js check-port [port] # Check if port is available
  node port-manager.js find-port [port]  # Clean up and find available port
      `);
  }
}
