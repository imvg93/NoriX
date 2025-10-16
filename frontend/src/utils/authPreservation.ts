// Utility to preserve authentication during page reloads
export class AuthPreservation {
  private static readonly AUTH_KEY = 'noriX_auth_backup';
  private static readonly BACKUP_INTERVAL = 30000; // 30 seconds
  private static backupTimer: NodeJS.Timeout | null = null;

  // Backup authentication data periodically
  static startAuthBackup() {
    if (typeof window === 'undefined') return;

    // Clear existing timer
    this.clearBackupTimer();

    // Backup immediately
    this.backupAuth();

    // Set up periodic backup
    this.backupTimer = setInterval(() => {
      this.backupAuth();
    }, this.BACKUP_INTERVAL);

    console.log('🔐 Authentication backup started');
  }

  // Stop authentication backup
  static stopAuthBackup() {
    this.clearBackupTimer();
    console.log('🔐 Authentication backup stopped');
  }

  // Backup current authentication state
  private static backupAuth() {
    if (typeof window === 'undefined') return;

    try {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        const authData = {
          user: JSON.parse(user),
          token: token,
          timestamp: Date.now()
        };
        
        localStorage.setItem(this.AUTH_KEY, JSON.stringify(authData));
        console.log('🔐 Authentication backed up');
      }
    } catch (error) {
      console.error('🔐 Error backing up authentication:', error);
    }
  }

  // Restore authentication from backup
  static restoreAuth(): { user: any; token: string } | null {
    if (typeof window === 'undefined') return null;

    try {
      const backup = localStorage.getItem(this.AUTH_KEY);
      if (!backup) return null;

      const authData = JSON.parse(backup);
      
      // Check if backup is recent (within 1 hour)
      const isRecent = Date.now() - authData.timestamp < 3600000; // 1 hour
      
      if (isRecent) {
        console.log('🔐 Restoring authentication from backup');
        return {
          user: authData.user,
          token: authData.token
        };
      } else {
        // Remove old backup
        localStorage.removeItem(this.AUTH_KEY);
        console.log('🔐 Old authentication backup removed');
      }
    } catch (error) {
      console.error('🔐 Error restoring authentication:', error);
      localStorage.removeItem(this.AUTH_KEY);
    }

    return null;
  }

  // Clear authentication backup
  static clearBackup() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.AUTH_KEY);
    console.log('🔐 Authentication backup cleared');
  }

  // Clear backup timer
  private static clearBackupTimer() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  // Enhanced reload that preserves authentication
  static reloadWithAuthPreservation() {
    console.log('🔄 Reloading with authentication preservation...');
    
    // Check if user is actually logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      console.log('⚠️ No authentication found, skipping reload to prevent logout');
      return;
    }
    
    // Backup auth before reload
    this.backupAuth();
    
    // Reload page gently
    window.location.reload();
  }
}
