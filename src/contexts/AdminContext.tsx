import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { User as ApiUser } from '@/lib/api';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: "private" | "group";
  title: string;
  participants: string[];
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    timestamp: string;
    type?: string;
  }>;
  createdAt: string;
  isActive: boolean;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

interface AdminState {
  users: ApiUser[];
  roles: Role[];
  conversations: Conversation[];
  messageTemplates: MessageTemplate[];
  loading: { [key: string]: boolean };
  errors: { [key: string]: string | null };
  selectedUser: ApiUser | null;
  activeTab: string;
}

type AdminAction =
  | { type: 'SET_USERS'; payload: ApiUser[] }
  | { type: 'SET_ROLES'; payload: Role[] }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_MESSAGE_TEMPLATES'; payload: MessageTemplate[] }
  | { type: 'SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; value: string | null } }
  | { type: 'SET_SELECTED_USER'; payload: ApiUser | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'UPDATE_USER'; payload: { id: string; updates: Partial<ApiUser> } }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'ADD_ROLE'; payload: Role }
  | { type: 'UPDATE_ROLE'; payload: { id: string; updates: Partial<Role> } }
  | { type: 'DELETE_ROLE'; payload: string };

const initialState: AdminState = {
  users: [],
  roles: [],
  conversations: [],
  messageTemplates: [],
  loading: {},
  errors: {},
  selectedUser: null,
  activeTab: 'overview'
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_ROLES':
      return { ...state, roles: action.payload };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'SET_MESSAGE_TEMPLATES':
      return { ...state, messageTemplates: action.payload };
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { ...state.loading, [action.payload.key]: action.payload.value } 
      };
    case 'SET_ERROR':
      return { 
        ...state, 
        errors: { ...state.errors, [action.payload.key]: action.payload.value } 
      };
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id
            ? { ...user, ...action.payload.updates }
            : user
        )
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload)
      };
    case 'ADD_ROLE':
      return { ...state, roles: [...state.roles, action.payload] };
    case 'UPDATE_ROLE':
      return {
        ...state,
        roles: state.roles.map(role =>
          role.id === action.payload.id
            ? { ...role, ...action.payload.updates }
            : role
        )
      };
    case 'DELETE_ROLE':
      return {
        ...state,
        roles: state.roles.filter(role => role.id !== action.payload)
      };
    default:
      return state;
  }
}

interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);

  return (
    <AdminContext.Provider value={{ state, dispatch }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}