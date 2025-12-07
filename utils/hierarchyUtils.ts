// utils/hierarchyUtils.ts
import { AdminLevel, User } from '../context/AuthContext';

// Helper function to get user's hierarchy level display name in Arabic
export const getHierarchyLevelName = (adminLevel: AdminLevel): string => {
  const levelNames: Record<AdminLevel, string> = {
    [AdminLevel.GENERAL_SECRETARIAT]: 'الأمانة العامة',
    [AdminLevel.REGION]: 'الولاية',
    [AdminLevel.LOCALITY]: 'المحلية',
    [AdminLevel.ADMIN_UNIT]: 'الوحدة الإدارية',
    [AdminLevel.DISTRICT]: 'الحي',
    [AdminLevel.USER]: 'مستخدم',
    [AdminLevel.ADMIN]: 'مدير النظام'
  };
  
  return levelNames[adminLevel] || 'غير محدد';
};

// Helper function to get user's full hierarchy path
export const getUserHierarchyPath = (user: User): string => {
  const path: string[] = [];
  
  // Add hierarchy information based on available data
  if (user.region) {
    path.push(user.region.name);
  } else if (user.adminLevel === 'REGION') {
    path.push('ولاية');
  }
  
  if (user.locality) {
    path.push(user.locality.name);
  } else if (user.adminLevel === 'LOCALITY') {
    path.push('محلية');
  }
  
  if (user.adminUnit) {
    path.push(user.adminUnit.name);
  } else if (user.adminLevel === 'ADMIN_UNIT') {
    path.push('وحدة إدارية');
  }
  
  if (user.district) {
    path.push(user.district.name);
  } else if (user.adminLevel === 'DISTRICT') {
    path.push('حي');
  }
  
  if (path.length === 0) {
    // If we have adminLevel but no hierarchy info, at least show the level
    return getHierarchyLevelName(user.adminLevel);
  }
  
  return path.join(' - ');
};

// Helper function to check if user has access to content at a specific hierarchy level
export const hasHierarchyAccess = (
  user: User,
  targetRegionId?: string,
  targetLocalityId?: string,
  targetAdminUnitId?: string,
  targetDistrictId?: string
): boolean => {
  // General Secretariat has access to everything
  if (user.adminLevel === AdminLevel.GENERAL_SECRETARIAT) {
    return true;
  }
  
  // If no target is specified, user has access
  if (!targetRegionId) {
    return true;
  }
  
  // Check region level access
  if (user.adminLevel === AdminLevel.REGION) {
    return user.regionId === targetRegionId;
  }
  
  // Check locality level access
  if (user.adminLevel === AdminLevel.LOCALITY) {
    if (user.regionId !== targetRegionId) {
      return false;
    }
    if (targetLocalityId) {
      return user.localityId === targetLocalityId;
    }
    return true;
  }
  
  // Check admin unit level access
  if (user.adminLevel === AdminLevel.ADMIN_UNIT) {
    if (user.regionId !== targetRegionId) {
      return false;
    }
    if (targetLocalityId && user.localityId !== targetLocalityId) {
      return false;
    }
    if (targetAdminUnitId) {
      return user.adminUnitId === targetAdminUnitId;
    }
    return true;
  }
  
  // Check district level access
  if (user.adminLevel === AdminLevel.DISTRICT) {
    if (user.regionId !== targetRegionId) {
      return false;
    }
    if (targetLocalityId && user.localityId !== targetLocalityId) {
      return false;
    }
    if (targetAdminUnitId && user.adminUnitId !== targetAdminUnitId) {
      return false;
    }
    if (targetDistrictId) {
      return user.districtId === targetDistrictId;
    }
    return true;
  }
  
  // Regular users have no hierarchy access
  return false;
};

// Helper function to get the user's scope description
export const getUserScopeDescription = (user: User): string => {
  const levelName = getHierarchyLevelName(user.adminLevel);
  const hierarchyPath = getUserHierarchyPath(user);
  
  if (user.adminLevel === AdminLevel.GENERAL_SECRETARIAT) {
    return `${levelName} - الوصول لجميع المستويات`;
  }
  
  if (hierarchyPath) {
    return `${levelName} - ${hierarchyPath}`;
  }
  
  return levelName;
};
