import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, PermissionKey, DEFAULT_ROLE_PERMISSIONS } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  autoLogoutMinutes: number;
  inactivityNotice: string | null;
  setAutoLogoutMinutes: (mins: number) => void;
  clearInactivityNotice: () => void;
  hasPermission: (permission: PermissionKey) => boolean;
  getUserPermissions: (u?: User | null) => PermissionKey[];
  loginWithEmail: (email: string, password?: string) => Promise<User>;
  loginWithGoogle: (email?: string, name?: string) => Promise<User>;
  logout: (reason?: string) => void;
  updateUserRole: (newRole: UserRole) => void;
  updateUserPermissions: (permissions: PermissionKey[]) => void;
  updateProfile: (profile: Partial<User>) => Promise<User>;
  changePassword: (params: { currentPassword?: string; newPassword: string; targetStaffId?: string }) => Promise<{ success: boolean; message: string }>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session storage check - if user previously logged in, restore, else prompt login
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('warwick_auth_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);

  // Automatic logout system is completely STOPPED and permanently disabled per user request
  // Sessions remain permanently active and staff are never automatically logged out
  const [autoLogoutMinutes] = useState<number>(0);

  const setAutoLogoutMinutes = (_mins: number) => {
    // Keep auto-logout permanently stopped (0 = disabled)
    try {
      localStorage.removeItem('warwick_auto_logout_mins');
    } catch {}
  };

  const clearInactivityNotice = () => setInactivityNotice(null);

  // Clean any legacy auto-logout timeout flags on startup
  useEffect(() => {
    try {
      localStorage.removeItem('warwick_auto_logout_mins');
    } catch {}
  }, []);

  // Track user activity timestamp and maintain session
  useEffect(() => {
    // Non-destructive session verification on startup across page reloads
    const verifyInitialSession = async () => {
      const saved = localStorage.getItem('warwick_auth_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || parsed.id || parsed.userId || parsed.staffId)) {
            // Ensure token is attached so auth headers and requests remain valid
            const token = parsed.token || `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            if (!parsed.token) {
              parsed.token = token;
              localStorage.setItem('warwick_auth_user', JSON.stringify(parsed));
            }

            // Sync user state immediately so the app never flickers to login screen
            setUser(prev => prev || parsed);

            // Silently refresh profile/permissions from server in the background
            try {
              const identifier = parsed.email || parsed.staffId || parsed.userId || parsed.id;
              const serverUser = await api.validateSession(token, identifier);
              if (serverUser) {
                const refreshed = { ...parsed, ...serverUser, token };
                setUser(refreshed);
                localStorage.setItem('warwick_auth_user', JSON.stringify(refreshed));
              }
            } catch (netErr) {
              console.warn('[Auth] Background session refresh skipped (offline or server starting up). Session preserved.');
            }
          }
        } catch (err) {
          console.warn('[Auth] Could not parse stored user session:', err);
        }
      }
    };
    verifyInitialSession();
  }, []);

  // Automatic logout system is permanently stopped: No intervals, no timeouts, no auto-logout
  useEffect(() => {
    // Auto-logout system intentionally inactive to keep all sessions permanently alive
    return () => {};
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('warwick_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('warwick_auth_user');
    }
  }, [user]);

  const clearError = () => setError(null);

  const getUserPermissions = (targetUser?: User | null): PermissionKey[] => {
    const u = targetUser || user;
    if (!u) return [];
    if (u.permissions && u.permissions.length > 0) {
      return u.permissions;
    }
    // Check if role baseline permissions are customized in settings
    try {
      const rawSettings = localStorage.getItem('warwick_offline_cached_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed?.rolePermissions?.[u.role]) {
          return parsed.rolePermissions[u.role];
        }
      }
    } catch {}
    if (u.role === 'Super Admin') {
      return DEFAULT_ROLE_PERMISSIONS['Super Admin'];
    }
    return DEFAULT_ROLE_PERMISSIONS[u.role] || [];
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    // Super Admin has master access to all features unless specifically restricted
    if (user.role === 'Super Admin') return true;

    // Check specific user permissions if defined
    let activePerms: PermissionKey[] = [];
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      activePerms = user.permissions;
    } else {
      try {
        const rawSettings = localStorage.getItem('warwick_offline_cached_settings');
        if (rawSettings) {
          const parsed = JSON.parse(rawSettings);
          if (parsed?.rolePermissions?.[user.role]) {
            activePerms = parsed.rolePermissions[user.role];
          }
        }
      } catch {}
      if (!activePerms || activePerms.length === 0) {
        activePerms = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
      }
    }

    if (activePerms.includes(permission)) return true;

    // Backward compatibility mappings for certificate permissions
    if (permission === 'certificates_view' && activePerms.includes('certificates')) return true;
    if (permission === 'certificates_create' && activePerms.includes('certificates')) return true;
    if (permission === 'certificates_edit' && activePerms.includes('certificates')) return true;
    if (permission === 'certificates_print' && (activePerms.includes('certificates') || activePerms.includes('print'))) return true;
    if (permission === 'certificates_save' && activePerms.includes('certificates')) return true;

    return false;
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    setInactivityNotice(null);
    try {
      const res = await api.login(email, password);
      // Ensure permissions and token are attached
      const perms = res.user.permissions || DEFAULT_ROLE_PERMISSIONS[res.user.role];
      const token = res.token || res.user.token || `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const loggedUser = { ...res.user, permissions: perms, token };
      setUser(loggedUser);
      localStorage.setItem('warwick_auth_user', JSON.stringify(loggedUser));
      return loggedUser;
    } catch (err: any) {
      console.error('Email login error:', err);
      setError(err.message || 'Login failed. Please verify your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    setInactivityNotice(null);
    try {
      const email = customEmail || 'mdriday256@gmail.com';
      const name = customName || (email.includes('riday') ? 'MD ABU SAYEED RIDAY' : 'Authorized Hotel Staff');
      const res = await api.loginWithGoogle({
        email,
        name,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
      });
      const perms = res.user.permissions || DEFAULT_ROLE_PERMISSIONS[res.user.role];
      const token = res.token || res.user.token || `google-jwt-${Date.now()}`;
      const loggedUser = { ...res.user, permissions: perms, token };
      setUser(loggedUser);
      localStorage.setItem('warwick_auth_user', JSON.stringify(loggedUser));
      return loggedUser;
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'Google Sign-In failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (reason?: string) => {
    api.logout().catch(() => {});
    setUser(null);
    setError(null);
    localStorage.removeItem('warwick_auth_user');
    if (typeof reason === 'string' && reason.trim().length > 0) {
      setInactivityNotice(reason);
    } else {
      setInactivityNotice(null);
    }
  };

  const updateUserRole = (newRole: UserRole) => {
    if (!user) return;
    const newPerms = DEFAULT_ROLE_PERMISSIONS[newRole];
    const updated = { ...user, role: newRole, permissions: newPerms };
    setUser(updated);
  };

  const updateUserPermissions = (permissions: PermissionKey[]) => {
    if (!user) return;
    const updated = { ...user, permissions };
    setUser(updated);
  };

  const updateProfile = async (profileData: Partial<User>): Promise<User> => {
    const updatedUser = await api.updateUserProfile(profileData, user);
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (params: { currentPassword?: string; newPassword: string; targetStaffId?: string }) => {
    return await api.changePassword(params, user);
  };

  const isAdmin = Boolean(user && (user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'Manager'));
  const isSuperAdmin = Boolean(user && user.role === 'Super Admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isLoading,
        error,
        autoLogoutMinutes,
        inactivityNotice,
        setAutoLogoutMinutes,
        clearInactivityNotice,
        hasPermission,
        getUserPermissions,
        loginWithEmail,
        loginWithGoogle,
        logout,
        updateUserRole,
        updateUserPermissions,
        updateProfile,
        changePassword,
        setUser,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
