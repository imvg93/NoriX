/**
 * Super Admin utility functions
 * Super Admin email: mework2003@gmail.com
 */

const SUPER_ADMIN_EMAIL = 'mework2003@gmail.com';

/**
 * Check if a user is a super admin
 */
export const isSuperAdmin = (user: { email?: string } | null | undefined): boolean => {
  if (!user || !user.email) {
    return false;
  }
  return user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

/**
 * Check if current path is a student profile page (should be blocked for super admin)
 */
export const isStudentProfilePage = (pathname: string): boolean => {
  // Block student profile pages - these are pages where students manage their own profile
  const blockedPaths = [
    '/student/profile',
    '/student/settings',
    '/student/edit-profile',
  ];
  
  return blockedPaths.some(path => pathname.startsWith(path));
};

/**
 * Check if current path is a student page (allowed for super admin to view UI)
 */
export const isStudentPage = (pathname: string): boolean => {
  const studentPaths = [
    '/student/dashboard',
    '/student/applications',
    '/student/approved-applications',
  ];
  
  return studentPaths.some(path => pathname.startsWith(path));
};








