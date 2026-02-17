import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { SERVER_BASE_URL } from '../services/api';

interface VoicePlayerProps {
  mediaUrl: string;
  duration: number | null;
  isMine: boolean;
}

const NUM_BARS = 28;

function generateBars(): number[] {
  return Array.from({ length: NUM_BARS }, () => 0.15 + Math.random() * 0.85);
}

export default function VoicePlayer({ mediaUrl, duration, isMine }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const barsRef = useRef<number[]>(generateBars());

  // Animated values
  const playScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Animate progress bar smoothly
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: playbackProgress,
      duration: 150,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [playbackProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${SERVER_BASE_URL}${url}`;
  };

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (!status.isLoaded) return;

    if (status.durationMillis) {
      setTotalDuration(status.durationMillis / 1000);
      setPlaybackProgress(status.positionMillis / status.durationMillis);
      setCurrentPosition(status.positionMillis / 1000);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setPlaybackProgress(0);
      setCurrentPosition(0);
      soundRef.current?.stopAsync().catch(() => {});
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  }, []);

  const togglePlayback = async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(playScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(playScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        // Resume from paused position
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis && status.positionMillis >= status.durationMillis - 100) {
          await soundRef.current.setPositionAsync(0);
          setPlaybackProgress(0);
          setCurrentPosition(0);
        }
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // First time: load and play
      setIsLoading(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: getFullUrl(mediaUrl) },
        { shouldPlay: true, isLooping: false },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing voice message:', error);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const displayDuration = totalDuration || duration || 0;
  const displayTime = isPlaying || playbackProgress > 0 ? currentPosition : displayDuration;

  const barColor = isMine ? '#A5D6A7' : '#D0D0D0';
  const barActiveColor = isMine ? '#2E7D32' : Colors.primary;

  return (
    <View style={[styles.container, isMine ? styles.myMessage : styles.otherMessage]}>
      {/* Play / Pause button */}
      <Animated.View style={{ transform: [{ scale: playScale }] }}>
        <TouchableOpacity
          style={[styles.playButton, isMine ? styles.myPlayButton : styles.otherPlayButton]}
          onPress={togglePlayback}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={'#FFFFFF'} />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color={'#FFFFFF'}
              style={isPlaying ? undefined : { marginLeft: 2 }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Waveform bars */}
      <View style={styles.waveformContainer}>
        <View style={styles.barsRow}>
          {barsRef.current.map((h, i) => {
            const barProgress = i / NUM_BARS;
            const isActive = playbackProgress > barProgress;
            return (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: 4 + h * 18,
                    backgroundColor: isActive ? barActiveColor : barColor,
                    opacity: isActive ? 1 : 0.6,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Time display */}
        <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.otherTimeText]}>
          {formatTime(displayTime)}
        </Text>
      </View>

      {/* Mic icon */}
      <View style={[styles.micBadge, isMine ? styles.myMicBadge : styles.otherMicBadge]}>
        <Ionicons name="mic" size={12} color={isMine ? '#2E7D32' : '#999'} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 220,
    maxWidth: '100%',
    gap: 10,
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  myPlayButton: {
    backgroundColor: '#2E7D32',
  },
  otherPlayButton: {
    backgroundColor: Colors.primary,
  },
  waveformContainer: {
    flex: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    gap: 1.5,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 2,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Tajawal-Medium',
    marginTop: 4,
  },
  myTimeText: {
    color: 'rgba(0,0,0,0.45)',
  },
  otherTimeText: {
    color: '#888',
  },
  micBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myMicBadge: {
    backgroundColor: 'rgba(46,125,50,0.1)',
  },
  otherMicBadge: {
    backgroundColor: '#F0F0F0',
  },
});
