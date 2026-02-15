import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, ActiveHierarchy } from '../context/AuthContext';
import { apiService } from '../services/api';

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

interface HierarchySelectorProps {
  /** When true, fetches and displays hierarchy path details */
  showMemberships?: boolean;
  /** Called after a successful hierarchy switch */
  onHierarchyChange?: (hierarchy: ActiveHierarchy) => void;
  /** When true the component renders as a compact pill suitable for a header bar */
  compact?: boolean;
}

interface HierarchyMembership {
  hasOriginal: boolean;
  hasExpatriate: boolean;
  hasSector: boolean;
  originalStatus?: 'active' | 'suspended' | 'disabled';
  expatriateStatus?: 'active' | 'suspended' | 'disabled';
  sectorStatus?: 'active' | 'suspended' | 'disabled';
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

type HierarchyConfig = {
  key: ActiveHierarchy;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const SCREEN_HEIGHT = Dimensions.get('window').height;

const HIERARCHY_CONFIGS: HierarchyConfig[] = [
  // Labels must match the canonical terminology in Backend & Admin
  { key: ActiveHierarchy.ORIGINAL, label: 'جغرافي', icon: 'earth', color: '#2E7D32' },
  { key: ActiveHierarchy.EXPATRIATE, label: 'المغتربين', icon: 'airplane', color: '#1565C0' },
  { key: ActiveHierarchy.SECTOR, label: 'القطاع', icon: 'briefcase', color: '#E65100' },
];

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const HierarchySelector: React.FC<HierarchySelectorProps> = ({
  showMemberships = true,
  onHierarchyChange,
  compact = false,
}) => {
  const { user, updateUser, updateToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [memberships, setMemberships] = useState<HierarchyMembership | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedHierarchy, setSelectedHierarchy] = useState<ActiveHierarchy>(
    user?.activeHierarchy || ActiveHierarchy.ORIGINAL,
  );

  // Bottom-sheet animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Keep selectedHierarchy in sync with user context
  useEffect(() => {
    if (user?.activeHierarchy) {
      setSelectedHierarchy(user.activeHierarchy);
    }
  }, [user?.activeHierarchy]);

  // Fetch memberships on mount
  useEffect(() => {
    if (showMemberships) fetchMemberships();
  }, [showMemberships]);

  // -----------------------------------------------------------------------
  //  API calls
  // -----------------------------------------------------------------------

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

  const handleSwitch = async (hierarchy: ActiveHierarchy) => {
    if (hierarchy === selectedHierarchy) {
      closeSheet();
      return;
    }

    try {
      setSwitching(true);

      const response = await apiService.switchHierarchy(hierarchy);

      // The backend now returns a fresh JWT -- persist it
      if (response.accessToken && typeof updateToken === 'function') {
        await updateToken(response.accessToken);
      }

      // Update user in auth context
      if (response.user) {
        await updateUser({ ...user!, ...response.user, activeHierarchy: hierarchy });
      } else if (user) {
        await updateUser({ ...user, activeHierarchy: hierarchy });
      }

      setSelectedHierarchy(hierarchy);
      onHierarchyChange?.(hierarchy);

      closeSheet();
      // Small delay so the sheet closes before the alert
      setTimeout(() => {
        Alert.alert('تم التبديل', `أنت الآن في ${getConfig(hierarchy).label}`);
      }, 350);
    } catch (error: any) {
      console.error('Error switching hierarchy:', error);
      const isSuspended = error?.message?.includes('موقوف') || error?.response?.data?.code === 'HIERARCHY_SUSPENDED';
      Alert.alert(
        isSuspended ? 'الحساب موقوف' : 'خطأ',
        error.message || 'فشل تبديل التسلسل الهرمي',
      );
    } finally {
      setSwitching(false);
    }
  };

  // -----------------------------------------------------------------------
  //  Helpers
  // -----------------------------------------------------------------------

  const getConfig = (h: ActiveHierarchy): HierarchyConfig =>
    HIERARCHY_CONFIGS.find((c) => c.key === h) || HIERARCHY_CONFIGS[0];

  const getStatusForHierarchy = (h: ActiveHierarchy): string | undefined => {
    if (!memberships) return undefined;
    switch (h) {
      case ActiveHierarchy.ORIGINAL: return memberships.originalStatus;
      case ActiveHierarchy.EXPATRIATE: return memberships.expatriateStatus;
      case ActiveHierarchy.SECTOR: return memberships.sectorStatus;
    }
  };

  const getPath = useCallback((hierarchy: ActiveHierarchy): string => {
    if (!memberships) return '';
    switch (hierarchy) {
      case ActiveHierarchy.ORIGINAL: {
        if (!memberships.hasOriginal) return 'غير مسجل';
        const o = memberships.originalHierarchy;
        return [o?.nationalLevelName, o?.regionName, o?.localityName, o?.adminUnitName, o?.districtName]
          .filter(Boolean)
          .join(' / ') || 'غير محدد';
      }
      case ActiveHierarchy.EXPATRIATE: {
        if (!memberships.hasExpatriate) return 'غير مسجل';
        return memberships.expatriateHierarchy?.expatriateRegionName || 'غير محدد';
      }
      case ActiveHierarchy.SECTOR: {
        if (!memberships.hasSector) return 'غير مسجل';
        const s = memberships.sectorHierarchy;
        return [s?.sectorNationalLevelName, s?.sectorRegionName, s?.sectorLocalityName, s?.sectorAdminUnitName, s?.sectorDistrictName]
          .filter(Boolean)
          .join(' / ') || 'غير محدد';
      }
      default:
        return '';
    }
  }, [memberships]);

  const hasMembership = (h: ActiveHierarchy) => {
    if (!memberships) return false;
    switch (h) {
      case ActiveHierarchy.ORIGINAL: return memberships.hasOriginal;
      case ActiveHierarchy.EXPATRIATE: return memberships.hasExpatriate;
      case ActiveHierarchy.SECTOR: return memberships.hasSector;
    }
  };

  const availableHierarchies = HIERARCHY_CONFIGS.filter((c) => hasMembership(c.key));

  // -----------------------------------------------------------------------
  //  Sheet open/close
  // -----------------------------------------------------------------------

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setSheetVisible(false));
  };

