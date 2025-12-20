import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
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

export default function VoicePlayer({ mediaUrl, duration, isMine }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${SERVER_BASE_URL}${url}`;
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      // Load and play the sound
      setIsLoading(true);

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const fullUrl = getFullUrl(mediaUrl);
      console.log('Loading audio from:', fullUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true },
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

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.durationMillis) {
        const progress = status.positionMillis / status.durationMillis;
        setPlaybackProgress(progress);
        setCurrentPosition(status.positionMillis / 1000);
      }

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackProgress(0);
        setCurrentPosition(0);
        // Reset to beginning
        soundRef.current?.setPositionAsync(0);
      }
    }
  };

  const displayDuration = duration || 0;
  const displayPosition = isPlaying ? currentPosition : 0;

  return (
    <View style={[styles.container, isMine ? styles.myMessage : styles.otherMessage]}>
      <TouchableOpacity
        style={[styles.playButton, isMine ? styles.myPlayButton : styles.otherPlayButton]}
        onPress={togglePlayback}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={isMine ? Colors.primary : '#FFFFFF'} />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={isMine ? Colors.primary : '#FFFFFF'}
          />
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        {/* Progress bar background */}
        <View style={[styles.progressBar, isMine ? styles.myProgressBar : styles.otherProgressBar]}>
          {/* Progress bar fill */}
          <View
            style={[
              styles.progressFill,
              isMine ? styles.myProgressFill : styles.otherProgressFill,
              { width: `${playbackProgress * 100}%` },
            ]}
          />
        </View>

        {/* Duration text */}
        <Text style={[styles.durationText, isMine ? styles.myDurationText : styles.otherDurationText]}>
          {isPlaying ? formatDuration(displayPosition) : formatDuration(displayDuration)}
        </Text>
      </View>

      {/* Voice wave icon */}
      <Ionicons
        name="mic"
        size={16}
        color={isMine ? 'rgba(255,255,255,0.7)' : '#666666'}
        style={styles.micIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    minWidth: 180,
  },
  myMessage: {
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  myPlayButton: {
    backgroundColor: '#FFFFFF',
  },
  otherPlayButton: {
    backgroundColor: Colors.primary,
  },
  progressContainer: {
    flex: 1,
    marginRight: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  myProgressBar: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  otherProgressBar: {
    backgroundColor: '#E0E0E0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  myProgressFill: {
    backgroundColor: '#FFFFFF',
  },
  otherProgressFill: {
    backgroundColor: Colors.primary,
  },
  durationText: {
    fontSize: 11,
    fontFamily: 'Tajawal-Regular',
  },
  myDurationText: {
    color: 'rgba(255,255,255,0.8)',
  },
  otherDurationText: {
    color: '#666666',
  },
  micIcon: {
    marginLeft: 4,
  },
});

