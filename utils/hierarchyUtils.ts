// utils/hierarchyUtils.ts
import { AdminLevel, User, ActiveHierarchy } from '../context/AuthContext';

// Helper function to get user's hierarchy level display name in Arabic
export const getHierarchyLevelName = (adminLevel: AdminLevel): string => {
  const levelNames: Record<AdminLevel, string> = {
    [AdminLevel.GENERAL_SECRETARIAT]: 'الأمانة العامة',
    [AdminLevel.REGION]: 'الولاية',
    [AdminLevel.LOCALITY]: 'المحلية',
    [AdminLevel.ADMIN_UNIT]: 'الوحدة الإدارية',
    [AdminLevel.DISTRICT]: 'الحي',
    [AdminLevel.USER]: 'مستخدم',
    [AdminLevel.ADMIN]: 'مدير النظام',
    [AdminLevel.NATIONAL_LEVEL]: 'المستوى القومي',
    [AdminLevel.EXPATRIATE_GENERAL]: 'المغتربين - عام',
    [AdminLevel.EXPATRIATE_REGION]: 'المغتربين - الإقليم'
  };
  
  return levelNames[adminLevel] || 'غير محدد';
};

// Helper function to get user's full hierarchy path based on active hierarchy
export const getUserHierarchyPath = (user: User): string => {
  const activeHierarchy = user.activeHierarchy || ActiveHierarchy.ORIGINAL;
  const path: string[] = [];
  
  if (activeHierarchy === ActiveHierarchy.EXPATRIATE) {
    // Expatriate hierarchy path
    if (user.expatriateRegion) {
      return `المغتربين - ${user.expatriateRegion.name}`;
    }
    return 'المغتربين';
  }
  
  if (activeHierarchy === ActiveHierarchy.SECTOR) {
    // Sector hierarchy path
    if (user.sectorNationalLevel) {
      path.push(user.sectorNationalLevel.name);
    }
    if (user.sectorRegion) {
      path.push(user.sectorRegion.name);
    }
    if (user.sectorLocality) {
      path.push(user.sectorLocality.name);
    }
    if (user.sectorAdminUnit) {
      path.push(user.sectorAdminUnit.name);
    }
    if (user.sectorDistrict) {
      path.push(user.sectorDistrict.name);
    }
    
    if (path.length === 0) {
      return 'القطاع';
    }
    return `القطاع - ${path.join(' - ')}`;
  }
  
  // Original (Geographic) hierarchy path
  if (user.nationalLevel) {
    path.push(user.nationalLevel.name);
  }
  if (user.region) {
    path.push(user.region.name);
  } else if (user.adminLevel === AdminLevel.REGION) {
    path.push('ولاية');
  }
  
  if (user.locality) {
    path.push(user.locality.name);
  } else if (user.adminLevel === AdminLevel.LOCALITY) {
    path.push('محلية');
  }
  
  if (user.adminUnit) {
    path.push(user.adminUnit.name);
  } else if (user.adminLevel === AdminLevel.ADMIN_UNIT) {
    path.push('وحدة إدارية');
  }
  
  if (user.district) {
    path.push(user.district.name);
  } else if (user.adminLevel === AdminLevel.DISTRICT) {
    path.push('حي');
  }
  
  if (path.length === 0) {
    // If we have adminLevel but no hierarchy info, at least show the level
    return getHierarchyLevelName(user.adminLevel);
  }
  
  return path.join(' - ');
};

/**
 * Content targeting interface - represents what a content item is targeted at
 */
interface ContentTargeting {
  // Original hierarchy
  targetNationalLevelId?: string;
  targetRegionId?: string;
  targetLocalityId?: string;
  targetAdminUnitId?: string;
  targetDistrictId?: string;
  // Expatriate hierarchy
  targetExpatriateRegionId?: string;
  // Sector hierarchy
  targetSectorNationalLevelId?: string;
  targetSectorRegionId?: string;
  targetSectorLocalityId?: string;
  targetSectorAdminUnitId?: string;
  targetSectorDistrictId?: string;
}