  // -----------------------------------------------------------------------
  //  Loading / single-hierarchy early returns
  // -----------------------------------------------------------------------

  if (loading && !memberships) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#2E7D32" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (availableHierarchies.length <= 1 && !compact) {
    return (
      <View style={styles.container}>
        <Text style={styles.singleInfoText}>
          أنت مسجل في تسلسل هرمي واحد فقط: {getConfig(selectedHierarchy).label}
        </Text>
        {showMemberships && <Text style={styles.pathText}>{getPath(selectedHierarchy)}</Text>}
      </View>
    );
  }

  // -----------------------------------------------------------------------
  //  Compact pill (for profile header)
  // -----------------------------------------------------------------------

  const currentCfg = getConfig(selectedHierarchy);

  if (compact) {
    return (
      <>
        <TouchableOpacity style={[styles.pillButton, { borderColor: currentCfg.color }]} onPress={openSheet} activeOpacity={0.7}>
          <Ionicons name={currentCfg.icon} size={16} color={currentCfg.color} />
          <Text style={[styles.pillLabel, { color: currentCfg.color }]} numberOfLines={1}>
            {currentCfg.label}
          </Text>
          <Ionicons name="swap-horizontal" size={14} color={currentCfg.color} />
        </TouchableOpacity>

        {sheetVisible && renderBottomSheet()}
      </>
    );
  }

  // -----------------------------------------------------------------------
  //  Full (card) mode – renders inline options + the bottom-sheet
  // -----------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Active hierarchy indicator */}
      <View style={[styles.activeBar, { backgroundColor: currentCfg.color + '12' }]}>
        <View style={[styles.activeDot, { backgroundColor: currentCfg.color }]} />
        <Text style={[styles.activeLabel, { color: currentCfg.color }]}>
          التسلسل الحالي: {currentCfg.label}
        </Text>
      </View>

      {showMemberships && (
        <Text style={styles.pathText}>{getPath(selectedHierarchy)}</Text>
      )}

      {/* Inline option cards */}
      <View style={styles.optionsContainer}>
        {availableHierarchies.map((cfg) => {
          const isSelected = cfg.key === selectedHierarchy;
          const status = getStatusForHierarchy(cfg.key);
          const isSuspended = status === 'suspended' || status === 'disabled';

          return (
            <TouchableOpacity
              key={cfg.key}
              style={[
                styles.optionCard,
                isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '0D' },
                isSuspended && styles.optionCardSuspended,
              ]}
              onPress={() => handleSwitch(cfg.key)}
              disabled={switching || isSelected}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: isSelected ? cfg.color : '#F0F0F0' }]}>
                <Ionicons name={cfg.icon} size={22} color={isSelected ? '#FFF' : cfg.color} />
              </View>

              <View style={styles.optionBody}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionLabel, isSelected && { color: cfg.color, fontFamily: 'Tajawal-Bold' }]}>
                    {cfg.label}
                  </Text>
                  {isSuspended && (
                    <View style={styles.suspendedBadge}>
                      <Ionicons name="alert-circle" size={12} color="#D32F2F" />
                      <Text style={styles.suspendedBadgeText}>موقوف</Text>
                    </View>
                  )}
                </View>
                {showMemberships && (
                  <Text style={[styles.optionPath, isSelected && { color: cfg.color + 'CC' }]} numberOfLines={1}>
                    {getPath(cfg.key)}
                  </Text>
                )}
              </View>

              {isSelected && <Ionicons name="checkmark-circle" size={22} color={cfg.color} />}
              {switching && !isSelected && <ActivityIndicator size="small" color={cfg.color} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {sheetVisible && renderBottomSheet()}
    </View>
  );

  // -----------------------------------------------------------------------
  //  Bottom-sheet renderer (shared by compact & full modes)
  // -----------------------------------------------------------------------

  function renderBottomSheet() {
    return (
      <Modal transparent visible={sheetVisible} animationType="none" onRequestClose={closeSheet}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={closeSheet} />

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>تبديل التسلسل الهرمي</Text>
          <Text style={styles.sheetSubtitle}>اختر التسلسل الذي تريد استخدامه</Text>

          {availableHierarchies.map((cfg) => {
            const isSelected = cfg.key === selectedHierarchy;
            const status = getStatusForHierarchy(cfg.key);
            const isSuspended = status === 'suspended' || status === 'disabled';

            return (
              <TouchableOpacity
                key={cfg.key}
                style={[
                  styles.sheetOption,
                  isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '0D' },
                  isSuspended && styles.sheetOptionSuspended,
                ]}
                onPress={() => !isSuspended && handleSwitch(cfg.key)}
                disabled={switching || isSuspended}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetOptionIcon, { backgroundColor: isSelected ? cfg.color : '#F0F0F0' }]}>
                  <Ionicons name={cfg.icon} size={24} color={isSelected ? '#FFF' : cfg.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.optionTitleRow}>
                    <Text style={[styles.sheetOptionLabel, isSelected && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                    {isSelected && (
                      <View style={[styles.activePill, { backgroundColor: cfg.color }]}>
                        <Text style={styles.activePillText}>نشط</Text>
                      </View>
                    )}
                    {isSuspended && (
                      <View style={styles.suspendedBadge}>
                        <Ionicons name="alert-circle" size={12} color="#D32F2F" />
                        <Text style={styles.suspendedBadgeText}>موقوف</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sheetOptionPath} numberOfLines={1}>
                    {getPath(cfg.key)}
                  </Text>
                </View>

                {switching && !isSelected && <ActivityIndicator size="small" color={cfg.color} />}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.sheetCancel} onPress={closeSheet}>
            <Text style={styles.sheetCancelText}>إلغاء</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    );
  }
};

// ---------------------------------------------------------------------------
//  Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Loading / single
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginLeft: 10, fontFamily: 'Tajawal-Regular', fontSize: 14, color: '#666' },
  singleInfoText: { fontFamily: 'Tajawal-Regular', fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },

  // Card container (full mode)
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },

  // Active hierarchy bar
  activeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  activeLabel: { fontFamily: 'Tajawal-Bold', fontSize: 15 },

  pathText: { fontFamily: 'Tajawal-Regular', fontSize: 13, color: '#888', marginBottom: 14, textAlign: 'right' },

  // Inline option cards
  optionsContainer: { gap: 10 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  optionCardSuspended: { opacity: 0.5 },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: { flex: 1, alignItems: 'flex-end' },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionLabel: { fontFamily: 'Tajawal-Medium', fontSize: 15, color: '#333' },
  optionPath: { fontFamily: 'Tajawal-Regular', fontSize: 12, color: '#888', marginTop: 2 },

  // Suspended badge
  suspendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  suspendedBadgeText: { fontFamily: 'Tajawal-Medium', fontSize: 10, color: '#D32F2F' },

  // Compact pill button
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#FFF',
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  pillLabel: { fontFamily: 'Tajawal-Bold', fontSize: 13 },

  // Bottom-sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontFamily: 'Tajawal-Bold', fontSize: 20, color: '#222', textAlign: 'center', marginBottom: 4 },
  sheetSubtitle: { fontFamily: 'Tajawal-Regular', fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },

  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    marginBottom: 10,
    gap: 14,
  },
  sheetOptionSuspended: { opacity: 0.45 },
  sheetOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionLabel: { fontFamily: 'Tajawal-Bold', fontSize: 16, color: '#333' },
  sheetOptionPath: { fontFamily: 'Tajawal-Regular', fontSize: 13, color: '#888', marginTop: 2 },

  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activePillText: { fontFamily: 'Tajawal-Bold', fontSize: 10, color: '#FFF' },

  sheetCancel: {
    marginTop: 6,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  sheetCancelText: { fontFamily: 'Tajawal-Bold', fontSize: 15, color: '#666' },
});

export default HierarchySelector;
