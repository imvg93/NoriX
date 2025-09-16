import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
}

class SocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    const allowAll = process.env.ALLOW_ALL_CORS === 'true' || process.env.ALLOW_ALL_CORS === '1';
    this.io = new SocketIOServer(server, {
      cors: allowAll ? {
        origin: (origin, callback) => callback(null, true),
        methods: ["GET", "POST"],
        credentials: true
      } : {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const authSocket = socket as AuthenticatedSocket;
        const token = authSocket.handshake.auth.token || authSocket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        authSocket.userId = (user._id as any).toString();
        authSocket.userType = user.userType;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      console.log(`🔌 Socket connected: ${authSocket.userId} (${authSocket.userType})`);
      
      // Store user connection
      if (authSocket.userId) {
        this.connectedUsers.set(authSocket.userId, authSocket.id);
      }

      // Join user to their personal room
      if (authSocket.userId) {
        authSocket.join(`user:${authSocket.userId}`);
      }

      // Join admin to admin room
      if (authSocket.userType === 'admin') {
        authSocket.join('admin');
      }

      // Handle disconnect
      authSocket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${authSocket.userId}`);
        if (authSocket.userId) {
          this.connectedUsers.delete(authSocket.userId);
        }
      });

      // Handle KYC status requests
      authSocket.on('kyc:status:request', () => {
        if (authSocket.userId) {
          authSocket.emit('kyc:status:response', {
            userId: authSocket.userId,
            timestamp: new Date()
          });
        }
      });
    });
  }

  // Emit KYC status update to specific user
  public emitKYCStatusUpdate(userId: string, statusData: any) {
    console.log(`📡 Emitting KYC status update to user: ${userId}`);
    
    // Emit to user's personal room
    this.io.to(`user:${userId}`).emit('kyc:status:update', {
      ...statusData,
      timestamp: new Date()
    });

    // Also emit to admin room for real-time admin dashboard updates
    this.io.to('admin').emit('kyc:admin:update', {
      userId,
      ...statusData,
      timestamp: new Date()
    });
  }

  // Emit to all admins
  public emitToAdmins(event: string, data: any) {
    console.log(`📡 Emitting to admins: ${event}`);
    this.io.to('admin').emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Emit to specific user
  public emitToUser(userId: string, event: string, data: any) {
    console.log(`📡 Emitting to user ${userId}: ${event}`);
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get socket instance
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketManager;
