import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ActiveHierarchy } from '../context/AuthContext';
import { apiService } from '../services/api';

interface HierarchySelectorProps {
  showMemberships?: boolean;
  onHierarchyChange?: (hierarchy: ActiveHierarchy) => void;
}

interface HierarchyMembership {
  hasOriginal: boolean;
  hasExpatriate: boolean;
  hasSector: boolean;
  originalHierarchy?: {
    nationalLevelName?: string;
    regionName?: string;
    localityName?: string;
    adminUnitName?: string;
    districtName?: string;
  };
  expatriateHierarchy?: {
    expatriateRegionName?: string;
  };
  sectorHierarchy?: {
    sectorNationalLevelName?: string;
    sectorRegionName?: string;
    sectorLocalityName?: string;
    sectorAdminUnitName?: string;
    sectorDistrictName?: string;
  };
}

const HierarchySelector: React.FC<HierarchySelectorProps> = ({
  showMemberships = true,
  onHierarchyChange,
}) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [memberships, setMemberships] = useState<HierarchyMembership | null>(null);
  const [selectedHierarchy, setSelectedHierarchy] = useState<ActiveHierarchy>(
    user?.activeHierarchy || ActiveHierarchy.ORIGINAL
  );

  useEffect(() => {
    if (showMemberships) {
      fetchMemberships();
    }
  }, [showMemberships]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUserHierarchyMemberships();
      setMemberships(data);
    } catch (error: any) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHierarchyChange = async (hierarchy: ActiveHierarchy) => {
    try {
      setLoading(true);
      
      // Call API to switch hierarchy
      const response = await apiService.switchHierarchy(hierarchy);
      
      // Update local state
      setSelectedHierarchy(hierarchy);
      
      // Update user in auth context
      if (user && response.user) {
        await updateUser({ ...user, activeHierarchy: hierarchy });
      }
      
      // Callback to parent
      if (onHierarchyChange) {
        onHierarchyChange(hierarchy);
      }
      
      Alert.alert('نجح', 'تم تبديل التسلسل الهرمي بنجاح');
    } catch (error: any) {
      console.error('Error switching hierarchy:', error);
      Alert.alert('خطأ', error.message || 'فشل تبديل التسلسل الهرمي');
    } finally {
      setLoading(false);
    }
  };

  const getHierarchyLabel = (hierarchy: ActiveHierarchy): string => {
    switch (hierarchy) {
      case ActiveHierarchy.ORIGINAL:
        return 'التسلسل الأصلي';
      case ActiveHierarchy.EXPATRIATE:
        return 'تسلسل المغتربين';
      case ActiveHierarchy.SECTOR:
        return 'تسلسل القطاع';
      default:
        return 'غير محدد';
    }
  };

  const getHierarchyIcon = (hierarchy: ActiveHierarchy): any => {
    switch (hierarchy) {
      case ActiveHierarchy.ORIGINAL:
        return 'home';
      case ActiveHierarchy.EXPATRIATE:
        return 'airplane';
      case ActiveHierarchy.SECTOR:
        return 'briefcase';
      default:
        return 'help-circle';
    }
  };

  const getHierarchyPath = (hierarchy: ActiveHierarchy): string => {
    if (!memberships) return 'غير متوفر';
    
    switch (hierarchy) {
      case ActiveHierarchy.ORIGINAL:
        if (!memberships.hasOriginal) return 'غير مسجل';
        const original = memberships.originalHierarchy;
        const originalParts = [
          original?.nationalLevelName,
          original?.regionName,
          original?.localityName,
          original?.adminUnitName,
          original?.districtName,
        ].filter(Boolean);
        return originalParts.join(' / ') || 'غير محدد';
      
      case ActiveHierarchy.EXPATRIATE:
        if (!memberships.hasExpatriate) return 'غير مسجل';
        const expatriate = memberships.expatriateHierarchy;
        return expatriate?.expatriateRegionName || 'غير محدد';
      
      case ActiveHierarchy.SECTOR:
        if (!memberships.hasSector) return 'غير مسجل';
        const sector = memberships.sectorHierarchy;
        const sectorParts = [
          sector?.sectorNationalLevelName,
          sector?.sectorRegionName,
          sector?.sectorLocalityName,
          sector?.sectorAdminUnitName,
          sector?.sectorDistrictName,
        ].filter(Boolean);
        return sectorParts.join(' / ') || 'غير محدد';
      
      default:
        return 'غير محدد';
    }
  };

  if (loading && !memberships) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2E7D32" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  const availableHierarchies: ActiveHierarchy[] = [];
  if (memberships?.hasOriginal) availableHierarchies.push(ActiveHierarchy.ORIGINAL);
  if (memberships?.hasExpatriate) availableHierarchies.push(ActiveHierarchy.EXPATRIATE);
  if (memberships?.hasSector) availableHierarchies.push(ActiveHierarchy.SECTOR);

  // If user has only one hierarchy, don't show the selector
  if (availableHierarchies.length <= 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          أنت مسجل في تسلسل هرمي واحد فقط: {getHierarchyLabel(selectedHierarchy)}
        </Text>
        {showMemberships && (
          <Text style={styles.pathText}>{getHierarchyPath(selectedHierarchy)}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.currentHierarchy}>
        <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
        <Text style={styles.currentText}>
          التسلسل الحالي: {getHierarchyLabel(selectedHierarchy)}
        </Text>
      </View>

      {showMemberships && (
        <Text style={styles.pathText}>{getHierarchyPath(selectedHierarchy)}</Text>
      )}

      <View style={styles.optionsContainer}>
        {availableHierarchies.map((hierarchy) => {
          const isSelected = hierarchy === selectedHierarchy;
          return (
            <TouchableOpacity
              key={hierarchy}
              style={[
                styles.optionButton,
                isSelected && styles.optionButtonSelected,
              ]}
              onPress={() => !isSelected && handleHierarchyChange(hierarchy)}
              disabled={loading || isSelected}
            >
              <Ionicons
                name={getHierarchyIcon(hierarchy)}
                size={24}
                color={isSelected ? '#FFFFFF' : '#2E7D32'}
              />
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected,
                  ]}
                >
                  {getHierarchyLabel(hierarchy)}
                </Text>
                {showMemberships && (
                  <Text
                    style={[
                      styles.optionPath,
                      isSelected && styles.optionPathSelected,
                    ]}
                  >
                    {getHierarchyPath(hierarchy)}
                  </Text>
                )}
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
              {loading && !isSelected && (
                <ActivityIndicator size="small" color="#2E7D32" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontFamily: 'Tajawal-Regular',
    fontSize: 14,
    color: '#666666',
  },
  currentHierarchy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  currentText: {
    fontFamily: 'Tajawal-Bold',
    fontSize: 16,
    color: '#2E7D32',
  },
  pathText: {
    fontFamily: 'Tajawal-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    textAlign: 'right',
  },
  infoText: {
    fontFamily: 'Tajawal-Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  optionTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  optionLabel: {
    fontFamily: 'Tajawal-Bold',
    fontSize: 16,
    color: '#333333',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  optionPath: {
    fontFamily: 'Tajawal-Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  optionPathSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

export default HierarchySelector;

