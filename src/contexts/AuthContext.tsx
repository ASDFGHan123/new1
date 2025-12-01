import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthUser, LoginCredentials, SignupCredentials } from "@/types/chat";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  signup: (credentials: SignupCredentials) => Promise<AuthUser>;
  logout: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Sample users for demo
const sampleUsers: AuthUser[] = [
  {
    id: "1",
    username: "alice.johnson",
    email: "alice@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    status: "online"
  },
  {
    id: "2",
    username: "bob.smith",
    email: "bob@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
    status: "online"
  },
  {
    id: "3",
    username: "charlie.brown",
    email: "charlie@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
    status: "away"
  },
  {
    id: "4",
    username: "diana.prince",
    email: "diana@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
    status: "online"
  },
  {
    id: "5",
    username: "eve.wilson",
    email: "eve@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
    status: "offline"
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user by email or username
    const foundUser = sampleUsers.find(
      u => u.email === credentials.identifier || u.username === credentials.identifier
    );
    
    if (!foundUser) {
      setIsLoading(false);
      throw new Error("User not found");
    }
    
    // In a real app, you'd verify the password here
    if (credentials.password.length < 3) {
      setIsLoading(false);
      throw new Error("Invalid credentials");
    }
    
    const authUser: AuthUser = {
      ...foundUser,
      status: "online"
    };
    
    setUser(authUser);
    localStorage.setItem("offchat_user", JSON.stringify(authUser));
    setIsLoading(false);
    
    return authUser;
  };

  const signup = async (credentials: SignupCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = sampleUsers.find(
      u => u.email === credentials.email || u.username === credentials.username
    );
    
    if (existingUser) {
      setIsLoading(false);
      throw new Error("User already exists");
    }
    
    if (credentials.password !== credentials.confirmPassword) {
      setIsLoading(false);
      throw new Error("Passwords do not match");
    }
    
    const authUser: AuthUser = {
      id: `user-${Date.now()}`,
      username: credentials.username,
      email: credentials.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${credentials.username}`,
      status: "online"
    };
    
    setUser(authUser);
    localStorage.setItem("offchat_user", JSON.stringify(authUser));
    setIsLoading(false);
    
    return authUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("offchat_user");
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
    login,
    signup,
    logout,
    updateUser
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