import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginCredentials, SignupCredentials } from "@/types/chat";
import { apiService } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  signup: (credentials: SignupCredentials) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Note: Using real API authentication now, no longer using mock sample users

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("offchat_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("offchat_user");
      }
    }
    setIsLoading(false);
  }, []);

  const clearError = () => {
    setError(null);
  };

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the real API service
      const response = await apiService.login({
        username: credentials.identifier,
        password: credentials.password
      });
      
      if (response.success && response.data) {
        const authUser: AuthUser = {
          ...response.data.user,
          status: "online"
        };
        
        setUser(authUser);
        localStorage.setItem("offchat_user", JSON.stringify(authUser));
        setIsLoading(false);
        
        return authUser;
      } else {
        const errorMessage = response.error || 'Login failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the real API service
      const response = await apiService.signup({
        username: credentials.username,
        email: credentials.email,
        password: credentials.password
      });
      
      if (response.success && response.data) {
        // For new users, they might need approval or automatic login
        // We'll determine this based on the API response
        const authUser: AuthUser = {
          ...response.data.user,
          status: "online"
        };
        
        setUser(authUser);
        localStorage.setItem("offchat_user", JSON.stringify(authUser));
        setIsLoading(false);
        
        return authUser;
      } else {
        const errorMessage = response.error || 'Signup failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setError(errorMessage);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      setError(null);
      localStorage.removeItem("offchat_user");
    }
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem("offchat_user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};