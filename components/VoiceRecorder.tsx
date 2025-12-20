import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

interface VoiceRecorderProps {
  onRecordingComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
  isRecording: boolean;
  setIsRecording: (value: boolean) => void;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  isRecording,
  setIsRecording,
}: VoiceRecorderProps) {
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Request microphone permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');
        if (status !== 'granted') {
          Alert.alert(
            'إذن مطلوب',
            'يرجى السماح للتطبيق بالوصول إلى الميكروفون لتسجيل الرسائل الصوتية',
            [{ text: 'حسناً', onPress: onCancel }]
          );
        }
      } catch (error) {
        console.error('Error requesting audio permission:', error);
        onCancel();
      }
    };

    requestPermission();

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, []);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording]);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('خطأ', 'لم يتم منح إذن الوصول إلى الميكروفون');
      return;
    }

    try {
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Create and prepare recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('خطأ', 'فشل بدء التسجيل');
    }
  };

  const stopRecording = async (shouldSend: boolean = true) => {
    if (!recordingRef.current) return;

    try {
      // Stop the duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      // Stop the recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const duration = recordingDuration;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

      if (shouldSend && uri && duration > 0) {
        onRecordingComplete(uri, duration);
      } else {
        onCancel();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      onCancel();
    }
  };

  const cancelRecording = async () => {
    await stopRecording(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {isRecording ? (
        <View style={styles.recordingContainer}>
          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
            <Ionicons name="trash-outline" size={24} color="#D32F2F" />
          </TouchableOpacity>

          {/* Recording indicator */}
          <View style={styles.recordingInfo}>
            <Animated.View
              style={[
                styles.recordingDot,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
          </View>

          {/* Send button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => stopRecording(true)}
          >
            <Ionicons name="send" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <TouchableOpacity style={styles.cancelTextButton} onPress={onCancel}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.micButton} onPress={startRecording}>
            <Ionicons name="mic" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.hintText}>اضغط للتسجيل</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  startContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF3F3',
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D32F2F',
    marginRight: 8,
  },
  durationText: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
    color: '#D32F2F',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  hintText: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Tajawal-Regular',
    position: 'absolute',
    bottom: -5,
  },
});

