import { User } from '@supabase/supabase-js';

/**
 * Check if a user has admin role
 * @param user - The user object from Supabase session
 * @returns boolean - true if user has admin role
 */
export function isUserAdmin(user: User | null): boolean {
  if (!user) return false;
  
  // Check if user has admin role in user_metadata
  const userRole = user.user_metadata?.role;
  return userRole === 'admin';
}

/**
 * Check if a user has a specific role
 * @param user - The user object from Supabase session
 * @param role - The role to check for
 * @returns boolean - true if user has the specified role
 */
export function hasUserRole(user: User | null, role: string): boolean {
  if (!user) return false;
  
  const userRole = user.user_metadata?.role;
  return userRole === role;
}
