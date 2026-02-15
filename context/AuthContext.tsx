// context/AuthContext.tsx
import { createContext, useState, useEffect, useRef, ReactNode, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import socketService from "../services/socketService";

// Hierarchical level enum - matches backend schema.prisma AdminLevel
export enum AdminLevel {
  GENERAL_SECRETARIAT = 'GENERAL_SECRETARIAT',
  REGION = 'REGION',
  LOCALITY = 'LOCALITY',
  ADMIN_UNIT = 'ADMIN_UNIT',
  DISTRICT = 'DISTRICT',
  USER = 'USER',
  ADMIN = 'ADMIN',
  NATIONAL_LEVEL = 'NATIONAL_LEVEL',
  EXPATRIATE_GENERAL = 'EXPATRIATE_GENERAL',
  EXPATRIATE_REGION = 'EXPATRIATE_REGION'
}

// Active hierarchy enum
export enum ActiveHierarchy {
  ORIGINAL = 'ORIGINAL',
  EXPATRIATE = 'EXPATRIATE',
  SECTOR = 'SECTOR'
}

// User interface with hierarchical information
export interface User {
  id: string;
  email?: string;
  mobileNumber: string;
  role: string;
  adminLevel: AdminLevel;
  activeHierarchy?: ActiveHierarchy;
  
  // Original hierarchy
  nationalLevelId?: string;
  regionId?: string;
  localityId?: string;
  adminUnitId?: string;
  districtId?: string;
  
  // Sector hierarchy
  expatriateRegionId?: string;
  sectorNationalLevelId?: string;
  sectorRegionId?: string;
  sectorLocalityId?: string;
  sectorAdminUnitId?: string;
  sectorDistrictId?: string;
  
  // Hierarchy objects
  nationalLevel?: {
    id: string;
    name: string;
    code?: string;
  };
  region?: {
    id: string;
    name: string;
    code?: string;
  };
  locality?: {
    id: string;
    name: string;
    code?: string;
  };
  adminUnit?: {
    id: string;
    name: string;
    code?: string;
  };
  district?: {
    id: string;
    name: string;
    code?: string;
  };
  expatriateRegion?: {
    id: string;
    name: string;
    code?: string;
  };
  sectorNationalLevel?: {
    id: string;
    name: string;
    code?: string;
  };
  sectorRegion?: {
    id: string;
    name: string;
    code?: string;
  };
  sectorLocality?: {
    id: string;
    name: string;
    code?: string;
  };
  sectorAdminUnit?: {
    id: string;
    name: string;
    code?: string;
  };
  sectorDistrict?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  /** Monotonically-increasing counter that bumps every time the active hierarchy
   *  changes. Screens that display hierarchy-dependent data should include this
   *  value in their `useEffect` dependency arrays so they automatically refetch. */
  hierarchyVersion: number;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  /** Persist a new access token (e.g. after hierarchy switch re-issues a JWT) */
  updateToken: (newToken: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [hierarchyVersion, setHierarchyVersion] = useState(0);

  useEffect(() => {
    const loadAuthData = async () => {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("user");
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Re-establish socket for real-time notifications + force-logout
        connectSocket();
      }
    };
    loadAuthData();

    // Cleanup on unmount
    return () => {
      forceLogoutUnsub.current?.();
    };
  }, []);

  // Track force-logout unsubscriber so we can clean up on unmount / logout
  const forceLogoutUnsub = useRef<(() => void) | null>(null);

  const connectSocket = async () => {
    try {
      await socketService.connect();
      // Listen for force-logout (admin suspended this user)
      forceLogoutUnsub.current = socketService.onForceLogout((data) => {
        Alert.alert('تم تعليق حسابك', data.reason || 'تواصل مع المسؤول.');
        logout();
      });
    } catch (err) {
      console.warn('Socket connect error (non-fatal):', err);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await SecureStore.setItemAsync("token", newToken);
    await SecureStore.setItemAsync("user", JSON.stringify(newUser));
    // Connect socket immediately on login for real-time notifications + force-logout
    connectSocket();
  };

  const logout = async () => {
    // Clean up socket
    forceLogoutUnsub.current?.();
    forceLogoutUnsub.current = null;
    socketService.disconnect();
    // Clear auth state
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  };

  const updateUser = async (updatedUser: User) => {
    // Detect hierarchy change and bump version so screens refetch
    if (updatedUser.activeHierarchy !== user?.activeHierarchy) {
      setHierarchyVersion((v) => v + 1);
    }
    setUser(updatedUser);
    await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
  };

  const updateToken = async (newToken: string) => {
    setToken(newToken);
    await SecureStore.setItemAsync("token", newToken);
  };

  return (
    <AuthContext.Provider value={{ token, user, hierarchyVersion, login, logout, updateUser, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
