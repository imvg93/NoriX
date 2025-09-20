import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: string;
  userEmail?: string;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://me-work.vercel.app'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
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
        const token = authSocket.handshake.auth.token || authSocket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user info to socket
        authSocket.userId = (user._id as any).toString();
        authSocket.userType = user.userType;
        authSocket.userEmail = user.email;

        console.log(`🔌 Socket authenticated: ${user.email} (${user.userType})`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      console.log(`🔌 User connected: ${authSocket.userEmail} (${authSocket.userType})`);
      
      // Store connected user
      if (authSocket.userId) {
        this.connectedUsers.set(authSocket.userId, authSocket);
      }

      // Join user-specific room
      if (authSocket.userId) {
        authSocket.join(`user_${authSocket.userId}`);
      }

      // Join role-specific rooms
      if (authSocket.userType) {
        authSocket.join(authSocket.userType);
      }

      // Handle disconnection
      authSocket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${authSocket.userEmail}`);
        if (authSocket.userId) {
          this.connectedUsers.delete(authSocket.userId);
        }
      });

      // Handle joining job-specific room
      authSocket.on('join_job_room', (jobId: string) => {
        authSocket.join(`job_${jobId}`);
        console.log(`🔌 User ${authSocket.userEmail} joined job room: ${jobId}`);
      });

      // Handle leaving job-specific room
      authSocket.on('leave_job_room', (jobId: string) => {
        authSocket.leave(`job_${jobId}`);
        console.log(`🔌 User ${authSocket.userEmail} left job room: ${jobId}`);
      });
    });
  }

  // Emit job approval notification to all students
  public notifyJobApproved(jobData: any) {
    console.log(`📢 Broadcasting job approval: ${jobData.jobTitle} at ${jobData.companyName}`);
    
    this.io.to('student').emit('job_approved', {
      type: 'job_approved',
      job: jobData,
      timestamp: new Date().toISOString(),
      message: `New job approved: ${jobData.jobTitle} at ${jobData.companyName}`
    });
  }

  // Emit job rejection notification to employer
  public notifyJobRejected(jobData: any, employerId: string) {
    console.log(`📢 Notifying job rejection to employer: ${employerId}`);
    
    this.io.to(`user_${employerId}`).emit('job_rejected', {
      type: 'job_rejected',
      job: jobData,
      timestamp: new Date().toISOString(),
      message: `Your job "${jobData.jobTitle}" was rejected`
    });
  }

  // Emit new application notification to employer
  public notifyNewApplication(applicationData: any, employerId: string) {
    console.log(`📢 Notifying new application to employer: ${employerId}`);
    
    this.io.to(`user_${employerId}`).emit('new_application', {
      type: 'new_application',
      application: applicationData,
      timestamp: new Date().toISOString(),
      message: `New application received for "${applicationData.jobTitle}"`
    });

    // Also notify in job-specific room
    this.io.to(`job_${applicationData.jobId}`).emit('new_application', {
      type: 'new_application',
      application: applicationData,
      timestamp: new Date().toISOString(),
      message: `New application received for "${applicationData.jobTitle}"`
    });
  }

  // Emit application status update to student
  public notifyApplicationStatusUpdate(applicationData: any, studentId: string) {
    console.log(`📢 Notifying application status update to student: ${studentId}`);
    
    this.io.to(`user_${studentId}`).emit('application_status_update', {
      type: 'application_status_update',
      application: applicationData,
      timestamp: new Date().toISOString(),
      message: `Your application status updated: ${applicationData.status}`
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users by type
  public getConnectedUsersByType(userType: string): AuthenticatedSocket[] {
    return Array.from(this.connectedUsers.values()).filter(
      socket => socket.userType === userType
    );
  }
}

export default SocketService;
