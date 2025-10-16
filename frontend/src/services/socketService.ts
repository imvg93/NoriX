import { io, Socket } from 'socket.io-client';

export interface SocketNotification {
  type: string;
  timestamp: string;
  message: string;
}

export interface JobApprovedNotification extends SocketNotification {
  type: 'job_approved';
  job: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobType: string;
    salary?: string;
    description?: string;
    requirements?: string;
    createdAt: string;
  };
}

export interface JobRejectedNotification extends SocketNotification {
  type: 'job_rejected';
  job: {
    id: string;
    jobTitle: string;
    companyName: string;
    location: string;
    jobType: string;
    rejectionReason?: string;
  };
}

export interface NewApplicationNotification extends SocketNotification {
  type: 'new_application';
  application: {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone?: string;
    coverLetter?: string;
    expectedPay?: number;
    status: string;
    appliedAt: string;
  };
}

export interface ApplicationStatusUpdateNotification extends SocketNotification {
  type: 'application_status_update';
  application: {
    id: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
    studentId: string;
    status: string;
    notes?: string;
    updatedAt: string;
  };
}

export type NotificationData = 
  | JobApprovedNotification 
  | JobRejectedNotification 
  | NewApplicationNotification 
  | ApplicationStatusUpdateNotification;

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 5 to 10
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    // Defer initialization to avoid SSR issues
    this.initialize();
  }

  private initialize() {
    // Only initialize on the client side after hydration
    if (typeof window === 'undefined') {
      return;
    }

    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        this.performInitialization();
      });
    } else {
      // Fallback for environments without requestAnimationFrame
      setTimeout(() => {
        this.performInitialization();
      }, 0);
    }
  }

  private performInitialization() {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        this.connect(token);
        this.startConnectionHealthCheck();
      }
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
    }
  }

  private connect(token?: string) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('🔌 Server-side rendering, skipping socket connection');
        return;
      }

      // Prevent multiple simultaneous connection attempts
      if (this.isConnecting) {
        console.log('🔌 Connection already in progress, skipping...');
        return;
      }

      const providedToken = token ?? localStorage.getItem('token');
      if (!providedToken) {
        console.log('🔌 No token found, skipping socket connection');
        return;
      }

      // Disconnect existing socket if any
      if (this.socket) {
        console.log('🔌 Disconnecting existing socket...');
        this.socket.disconnect();
        this.socket = null;
      }

      // Clear any existing timers
      this.clearTimers();

      this.isConnecting = true;
      console.log('🔌 Connecting to Socket.IO server...');
      
      // Get the correct server URL (remove /api from the API URL)
      let serverUrl: string;
      
      if (process.env.NEXT_PUBLIC_API_URL) {
        serverUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
      } else if (window.location.hostname.includes('vercel.app')) {
        // For Vercel deployment, use Railway backend
        serverUrl = 'https://studentjobs-backend-production.up.railway.app';
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        serverUrl = 'http://localhost:5000';
      } else {
        serverUrl = 'http://localhost:5000';
      }
      
      console.log('🔌 Socket connecting to:', serverUrl);
      
      this.socket = io(serverUrl, {
        auth: {
          token: providedToken
        },
        transports: ['websocket', 'polling'],
        timeout: 30000, // Increased timeout
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 10, // Increased attempts
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000, // Increased max delay
        randomizationFactor: 0.5, // Add randomization to prevent thundering herd
        upgrade: true,
        rememberUpgrade: true
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Start ping interval to keep connection alive
      this.startPingInterval();
      
      // Dispatch connection event
      window.dispatchEvent(new CustomEvent('socketConnected', {
        detail: { socketId: this.socket?.id }
      }));
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Server connection confirmed:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Stop ping interval
      this.stopPingInterval();
      
      // Dispatch disconnection event
      window.dispatchEvent(new CustomEvent('socketDisconnected', {
        detail: { reason }
      }));
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      } else if (reason === 'io client disconnect') {
        // Client disconnected, don't auto-reconnect
        console.log('🔌 Client disconnected, not attempting reconnection');
      } else {
        // Network issues or other reasons, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Handle specific error types
      if (error.message?.includes('Authentication')) {
        console.log('🔐 Authentication failed, clearing token');
        localStorage.removeItem('token');
        this.disconnect();
      } else {
        // Dispatch connection error event
        window.dispatchEvent(new CustomEvent('socketConnectionError', {
          detail: { error: error.message }
        }));
        this.handleReconnect();
      }
    });

    // Handle authentication errors
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      if (error.message?.includes('Authentication')) {
        console.log('🔐 Authentication failed, clearing token');
        localStorage.removeItem('token');
        this.disconnect();
      }
    });

    // Handle pong responses
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Handle reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
      this.isConnected = false;
    });

    // Job approval events
    this.socket.on('job:approved', (data) => {
      console.log('📡 Received job approval notification:', data);
      window.dispatchEvent(new CustomEvent('jobApproved', {
        detail: data
      }));
    });

    // New application events
    this.socket.on('application:new', (data) => {
      console.log('📡 Received new application notification:', data);
      window.dispatchEvent(new CustomEvent('newApplication', {
        detail: data
      }));
    });

    // Application status update events
    this.socket.on('application_status_update', (data) => {
      console.log('📡 Received application status update:', data);
      window.dispatchEvent(new CustomEvent('application_status_update', {
        detail: data
      }));
    });

    // KYC status update events
    this.socket.on('kyc:status:update', (data) => {
      console.log('📡 Received KYC status update:', data);
      window.dispatchEvent(new CustomEvent('kyc:status:update', {
        detail: data
      }));
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      
      // Dispatch max attempts reached event
      window.dispatchEvent(new CustomEvent('socketMaxReconnectAttempts', {
        detail: { attempts: this.reconnectAttempts }
      }));
      
      // Reset attempts after a longer delay to allow for recovery
      setTimeout(() => {
        this.reconnectAttempts = 0;
        console.log('🔄 Reset reconnection attempts, ready to try again');
      }, 30000); // 30 seconds
      return;
    }

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      10000 // Max delay of 10 seconds
    );
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    // Dispatch reconnection attempt event
    window.dispatchEvent(new CustomEvent('socketReconnecting', {
      detail: { attempt: this.reconnectAttempts, delay }
    }));
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Public methods for event handling
  public onJobApproved(callback: (data: JobApprovedNotification) => void) {
    if (this.socket) {
      this.socket.on('job_approved', callback);
    }
  }

  public onJobRejected(callback: (data: JobRejectedNotification) => void) {
    if (this.socket) {
      this.socket.on('job_rejected', callback);
    }
  }

  public onNewApplication(callback: (data: NewApplicationNotification) => void) {
    if (this.socket) {
      this.socket.on('new_application', callback);
    }
  }

  public onApplicationStatusUpdate(callback: (data: ApplicationStatusUpdateNotification) => void) {
    if (this.socket) {
      this.socket.on('application_status_update', callback);
    }
  }

  // Join job-specific room
  public joinJobRoom(jobId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_job_room', jobId);
      console.log(`🔌 Joined job room: ${jobId}`);
    }
  }

  // Leave job-specific room
  public leaveJobRoom(jobId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_job_room', jobId);
      console.log(`🔌 Left job room: ${jobId}`);
    }
  }

  // Generic event listener
  public on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  public off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event
  public emit(event: string, data?: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Check connection status
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Ping server to check connection health
  public ping() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
      console.log('🏓 Ping sent to server');
    }
  }

  // Get connection status with details
  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Disconnect
  public disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
    }
    
    // Clear all timers
    this.clearTimers();
    this.stopConnectionHealthCheck();
  }

  // Reconnect with new token
  public reconnectWithToken(token: string) {
    if (typeof window === 'undefined') {
      console.log('🔌 Server-side rendering, skipping socket reconnection');
      return;
    }

    localStorage.setItem('token', token);
    this.disconnect();
    this.reconnectAttempts = 0;
    
    // Start health check again
    this.startConnectionHealthCheck();
    this.connect(token);
  }

  // Allow consumers to initiate a connection with a token
  public ensureConnected(token?: string) {
    if (this.isConnected && this.socket?.connected) return;
    const effectiveToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : undefined);
    this.connect(effectiveToken ?? undefined);
  }

  // Clean up all listeners
  public removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Helper methods for connection management
  private startPingInterval() {
    this.stopPingInterval(); // Clear any existing interval
    
    this.pingInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startConnectionHealthCheck() {
    this.stopConnectionHealthCheck(); // Clear any existing interval
    
    this.connectionCheckInterval = setInterval(() => {
      if (typeof window !== 'undefined' && !this.isConnected && !this.isConnecting) {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('🔍 Health check: Attempting to reconnect...');
          this.connect(token);
        }
      }
    }, 60000); // Check every minute
  }

  private stopConnectionHealthCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPingInterval();
  }

  // Force reconnection (public method)
  public forceReconnect() {
    console.log('🔄 Force reconnecting socket...');
    this.reconnectAttempts = 0;
    this.clearTimers();
    this.disconnect();
    
    const token = localStorage.getItem('token');
    if (token) {
      setTimeout(() => {
        this.connect(token);
      }, 1000);
    }
  }

  // Manual connection check
  public checkConnection() {
    const status = this.getConnectionStatus();
    console.log('🔍 Socket connection status:', status);
    return status;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Make socket service available globally for debugging (development only)
// Use a more SSR-safe approach
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Use Object.defineProperty to avoid potential hydration issues
  Object.defineProperty(window, 'socketService', {
    value: socketService,
    writable: false,
    configurable: true
  });
  console.log('🔌 Socket service available globally as window.socketService');
}

export default socketService;


