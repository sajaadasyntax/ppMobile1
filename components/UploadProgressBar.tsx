/**
 * UploadProgressBar — Reusable upload UI with progress, cancel, retry.
 *
 * Usage:
 *   <UploadProgressBar
 *     visible={isUploading}
 *     progress={uploadProgress}
 *     fileName="receipt.jpg"
 *     onCancel={cancelUpload}
 *     onRetry={retryUpload}       // shown only after failure
 *     error={uploadError}          // set on failure, clears progress bar
 *   />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface UploadProgressBarProps {
  /** Show / hide the entire component */
  visible: boolean;
  /** 0-100 percent */
  progress: number;
  /** Display name of the file being uploaded */
  fileName?: string;
  /** Called when user taps "Cancel" */
  onCancel?: () => void;
  /** Called when user taps "Retry" (only shown after an error) */
  onRetry?: () => void;
  /** Non-null means the upload failed; shows error message + retry */
  error?: string | null;
  /** Optional status label override (e.g. "جاري الرفع..." ) */
  statusLabel?: string;
}

export default function UploadProgressBar({
  visible,
  progress,
  fileName,
  onCancel,
  onRetry,
  error,
  statusLabel,
}: UploadProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate progress bar width
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Fade in/out
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  const isComplete = progress >= 100 && !error;
  const hasError = !!error;

  const getStatusText = (): string => {
    if (statusLabel) return statusLabel;
    if (hasError) return error!;
    if (isComplete) return 'تم الرفع بنجاح';
    return `جاري الرفع... ${progress}%`;
  };

  const getBarColor = (): string => {
    if (hasError) return '#D32F2F';
    if (isComplete) return '#388E3C';
    return Colors.primary;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* File name */}
      {fileName && (
        <View style={styles.fileNameRow}>
          <Ionicons
            name={hasError ? 'alert-circle' : isComplete ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={18}
            color={hasError ? '#D32F2F' : isComplete ? '#388E3C' : Colors.primary}
          />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>
      )}

      {/* Progress bar track */}
      <View style={styles.trackOuter}>
        <Animated.View
          style={[
            styles.trackFill,
            {
              backgroundColor: getBarColor(),
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
            },
          ]}
        />
      </View>

      {/* Status + actions row */}
      <View style={styles.statusRow}>
        <Text
          style={[
            styles.statusText,
            hasError && styles.statusTextError,
            isComplete && styles.statusTextSuccess,
          ]}
        >
          {getStatusText()}
        </Text>

        <View style={styles.actions}>
          {/* Cancel button — shown while uploading */}
          {!isComplete && !hasError && onCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
          )}

          {/* Retry button — shown on error */}
          {hasError && onRetry && (
            <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 12,
    marginVertical: 8,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  fileName: {
    fontSize: 13,
    fontFamily: 'Tajawal-Medium',
    color: '#333',
    flex: 1,
  },
  trackOuter: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    color: '#666',
    flex: 1,
  },
  statusTextError: {
    color: '#D32F2F',
  },
  statusTextSuccess: {
    color: '#388E3C',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FFEBEE',
  },
  cancelText: {
    fontSize: 12,
    fontFamily: 'Tajawal-Medium',
    color: '#D32F2F',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: 12,
    fontFamily: 'Tajawal-Medium',
    color: '#FFFFFF',
  },
});