/**
 * Check if user has access to content based on their active hierarchy and the content's targeting
 * This implements CASCADING logic where users see content targeted at their level AND all parent levels
 */
export const hasHierarchyAccess = (
  user: User,
  contentTargeting: ContentTargeting
): boolean => {
  // General Secretariat and Admin have access to everything
  if (user.adminLevel === AdminLevel.GENERAL_SECRETARIAT || user.adminLevel === AdminLevel.ADMIN) {
    return true;
  }
  
  const activeHierarchy = user.activeHierarchy || ActiveHierarchy.ORIGINAL;
  
  // Check if content is global (no targeting at all)
  const isGlobalContent = 
    !contentTargeting.targetNationalLevelId &&
    !contentTargeting.targetRegionId &&
    !contentTargeting.targetLocalityId &&
    !contentTargeting.targetAdminUnitId &&
    !contentTargeting.targetDistrictId &&
    !contentTargeting.targetExpatriateRegionId &&
    !contentTargeting.targetSectorNationalLevelId &&
    !contentTargeting.targetSectorRegionId &&
    !contentTargeting.targetSectorLocalityId &&
    !contentTargeting.targetSectorAdminUnitId &&
    !contentTargeting.targetSectorDistrictId;
  
  if (isGlobalContent) {
    // Everyone can see global content
    return true;
  }
  
  // Check access based on user's active hierarchy
  if (activeHierarchy === ActiveHierarchy.EXPATRIATE) {
    // Expatriate users can see:
    // 1. Content targeted at their expatriate region
    // 2. Global content (already checked above)
    if (contentTargeting.targetExpatriateRegionId && user.expatriateRegionId) {
      return contentTargeting.targetExpatriateRegionId === user.expatriateRegionId;
    }
    return false;
  }
  
  if (activeHierarchy === ActiveHierarchy.SECTOR) {
    // Sector hierarchy access with cascading
    // User can see content targeted at their level OR any parent level in their chain
    
    // Check sector district level
    if (contentTargeting.targetSectorDistrictId) {
      return user.sectorDistrictId === contentTargeting.targetSectorDistrictId;
    }
    
    // Check sector admin unit level (if content is at this level, user in any child district can see it)
    if (contentTargeting.targetSectorAdminUnitId && !contentTargeting.targetSectorDistrictId) {
      return user.sectorAdminUnitId === contentTargeting.targetSectorAdminUnitId;
    }
    
    // Check sector locality level
    if (contentTargeting.targetSectorLocalityId && !contentTargeting.targetSectorAdminUnitId && !contentTargeting.targetSectorDistrictId) {
      return user.sectorLocalityId === contentTargeting.targetSectorLocalityId;
    }
    
    // Check sector region level
    if (contentTargeting.targetSectorRegionId && !contentTargeting.targetSectorLocalityId && !contentTargeting.targetSectorAdminUnitId && !contentTargeting.targetSectorDistrictId) {
      return user.sectorRegionId === contentTargeting.targetSectorRegionId;
    }
    
    // Check sector national level
    if (contentTargeting.targetSectorNationalLevelId && !contentTargeting.targetSectorRegionId && !contentTargeting.targetSectorLocalityId && !contentTargeting.targetSectorAdminUnitId && !contentTargeting.targetSectorDistrictId) {
      return user.sectorNationalLevelId === contentTargeting.targetSectorNationalLevelId;
    }
    
    return false;
  }
  
  // Original (Geographic) hierarchy access with CASCADING
  // User can see content targeted at their level OR any parent level in their hierarchy chain
  
  // Check district level (most specific)
  if (contentTargeting.targetDistrictId) {
    return user.districtId === contentTargeting.targetDistrictId;
  }
  
  // Check admin unit level (if content is targeted here, all users in this admin unit's districts can see it)
  if (contentTargeting.targetAdminUnitId && !contentTargeting.targetDistrictId) {
    return user.adminUnitId === contentTargeting.targetAdminUnitId;
  }
  
  // Check locality level
  if (contentTargeting.targetLocalityId && !contentTargeting.targetAdminUnitId && !contentTargeting.targetDistrictId) {
    return user.localityId === contentTargeting.targetLocalityId;
  }
  
  // Check region level
  if (contentTargeting.targetRegionId && !contentTargeting.targetLocalityId && !contentTargeting.targetAdminUnitId && !contentTargeting.targetDistrictId) {
    return user.regionId === contentTargeting.targetRegionId;
  }
  
  // Check national level
  if (contentTargeting.targetNationalLevelId && !contentTargeting.targetRegionId && !contentTargeting.targetLocalityId && !contentTargeting.targetAdminUnitId && !contentTargeting.targetDistrictId) {
    return user.nationalLevelId === contentTargeting.targetNationalLevelId;
  }
  
  // No matching criteria found
  return false;
};

