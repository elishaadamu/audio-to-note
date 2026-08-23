import RecordButton from "@/components/RecordButton";
import WaveformVisualizer from "@/components/WaveformVisualizer";
import Colors from "@/constants/Colors";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from "react";
import { useKeepAwake } from 'expo-keep-awake';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "@/hooks/useTranslation";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordScreen() {
  const { t } = useTranslation();
  const [duration, setDuration] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Keep the device from sleeping while recording
  useKeepAwake();

  // Audio state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metering, setMetering] = useState(-160);

  // Fake precise metering during playback since Expo AV Sound doesn't natively expose live decibel checks
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setMetering(-35 + Math.random() * 35);
      }, 150);
    } else if (!isRecording) {
      setMetering(-160);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isRecording]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headerOpacity = useSharedValue(1);

  // Unload sound properly if unmounted
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Timer loop
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please grant microphone permissions to record.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: ".m4a",
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        }
      );

      // Throttling Native AV status hooks to 250ms to completely prevent 'Maximum update depth'
      // exceptions triggered by overlapping batched 60ms React thread queues.
      newRecording.setProgressUpdateInterval(250);
      newRecording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          setMetering(status.metering);
        }
      });

      setRecording(newRecording);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setRecordedUri(null);

      headerOpacity.value = withTiming(0.4, { duration: 400 });
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsPaused(false);
      headerOpacity.value = withTiming(1, { duration: 400 });

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      console.log("Finished recording. Original URI:", uri);
      
      if (uri) {
        // Expo Go frequently sweeps its /cache/ directory aggressively on Android.
        // We copy the temporary audio buffer payload into persistent Device Document space with a unique filename
        const ext = uri.split(".").pop() || "m4a";
        const uniqueFileName = `recording_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const safePersistentUri = `${FileSystem.documentDirectory}${uniqueFileName}`;

        console.log("Copying to persistent storage:", safePersistentUri);
        await FileSystem.copyAsync({
          from: uri,
          to: safePersistentUri,
        });
        setRecordedUri(safePersistentUri);
      } else {
        Alert.alert("Error", "Recording finished but no audio file was generated.");
      }
      setRecording(null);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  const handlePauseResumeRecord = async () => {
    if (!recording) return;

    try {
      if (isPaused) {
        await recording.startAsync();
        setIsPaused(false);
      } else {
        await recording.pauseAsync();
        setIsPaused(true);
      }
    } catch (error) {
      console.error("Failed to pause/resume recording", error);
    }
  };

  const handlePlayPauseSound = async () => {
    if (!recordedUri) return;

    try {
      if (sound) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            // Prevent getting stuck at the end of the audio track
            if (
              status.positionMillis >= (status.durationMillis || 0) &&
              status.durationMillis! > 0
            ) {
              await sound.setPositionAsync(0);
              setDuration(0);
            }
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          {
            shouldPlay: true,
            isLooping: false,
            progressUpdateIntervalMillis: 200,
          },
        );
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            // Update the live timer UI block mapping
            setDuration(Math.floor(status.positionMillis / 1000));

            if (status.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
              newSound.pauseAsync(); // Explicitly halt it
            }
          }
        });
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Failed to play sound", err);
    }
  };

  const handleDiscard = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setDuration(0);
    setIsPlaying(false);
  };

  const handleProcessNotes = async () => {
    if (!recordedUri) return;
    const targetUri = recordedUri;
    const targetDuration = duration;

    // Unload any audio preview
    if (sound) {
      await sound.unloadAsync().catch(() => {});
      setSound(null);
    }

    // Reset recording state so the screen shows Record & Upload when returning
    setRecordedUri(null);
    setDuration(0);
    setIsPlaying(false);

    router.push(
      `/note/new-note?audioUri=${encodeURIComponent(targetUri)}&duration=${targetDuration}`,
    );
  };

  const handleUploadAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets.length) return;

      const asset = result.assets[0];
      console.log("Selected file:", asset.uri);

      // We still need to copy it to our document directory for consistency and persistence
      const ext = asset.name.split('.').pop() || 'm4a';
      const safePersistentUri = `${FileSystem.documentDirectory}uploaded_audio_${Date.now()}.${ext}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: safePersistentUri,
      });

      // Get duration
      const { sound: tempSound } = await Audio.Sound.createAsync(
        { uri: safePersistentUri },
        { shouldPlay: false }
      );
      const status = await tempSound.getStatusAsync();
      if (status.isLoaded) {
        const secs = Math.floor(status.durationMillis! / 1000);
        setDuration(secs);
        await tempSound.unloadAsync();
      }

      setRecordedUri(safePersistentUri);
      Alert.alert("Success", "Audio file uploaded ready for processing.");
    } catch (error) {
      console.error("Upload Error:", error);
      Alert.alert("Error", "Failed to upload file.");
    }
  };

  const handleExportAudio = async () => {
    if (!recordedUri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(recordedUri, {
          mimeType: "audio/m4a",
          dialogTitle: "Save Audio Recording",
          UTI: "public.mpeg-4-audio",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Failed to export audio:", error);
      Alert.alert("Error", "Failed to export audio.");
    }
  };

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const containerPaddingTop = Platform.OS === "ios" ? "pt-4" : "pt-8";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className={`px-6 ${containerPaddingTop} items-center`}>
          {/* Header */}
          <Animated.View
            style={[headerAnimStyle]}
            className="w-full mb-6 gap-2.5"
          >
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-[28px] font-extrabold text-textPrimary tracking-tight">
                {t('readyToRecord')}
              </Text>
              <Text className="text-[13px] text-textSecondary mt-0.5 leading-snug">
                {t('tapToStart')}
              </Text>
            </Animated.View>

            {/* Status chips */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="flex-row gap-2 mt-1"
            >
              <View className="flex-row items-center gap-1.5 bg-surfaceElevated border border-surfaceBorder rounded-full px-3 py-1.5">
                <MaterialIcons
                  name="graphic-eq"
                  size={13}
                  color={Colors.success}
                />
                <Text className="text-textSecondary text-[11px] font-medium">
                  Gemini 2.5
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 bg-surfaceElevated border border-surfaceBorder rounded-full px-3 py-1.5">
                <MaterialIcons
                  name="auto-awesome"
                  size={13}
                  color={Colors.accentLight}
                />
                <Text className="text-textSecondary text-[11px] font-medium">
                  {t('flashAnalytics')}
                </Text>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Timer */}
          <Animated.View
            entering={FadeIn.delay(150)}
            className="items-center justify-center mb-4 mt-1 min-h-[72px] gap-1"
          >
            {isRecording || recordedUri ? (
              <>
                {isRecording && (
                  <View className="w-2 h-2 rounded-full bg-danger mb-0.5" />
                )}
                <Text
                  className="text-[48px] font-extrabold text-textPrimary tracking-tighter"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatTime(duration)}
                </Text>

                {isRecording ? (
                  <Text className="text-[11px] font-bold text-danger tracking-[2.5px]">
                    {isPaused ? t('paused_status') : t('record_status')}
                  </Text>
                ) : (
                  <Text className="text-[11px] font-bold text-success tracking-[2.5px]">
                    {t('saved_status')}
                  </Text>
                )}
              </>
            ) : (
              <Text className="text-[48px] font-extrabold text-textPlaceholder tracking-tighter">
                00:00
              </Text>
            )}
          </Animated.View>

          {/* Waveform */}
          <Animated.View
            entering={FadeIn.delay(200)}
            className="w-full bg-surfaceElevated rounded-2xl border border-surfaceBorder mb-7 overflow-hidden py-2"
          >
            <WaveformVisualizer
              isRecording={(isRecording && !isPaused) || isPlaying}
              metering={metering}
            />
          </Animated.View>

          {/* Record & Upload Buttons */}
          {!recordedUri && (
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="items-center gap-4 mb-5 w-full"
            >
              {!isRecording ? (
                <View className="flex-row items-center justify-center gap-9 w-full">
                  <View className="items-center">
                    <RecordButton
                      isRecording={isRecording}
                      onPress={startRecording}
                      size={92}
                    />
                    <Text className="text-[12px] font-bold text-textSecondary uppercase tracking-widest mt-3">
                      {t('record')}
                    </Text>
                  </View>

                  <View className="items-center">
                    <TouchableOpacity
                      onPress={handleUploadAudio}
                      className="w-[92px] h-[92px] rounded-full bg-surfaceElevated border border-surfaceBorder items-center justify-center shadow-lg shadow-black/30"
                      style={{ borderStyle: 'dashed' }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="upload-file" size={36} color={Colors.accent} />
                    </TouchableOpacity>
                    <Text className="text-[12px] font-bold text-textSecondary uppercase tracking-widest mt-3">
                      {t('upload')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="items-center justify-center w-full">
                   <RecordButton
                    isRecording={isRecording}
                    onPress={stopRecording}
                    size={92}
                  />
                  <Text className="text-[12px] font-bold text-textSecondary uppercase tracking-widest mt-3">
                    {t('stop')}
                  </Text>
                </View>
              )}
              
              <Text className="text-[13px] text-textMuted tracking-tight mt-1.5">
                {isRecording ? t('tapToStop') : t('selectAudioSource')}
              </Text>
            </Animated.View>
          )}

          {/* Pause button for Recording */}
          {isRecording && (
            <Animated.View entering={FadeInDown.springify()} className="mb-5">
              <TouchableOpacity
                className="flex-row items-center gap-2 bg-surfaceElevated border border-surfaceBorder rounded-full px-6 py-3"
                onPress={handlePauseResumeRecord}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={isPaused ? "play-arrow" : "pause"}
                  size={22}
                  color={Colors.textPrimary}
                />
                <Text className="text-textPrimary text-[15px] font-medium">
                  {isPaused ? t('resume') : t('pause')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Playback Controls (shows after getting recordedUri) */}
          {!isRecording && recordedUri && (
            <Animated.View
              entering={FadeInDown.springify()}
              className="w-full gap-3 mt-2 mb-5"
            >
              <TouchableOpacity
                onPress={handlePlayPauseSound}
                className="flex-row items-center justify-center gap-2 py-3.5 bg-accent rounded-2xl shadow-lg shadow-accent/30"
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={isPlaying ? "pause" : "play-arrow"}
                  size={22}
                  color={Colors.textPrimary}
                />
                <Text className="text-textPrimary text-[15px] font-bold tracking-wide">
                  {isPlaying ? t('pausePlayback') : t('playAudio')}
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleDiscard}
                  className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-[#FF475718] border border-[#FF475730] rounded-xl"
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={18}
                    color={Colors.danger}
                  />
                  <Text className="text-danger font-semibold text-[13px]">{t('discard')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleProcessNotes}
                  className="flex-row items-center justify-center gap-2 py-3 bg-[#2ED57318] border border-[#2ED57330] rounded-xl px-7"
                >
                  <MaterialIcons
                    name="auto-awesome"
                    size={18}
                    color={Colors.success}
                  />
                  <Text className="text-success font-semibold text-[13px]">
                    {t('processNotes')}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Feature pills */}
          {!isRecording && !recordedUri && (
            <Animated.View
              entering={FadeInDown.delay(500).springify()}
              className="flex-row gap-2 w-full justify-center flex-wrap mt-4"
            >
              {[
                { icon: "record-voice-over", label: t('speech_to_text') },
                { icon: "summarize", label: t('ai_summary') },
                { icon: "translate", label: t('multi_language') },
              ].map((f) => (
                <View
                  key={f.label}
                  className="flex-row items-center gap-1.5 bg-surfaceElevated border border-surfaceBorder rounded-full px-3 py-1.5"
                >
                  <MaterialIcons
                    name={f.icon as any}
                    size={14}
                    color={Colors.accent}
                  />
                  <Text className="text-textSecondary text-[11px] font-medium">
                    {f.label}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
