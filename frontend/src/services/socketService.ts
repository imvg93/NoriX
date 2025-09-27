import { io, Socket } from 'socket.io-client';
import { kycStatusService } from './kycStatusService';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Connect to Socket.IO server
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    console.log('🔌 Connecting to Socket.IO server...');

    const socketUrl = (process.env.NEXT_PUBLIC_SOCKET_URL
      || (process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/?api\/?$/, '')
        : 'http://localhost:5000')) as string;

    console.log('🔌 Socket connecting to:', socketUrl);

    this.socket = io(socketUrl, {
      path: '/socket.io',
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.isConnected = false;
      
      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        setTimeout(() => {
          this.socket?.connect();
        }, 2000 * this.reconnectAttempts);
      }
    });

    // KYC status update events
    this.socket.on('kyc:status:update', (data) => {
      console.log('📡 Received KYC status update:', data);
      
      // Update the cache with new status
      const newStatus = {
        isCompleted: data.status === 'approved',
        status: data.status,
        message: data.message,
        canResubmit: data.canResubmit || false,
        rejectionReason: data.reason
      };
      
      kycStatusService.updateCache(newStatus);
      
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('kycStatusUpdate', {
        detail: { status: newStatus, data }
      }));
      
      // Show notification if available
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('KYC Status Update', {
            body: data.message,
            icon: '/favicon.ico'
          });
        }
      }
    });

    // Admin update events (for admin dashboard)
    this.socket.on('kyc:admin:update', (data) => {
      console.log('📡 Received admin KYC update:', data);
      
      // Emit custom event for admin components
      window.dispatchEvent(new CustomEvent('kycAdminUpdate', {
        detail: data
      }));
    });

    // Status response events
    this.socket.on('kyc:status:response', (data) => {
      console.log('📡 Received KYC status response:', data);
    });

    // Job approval events
    this.socket.on('job:approved', (data) => {
      console.log('📡 Received job approval notification:', data);
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('jobApproved', {
        detail: data
      }));
    });

    // New application events
    this.socket.on('application:new', (data) => {
      console.log('📡 Received new application notification:', data);
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('newApplication', {
        detail: data
      }));
    });
  }

  // Request KYC status update
  requestKYCStatus(): void {
    if (this.socket?.connected) {
      this.socket.emit('kyc:status:request');
    }
  }

  // Disconnect from Socket.IO server
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO server...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