/**
 * Legacy function - check if user has access based on individual IDs
 * @deprecated Use hasHierarchyAccess with ContentTargeting object instead
 */
export const hasHierarchyAccessLegacy = (
  user: User,
  targetRegionId?: string,
  targetLocalityId?: string,
  targetAdminUnitId?: string,
  targetDistrictId?: string
): boolean => {
  return hasHierarchyAccess(user, {
    targetRegionId,
    targetLocalityId,
    targetAdminUnitId,
    targetDistrictId
  });
};

// Helper function to get the user's scope description
export const getUserScopeDescription = (user: User): string => {
  const levelName = getHierarchyLevelName(user.adminLevel);
  const hierarchyPath = getUserHierarchyPath(user);
  const activeHierarchy = user.activeHierarchy || ActiveHierarchy.ORIGINAL;
  
  if (user.adminLevel === AdminLevel.GENERAL_SECRETARIAT || user.adminLevel === AdminLevel.ADMIN) {
    return `${levelName} - الوصول لجميع المستويات`;
  }
  
  let hierarchyTypeName = '';
  switch (activeHierarchy) {
    case ActiveHierarchy.ORIGINAL:
      hierarchyTypeName = 'جغرافي';
      break;
    case ActiveHierarchy.EXPATRIATE:
      hierarchyTypeName = 'المغتربين';
      break;
    case ActiveHierarchy.SECTOR:
      hierarchyTypeName = 'القطاع';
      break;
  }
  
  if (hierarchyPath) {
    return `${levelName} (${hierarchyTypeName}) - ${hierarchyPath}`;
  }
  
  return `${levelName} (${hierarchyTypeName})`;
};

/**
 * Get the active hierarchy type display name in Arabic
 */
export const getActiveHierarchyDisplayName = (activeHierarchy?: ActiveHierarchy): string => {
  if (!activeHierarchy) return 'جغرافي';
  
  const names: Record<ActiveHierarchy, string> = {
    [ActiveHierarchy.ORIGINAL]: 'جغرافي',
    [ActiveHierarchy.EXPATRIATE]: 'المغتربين',
    [ActiveHierarchy.SECTOR]: 'القطاع',
  };
  
  return names[activeHierarchy] || 'جغرافي';
};

/**
 * Check if user can switch to a specific hierarchy
 */
export const canSwitchToHierarchy = (user: User, targetHierarchy: ActiveHierarchy): boolean => {
  switch (targetHierarchy) {
    case ActiveHierarchy.ORIGINAL:
      // User can switch to original if they have any original hierarchy data
      return !!(user.nationalLevelId || user.regionId || user.localityId || user.adminUnitId || user.districtId);
    
    case ActiveHierarchy.EXPATRIATE:
      // User can switch to expatriate if they have expatriate region
      return !!user.expatriateRegionId;
    
    case ActiveHierarchy.SECTOR:
      // User can switch to sector if they have any sector hierarchy data
      return !!(user.sectorNationalLevelId || user.sectorRegionId || user.sectorLocalityId || user.sectorAdminUnitId || user.sectorDistrictId);
    
    default:
      return false;
  }
};
