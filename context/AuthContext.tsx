// context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import * as SecureStore from "expo-secure-store";

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
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadAuthData = async () => {
      const savedToken = await SecureStore.getItemAsync("token");
      const savedUser = await SecureStore.getItemAsync("user");
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    };
    loadAuthData();
  }, []);

  const login = async (token: string, user: User) => {
    setToken(token);
    setUser(user);
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await SecureStore.setItemAsync("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
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
