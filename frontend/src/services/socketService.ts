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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('🔌 Server-side rendering, skipping socket connection');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        console.log('🔌 No token found, skipping socket connection');
        return;
      }


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
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });


      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Server connection confirmed:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      
      // Handle specific error types
      if (error.message?.includes('Authentication')) {
        console.log('🔐 Authentication failed, clearing token');
        localStorage.removeItem('token');
        this.disconnect();
      } else {
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

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
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
    }
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
    this.connect();
  }

  // Clean up all listeners
  public removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;


