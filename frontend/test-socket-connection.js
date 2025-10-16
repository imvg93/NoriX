// Test script to verify socket connection
// Run this in the browser console to test socket functionality

console.log('🔌 Socket Connection Test Starting...');

// Check if socket service is available
if (typeof window !== 'undefined' && window.socketService) {
  const socketService = window.socketService;
  
  console.log('✅ Socket service found');
  
  // Check current connection status
  const status = socketService.getConnectionStatus();
  console.log('📊 Current status:', status);
  
  // Test connection
  console.log('🔍 Testing connection...');
  socketService.checkConnection();
  
  // Test ping if connected
  if (status.isConnected) {
    console.log('🏓 Testing ping...');
    socketService.ping();
  } else {
    console.log('❌ Not connected, attempting to reconnect...');
    socketService.forceReconnect();
  }
  
} else {
  console.log('❌ Socket service not found');
  console.log('Available globals:', Object.keys(window));
}

// Test event listeners
console.log('🎧 Setting up test event listeners...');

window.addEventListener('socketConnected', (event) => {
  console.log('✅ Socket connected event received:', event.detail);
});

window.addEventListener('socketDisconnected', (event) => {
  console.log('🔌 Socket disconnected event received:', event.detail);
});

window.addEventListener('socketReconnecting', (event) => {
  console.log('🔄 Socket reconnecting event received:', event.detail);
});

window.addEventListener('socketConnectionError', (event) => {
  console.log('❌ Socket connection error event received:', event.detail);
});

window.addEventListener('socketMaxReconnectAttempts', (event) => {
  console.log('⚠️ Max reconnection attempts reached:', event.detail);
});

console.log('🔌 Socket Connection Test Complete');
console.log('💡 You can now test socket functionality by:');
console.log('   - Checking browser console for connection logs');
console.log('   - Using socketService.forceReconnect() to test reconnection');
console.log('   - Using socketService.ping() to test ping functionality');
