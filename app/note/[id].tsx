import { Colors } from "@/constants/Colors";
import { API_URL } from "@/constants/Config";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ExpoFileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { marked } from "marked";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { NoteSkeleton } from "@/components/SkeletonLoader";
import { notesService } from "@/services/notesService";
import { getAuthToken } from "@/services/apiClient";
import { useTranslation } from "@/hooks/useTranslation";

type Tab = "summary" | "transcript" | "quiz";

const LANGUAGES = [
  { label: "English", value: "English" },
  { label: "French", value: "French" },
  { label: "Spanish", value: "Spanish" },
  { label: "German", value: "German" },
  { label: "Chinese", value: "Chinese" },
  { label: "Arabic", value: "Arabic" },
  { label: "Hausa", value: "Hausa" },
  { label: "Igbo", value: "Igbo" },
  { label: "Yoruba", value: "Yoruba" },
];

interface QuizItem {
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

export default function NoteDetailScreen() {
  const { t } = useTranslation();
  const { id, audioUri, duration } = useLocalSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const scrollRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isKaraokeEnabled, setIsKaraokeEnabled] = useState(true);

  const handleScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    setShowScrollTop(y > 300);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const { colorScheme } = useColorScheme();

  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const commonStyles = React.useMemo(() => ({
    body: { color: theme.textSecondary, fontSize: 14, lineHeight: 22 },
    heading1: {
      color: theme.textPrimary,
      fontSize: 18,
      fontWeight: "bold",
      marginVertical: 8,
    },
    heading2: {
      color: theme.textPrimary,
      fontSize: 16,
      fontWeight: "bold",
      marginVertical: 6,
    },
    heading3: {
      color: theme.textPrimary,
      fontSize: 15,
      fontWeight: "bold",
      marginVertical: 4,
    },
    em: { color: theme.textSecondary, fontStyle: "italic" },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: theme.accent,
      paddingLeft: 12,
      backgroundColor: theme.surfaceElevated,
      opacity: 0.9,
      marginVertical: 12,
    },
    paragraph: { marginVertical: 8 },
    bullet_list: { marginTop: 4, marginBottom: 8 },
    ordered_list: { marginTop: 4, marginBottom: 8 },
    list_item: { marginVertical: 3, paddingLeft: 4 },
    code_inline: {
      backgroundColor: theme.surfaceElevated,
      color: theme.accentLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    },
    code_block: {
      backgroundColor: theme.surfaceElevated,
      color: theme.accentLight,
      padding: 12,
      borderRadius: 8,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      marginVertical: 8,
    },
  }), [theme]);

  const summaryStyles: any = React.useMemo(() => ({
    ...commonStyles,
    strong: { color: theme.textPrimary, fontWeight: "bold" },
  }), [commonStyles, theme]);

  const transcriptStyles: any = React.useMemo(() => ({
    ...commonStyles,
    strong: { color: theme.accent, fontWeight: "900", marginTop: 12 },
    paragraph: { marginVertical: 12 },
  }), [commonStyles, theme]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState<any>(null);

  const fetchNoteFromBackend = async () => {
    if (id === "new-note") return;
    setIsProcessing(true);
    try {
      const data = await notesService.fetchNote(id as string);
      setNote({
        ...data,
        date: new Date(data.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
    } catch (error) {
      console.error("Fetch Note Error:", error);
      Alert.alert("Error", "Could not load note content.");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveNoteToBackend = async (noteData: any) => {
    try {
      const savedNote = await notesService.saveNote(noteData, audioUri as string);
      return savedNote;
    } catch (error) {
      console.error("Save Note Error:", error);
      console.error("Failed to save note to backend");
      return null;
    }
  };

  useEffect(() => {
    if (audioUri && audioUri !== "mock") {
      const processCloudAudio = async () => {
        setIsProcessing(true);
        try {
          const aiData = await notesService.generateNotes(audioUri as string);
          const resultPayload = aiData.result;

          const rawTitle =
            resultPayload.match(/TITLE:\s*(.*)/i)?.[1]?.trim() ??
            "Lecture Record";
          const rawTopic =
            resultPayload.match(/TOPIC:\s*(.*)/i)?.[1]?.trim() ?? "General";
          const rawSummary =
            resultPayload
              .match(/SUMMARY:\s*([\s\S]*?)(?=TRANSCRIPT:|$)/i)?.[1]
              ?.trim() ?? "Summary failed to generate.";
          const rawTranscript =
            resultPayload
              .match(/TRANSCRIPT:\s*([\s\S]*?)(?=QUIZ:|$)/i)?.[1]
              ?.trim() ?? "Transcript failed to generate.";
          const rawQuiz =
            resultPayload.match(/QUIZ:\s*([\s\S]*)$/i)?.[1]?.trim() ??
            "Quiz failed to generate.";

          const computedWords = rawTranscript
            .replace(/\[\d{2}:\d{2}\]/g, "")
            .trim()
            .split(/\s+/)
            .filter((w: string) => w.length > 0).length;

          const numSecs = Number(duration);
          const formattedDuration =
            !isNaN(numSecs) && duration
              ? `${Math.floor(numSecs / 60)
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${(numSecs % 60).toString().padStart(2, "0")}`
              : note?.duration || "00:00";

          const processedNote = {
            ...note,
            title: rawTitle,
            topic: rawTopic,
            summary: rawSummary,
            transcript: rawTranscript,
            quiz: rawQuiz,
            wordCount: computedWords,
            duration: formattedDuration,
            status: "processed",
          };

          const savedNote = await saveNoteToBackend(processedNote);
          if (savedNote) {
            setNote({
              ...savedNote,
              date: new Date(savedNote.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
              }),
            });
          } else {
            setNote(processedNote);
          }
        } catch (error: any) {
          console.error("Analysis Error:", error);
          Alert.alert(
            "Analysis Failed",
            error.message || "An unexpected error occurred.",
          );
        } finally {
          setIsProcessing(false);
        }
      };

      processCloudAudio();
    } else if (id !== "new-note") {
      fetchNoteFromBackend();
    }
  }, [id, audioUri]);

  const handleShare = async () => {
    if (!note) return;
    const shareMessage = `${note.title.toUpperCase()}\n\nTOPIC: ${note.topic}\n\nSUMMARY:\n${note.summary}\n\nTRANSCRIPT:\n${note.transcript}`;
    await Share.share({
      title: note.title,
      message: shareMessage,
    });
  };

  const [isTranslating, setIsTranslating] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [translatingTo, setTranslatingTo] = useState("");

  const handleTranslate = async (lang: string) => {
    if (note.status && note.status !== "processed") {
      Alert.alert(
        t('noteNotReady'),
        t('noteNotReadyDesc')
      );
      return;
    }
    setIsTranslating(true);
    setTranslatingTo(lang);
    setShowLanguagePicker(false);

    try {
      const data = await notesService.translateNote(note.id, lang);

      setNote({
        ...data.translatedNote,
        date: new Date(
          data.translatedNote.updatedAt || data.translatedNote.createdAt,
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      });
      Alert.alert(
        t('translated'),
        t('translatedDesc').replace('{lang}', lang)
      );
    } catch (error: any) {
      Alert.alert("Translation Failed", error.message);
    } finally {
      setIsTranslating(false);
      setTranslatingTo("");
    }
  };

  const handleReset = async () => {
    if (!note || !note.id) return;
    try {
      setIsTranslating(true); // Re-use translating state for simple loading indicator
      const updatedNote = await notesService.resetNote(note.id);
      setNote(updatedNote);
    } catch (err: any) {
      Alert.alert("Reset Failed", err.message || "Note could not be reset.");
    } finally {
      setIsTranslating(false);
      Alert.alert("Success", t('resetSuccess'));
    }
  };

  const handleExportPDF = async () => {
    if (!note) return;
    try {
      const summaryHTML = marked.parse(note.summary);
      const transcriptHTML = marked.parse(note.transcript);

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
              h1 { color: #6C5CE7; margin-bottom: 5px; }
              .topic { color: #666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
              h2 { color: #2D3436; border-left: 4px solid #6C5CE7; padding-left: 12px; margin-top: 40px; font-size: 18px; }
              p { margin-bottom: 15px; }
              strong { color: #6C5CE7; }
              ul { padding-left: 20px; }
              li { margin-bottom: 5px; }
              .content-box { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee; margin-top: 10px; }
              .transcript-text { font-size: 13px; font-family: "Courier New", Courier, monospace; color: #444; }
            </style>
          </head>
          <body>
            <h1>${note.title}</h1>
            <div class="topic">LECTURE NOTES | ${note.date}</div>
            
            <h2>EXECUTIVE SUMMARY</h2>
            <div class="content-box summary">${summaryHTML}</div>
            
            <h2>LECTURE TRANSCRIPT</h2>
            <div class="content-box transcript-text">${transcriptHTML}</div>
            
            <p style="margin-top: 50px; text-align: center; font-size: 10px; color: #999;">Generated by AudioNote AI on ${new Date().toLocaleDateString()}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: "com.adobe.pdf",
        mimeType: "application/pdf",
        dialogTitle: "Save Note as PDF",
      });
    } catch (error) {
      console.error("PDF Fail:", error);
      Alert.alert(
        "PDF Export Failed",
        "Could not generate or save the PDF document.",
      );
    }
  };

  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPos, setPlaybackPos] = useState(0);
  const [playbackDur, setPlaybackDur] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const togglePlayback = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      return;
    }

    const uri = note?.audioUrl || audioUri;
    if (!audioUri && !note?.audioUrl) {
      Alert.alert(
        t('audioNotAvailable'),
        t('audioNotAvailableDesc')
      );
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.isPlaying || status.positionMillis > 0) {
              setPlaybackPos(status.positionMillis);
              setPlaybackDur(status.durationMillis || 0);
            }
          }
        },
      );
      // Ensure we get frequent updates for karaoke
      newSound.setProgressUpdateIntervalAsync(100);
      setSound(newSound);
    } catch (error) {
      Alert.alert("Playback Error", "Could not load audio file.");
    }
  };

  const handleExportText = async () => {
    if (!note) return;
    try {
      const fileName = `${note.title.replace(/\s+/g, "_")}_notes.txt`;
      const fileUri = `${ExpoFileSystem.documentDirectory}${fileName}`;
      const content = `${note.title}\nTopic: ${note.topic}\nDate: ${note.date}\nDuration: ${note.duration}\n\nSUMMARY\n-------\n${note.summary}\n\nTRANSCRIPT\n----------\n${note.transcript}`;

      await ExpoFileSystem.writeAsStringAsync(fileUri, content);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Export Error:", error);
      Alert.alert("Export Failed", "Failed to generate note file.");
    }
  };

  const handleSaveAudio = async () => {
    const uri = note?.audioUrl || audioUri;
    if (!uri || uri === "mock") {
      Alert.alert(
        "Not Found",
        "The original audio file for this note could not be located on this device.",
      );
      return;
    }

    try {
      const fileExists = await ExpoFileSystem.getInfoAsync(uri as string);
      if (!fileExists.exists) {
        Alert.alert(
          "Error",
          "The original audio file is no longer available on this device's storage.",
        );
        return;
      }

      await Sharing.shareAsync(uri as string, {
        mimeType: "audio/m4a",
        dialogTitle: "Save Audio Recording",
        UTI: "public.mpeg-4-audio",
      });
    } catch (error) {
      console.error("Save Audio Error:", error);
      Alert.alert("Failed", "Could not export audio file.");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to permanently delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await notesService.deleteNote(id as string);
              router.back();
            } catch (error: any) {
              console.error("Delete Error:", error);
              Alert.alert("Error", error.message || "An unexpected error occurred.");
            }
          },
        },
      ],
    );
  };

  const ActionButton = ({
    icon,
    label,
    onPress,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      className="flex-1 items-center gap-1.5 py-3 bg-surfaceElevated rounded-xl border border-surfaceBorder"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={icon} size={18} color={theme.accent} />
      <Text className="text-textSecondary text-[11px] font-medium">
        {label}
      </Text>
    </TouchableOpacity>
  );

  const containerPaddingTop = Platform.OS === "ios" ? "pt-3" : "pt-14";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      <Animated.View
        entering={FadeIn}
        className={`flex-row items-center px-4 pb-3 border-b border-surfaceBorder gap-2 ${containerPaddingTop}`}
      >
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl bg-surfaceElevated items-center justify-center"
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
        <Text
          className="flex-1 text-textPrimary text-[15px] font-semibold text-center"
          numberOfLines={1}
        >
          {note?.title ||
            (id === "new-note" ? "New Note" : "") ||
            "Lecture Note"}
        </Text>
        <TouchableOpacity
          className="w-[38px] h-[38px] rounded-xl bg-surfaceElevated items-center justify-center"
          onPress={handleShare}
          disabled={!note}
          style={{ opacity: note ? 1 : 0.5 }}
        >
          <MaterialIcons name="ios-share" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      {isProcessing || !note ? (
        <ScrollView className="flex-1">
          <View className="p-5">
             <Text className="text-textPrimary text-[16px] font-bold text-center mb-6">
                {audioUri ? t('analyzingLecture') : t('loadingNote')}
              </Text>
              <NoteSkeleton />
          </View>
        </ScrollView>
      ) : (
        <>
          {isTranslating && (
             <View className="absolute inset-0 bg-black/60 items-center justify-center z-[90] gap-4">
                <ActivityIndicator size="large" color={theme.accent} />
                <Text className="text-white text-lg font-bold">Converting to {translatingTo}...</Text>
                <Text className="text-white/60 text-sm">Gemini is translating your study guide</Text>
             </View>
          )}
          <NoteContent 
            note={note} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            summaryStyles={summaryStyles}
            transcriptStyles={transcriptStyles}
            theme={theme}
            scrollRef={scrollRef}
            handleScroll={handleScroll}
            handleShare={handleShare}
            handleExportPDF={handleExportPDF}
            handleExportText={handleExportText}
            handleSaveAudio={handleSaveAudio}
            handleDelete={handleDelete}
            handleReset={handleReset}
            setShowLanguagePicker={setShowLanguagePicker}
            isTranslating={isTranslating}
            playbackPos={playbackPos}
            isKaraokeEnabled={isKaraokeEnabled}
            setIsKaraokeEnabled={setIsKaraokeEnabled}
          />

          {/* Persistent Audio Player - ONLY SHOW IN TRANSCRIPT TAB */}
          {note && activeTab === "transcript" && (
            <FloatingAudioPlayer
              isPlaying={isPlaying}
              playbackPos={playbackPos}
              playbackDur={playbackDur}
              onToggle={togglePlayback}
              theme={theme}
              onSeek={(pos: number) => {
                if (sound) sound.setPositionAsync(pos);
              }}
              onSkip={(offset: number) => {
                if (sound) {
                    const newPos = Math.max(0, Math.min(playbackDur, playbackPos + offset));
                    sound.setPositionAsync(newPos);
                }
              }}
            />
          )}
        </>
      )}

      <LanguageModal
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelect={handleTranslate}
      />

      {showScrollTop && (
        <Animated.View
          entering={FadeInDown.springify()}
          exiting={FadeInDown.springify()}
          className="absolute bottom-10 right-6 z-50"
        >
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-accent items-center justify-center shadow-lg shadow-accent/40"
            onPress={scrollToTop}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="arrow-upward"
              size={24}
              color={theme.background}
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const ActionButton = React.memo(({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center gap-2 bg-surfaceElevated border border-surfaceBorder px-4 py-2.5 rounded-xl min-w-[100px] justify-center"
      activeOpacity={0.7}
    >
      <MaterialIcons name={icon as any} size={18} color={theme.accentLight} />
      <Text className="text-textPrimary text-[13px] font-bold">{t(label.toLowerCase())}</Text>
    </TouchableOpacity>
  );
});

const FloatingAudioPlayer = React.memo(({ isPlaying, playbackPos, playbackDur, onToggle, onSeek, onSkip, theme }: any) => {
    const progressBarRef = useRef<View>(null);
    const [barWidth, setBarWidth] = useState(0);

    const handleProgressPress = (e: any) => {
        if (barWidth > 0) {
            const touchX = e.nativeEvent.locationX;
            const newPos = (touchX / barWidth) * playbackDur;
            onSeek(newPos);
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeInDown.springify()}
            className="absolute bottom-24 left-5 right-5 bg-surfaceElevated border border-surfaceBorder rounded-3xl p-5 shadow-2xl gap-4"
        >
            <View className="flex-row items-center justify-between gap-4">
                <TouchableOpacity
                    onPress={() => onSkip(-10000)}
                    className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-surfaceBorder"
                >
                    <MaterialIcons name="replay-10" size={20} color={theme.textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onToggle}
                    className="w-14 h-14 rounded-full bg-accent items-center justify-center shadow-lg shadow-accent/40"
                >
                    <MaterialIcons
                        name={isPlaying ? "pause" : "play-arrow"}
                        size={32}
                        color={theme.background}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onSkip(10000)}
                    className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-surfaceBorder"
                >
                    <MaterialIcons name="forward-10" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>

            <View className="w-full">
                <View className="flex-row justify-between mb-2 px-1">
                    <Text className="text-[10px] font-bold text-accent">
                        {Math.floor(playbackPos / 60000)}:
                        {(Math.floor(playbackPos / 1000) % 60).toString().padStart(2, "0")}
                    </Text>
                    <Text className="text-[10px] font-bold text-textMuted uppercase tracking-widest">
                        Playback Status
                    </Text>
                    <Text className="text-[10px] font-bold text-textMuted">
                        {Math.floor(playbackDur / 60000)}:
                        {(Math.floor(playbackDur / 1000) % 60).toString().padStart(2, "0")}
                    </Text>
                </View>

                {/* Scrub Bar */}
                <TouchableOpacity 
                    activeOpacity={1}
                    onPress={handleProgressPress}
                    onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                    className="h-3 w-full bg-surface rounded-full overflow-hidden border border-surfaceBorder shadow-inner"
                >
                     <View
                        className="h-full bg-accent"
                        style={{
                            width: `${(playbackPos / (playbackDur || 1)) * 100}%`,
                        }}
                    />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
});

const KaraokeTranscript = React.memo(({ transcript, playbackPos, theme, transcriptStyles, isEnabled, mainScrollRef }: any) => {
    const layoutPositions = useRef<Record<number, number>>({});

    // Parse: [MM:SS] Text...
    const segments = React.useMemo(() => {
        // ... same logic as before
        const regex = /\[(\d{2}):(\d{2})\]/g;
        const matches = Array.from(transcript.matchAll(regex)) as any[];
        
        if (matches.length === 0) return [{ time: 0, text: transcript }];
        
        const results = [];
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const start = match.index + match[0].length;
            const nextMatch = matches[i + 1];
            const end = nextMatch ? nextMatch.index : transcript.length;
            
            const mins = parseInt(match[1]);
            const secs = parseInt(match[2]);
            const timeMs = (mins * 60 + secs) * 1000;
            
            results.push({
                time: timeMs,
                text: transcript.substring(start, end).trim()
            });
        }
        return results;
    }, [transcript]);

    const activeIndex = segments.findIndex((s: any, i: number) => {
        const next = segments[i + 1];
        return playbackPos >= s.time && (!next || playbackPos < next.time);
    });

    // Auto-scroll logic
    useEffect(() => {
        if (isEnabled && activeIndex !== -1 && mainScrollRef?.current && layoutPositions.current[activeIndex] !== undefined) {
             mainScrollRef.current.scrollTo({
                y: layoutPositions.current[activeIndex] + 250, // Offset for the header and stats
                animated: true
            });
        }
    }, [activeIndex, isEnabled]);

    return (
        <View className="gap-2">
            {segments.map((segment: any, idx: number) => {
                const isActive = isEnabled && idx === activeIndex;
                return (
                    <View 
                        key={idx}
                        onLayout={(event) => {
                            layoutPositions.current[idx] = event.nativeEvent.layout.y;
                        }}
                        style={{
                            padding: 12,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: isActive ? theme.accent : 'transparent',
                            backgroundColor: isActive ? `${theme.accent}15` : 'transparent',
                            marginBottom: 8,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                             <Text 
                                style={{ 
                                    fontSize: 10, 
                                    fontWeight: 'bold', 
                                    color: isActive ? theme.accent : theme.textMuted 
                                }}
                            >
                                {Math.floor(segment.time / 60000)}:
                                {(Math.floor(segment.time / 1000) % 60).toString().padStart(2, '0')}
                            </Text>
                            {isActive && (
                                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent }} />
                            )}
                        </View>
                        <Text style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: isActive ? theme.textPrimary : theme.textSecondary,
                            fontWeight: isActive ? '600' : '400'
                        }}>
                            {segment.text}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
});

const NoteContent = React.memo(({ 
    note, 
    activeTab, 
    setActiveTab, 
    summaryStyles, 
    transcriptStyles, 
    theme,
    scrollRef,
    handleScroll,
    handleShare,
    handleExportPDF,
    handleExportText,
    handleSaveAudio,
    handleDelete,
    handleReset,
    setShowLanguagePicker,
    isTranslating,
    playbackPos,
    isKaraokeEnabled,
    setIsKaraokeEnabled
}: any) => {
    const { t } = useTranslation();
    return (
        <ScrollView
            ref={scrollRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            className="flex-1"
            contentContainerStyle={{
              padding: 20,
              gap: 14,
              paddingBottom: activeTab === "transcript" ? 220 : 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === "transcript" && (
                <TouchableOpacity 
                    onPress={() => setIsKaraokeEnabled(!isKaraokeEnabled)}
                    className="flex-row items-center justify-between bg-surfaceElevated border border-surfaceBorder px-4 py-3 rounded-2xl mb-2"
                >
                    <View className="flex-row items-center gap-3">
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${isKaraokeEnabled ? 'bg-accent' : 'bg-surface'}`}>
                            <MaterialIcons 
                                name={isKaraokeEnabled ? "sync" : "sync-disabled"} 
                                size={18} 
                                color={isKaraokeEnabled ? theme.background : theme.textMuted} 
                            />
                        </View>
                        <View>
                            <Text className="text-textPrimary font-bold text-[14px]">
                                {isKaraokeEnabled ? t('autoSyncActive') : t('manualScrolling')}
                            </Text>
                            <Text className="text-textMuted text-[10px]">
                                {isKaraokeEnabled ? t('scrollingFollows') : t('tapToEnable')}
                            </Text>
                        </View>
                    </View>
                    <View className={`w-10 h-5 rounded-full px-1 justify-center ${isKaraokeEnabled ? 'bg-accent' : 'bg-surfaceBorder'}`}>
                        <View className={`w-3.5 h-3.5 rounded-full bg-white ${isKaraokeEnabled ? 'self-end' : 'self-start'}`} />
                    </View>
                </TouchableOpacity>
            )}
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              className="bg-surfaceElevated rounded-2xl p-5 border border-surfaceBorder gap-1.5"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="w-11 h-11 rounded-xl bg-accentGlow items-center justify-center">
                  <MaterialIcons name="mic" size={24} color={theme.accent} />
                </View>
                <View className="items-end gap-1">
                  <View
                    className="flex-row items-center gap-1 rounded-lg px-2 py-1"
                    style={{ backgroundColor: `${theme.success}20` }}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={12}
                      color={theme.success}
                    />
                    <Text className="text-[11px] font-semibold text-success">
                      {t('processed')}
                    </Text>
                  </View>
                  <Text className="text-textMuted text-[11px]">
                    {note.date}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-textPrimary tracking-tight leading-8">
                {note.title}
              </Text>
              <View className="flex-row items-center gap-1.5 self-start bg-accentGlow px-2.5 py-1 rounded-lg mt-2">
                <MaterialIcons
                  name="label"
                  size={13}
                  color={theme.accentLight}
                />
                <Text className="text-accentLight text-[11px] font-semibold">
                  {note.topic}
                </Text>
              </View>

              <View className="flex-row mt-3.5 border-t border-surfaceBorder pt-3.5 justify-around">
                {[
                  {
                    icon: "access-time",
                    value: note.duration,
                    label: t('duration'),
                  },
                  {
                    icon: "text-fields",
                    value: `${note.wordCount.toLocaleString()}`,
                    label: t('words'),
                  },
                  { icon: "auto-awesome", value: "Flash 2.5", label: t('model') },
                ].map((stat) => (
                  <View key={stat.label} className="items-center gap-1">
                    <MaterialIcons
                      name={stat.icon as any}
                      size={14}
                      color={theme.accent}
                    />
                    <Text className="text-textPrimary text-[15px] font-bold">
                      {stat.value}
                    </Text>
                    <Text className="text-textMuted text-[11px]">
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(120).springify()}
              className="flex-row gap-2 flex-wrap justify-between"
            >
              <ActionButton icon="share" label={t('share')} onPress={handleShare} />
              <ActionButton
                icon="picture-as-pdf"
                label={t('saveAsPDF')}
                onPress={handleExportPDF}
              />
              <ActionButton
                icon={isTranslating ? "sync" : "translate"}
                label={t('translate')}
                onPress={() => setShowLanguagePicker(true)}
              />
              <ActionButton
                icon="article"
                label={t('saveAsText')}
                onPress={handleExportText}
              />
              <ActionButton
                icon="music-note"
                label={t('saveAudio')}
                onPress={handleSaveAudio}
              />
              <ActionButton
                icon="history"
                label={t('reset')}
                onPress={handleReset}
              />
              <ActionButton
                icon="delete-outline"
                label={t('delete')}
                onPress={handleDelete}
              />
            </Animated.View>

            <View className="flex-row items-center bg-surfaceElevated rounded-2xl p-1.5 border border-surfaceBorder mt-6">
              {(["summary", "transcript", "quiz"] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl gap-2 ${
                    activeTab === tab ? "bg-accentGlow" : ""
                  }`}
                >
                  <MaterialIcons
                    name={
                      tab === "summary"
                        ? "description"
                        : tab === "transcript"
                          ? "article"
                          : "quiz"
                    }
                    size={18}
                    color={activeTab === tab ? theme.accent : theme.textMuted}
                  />
                  <Text
                    className={`text-[13px] font-bold capitalize ${
                      activeTab === tab ? "text-accent" : "text-textMuted"
                    }`}
                  >
                    {t(tab)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Animated.View
              key={activeTab}
              entering={FadeInDown.springify()}
              className="mt-6"
            >
              <View className="bg-surfaceElevated rounded-2xl p-[18px] border border-surfaceBorder">
                {activeTab === "summary" && (
                  <Markdown style={summaryStyles}>{note.summary}</Markdown>
                )}
                {activeTab === "transcript" && (
                  <KaraokeTranscript 
                    transcript={note.transcript} 
                    playbackPos={playbackPos} 
                    theme={theme}
                    transcriptStyles={transcriptStyles}
                    isEnabled={isKaraokeEnabled}
                    mainScrollRef={scrollRef}
                  />
                )}
                {activeTab === "quiz" && (
                  <InteractiveQuiz rawQuiz={note.quiz} theme={theme} />
                )}
              </View>
            </Animated.View>
        </ScrollView>
    );
});

function InteractiveQuiz({ rawQuiz, theme }: { rawQuiz: string; theme: any }) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parse questions from raw string
  const parseQuiz = (raw: string): QuizItem[] => {
    if (!raw) return [];
    try {
      const qs = raw.split(/Q:/i).filter((s) => s.trim().length > 0);
      return qs.map((qStr) => {
        const questionMatch = qStr.match(/([\s\S]*?)(?=[A-D]:)/i);
        const question = questionMatch
          ? questionMatch[1].trim()
          : "Unknown Question";

        const options = ["A", "B", "C", "D"].map((opt) => {
          const optMatch = qStr.match(
            new RegExp(
              `${opt}:\\s*([\\s\\S]*?)(?=${opt === "D" ? "CORRECT:" : "[B-D]:"})`,
              "i",
            ),
          );
          return { label: opt, text: optMatch ? optMatch[1].trim() : "" };
        });

        const correctMatch = qStr.match(/CORRECT:\s*([A-D])/i);
        const correctAnswer = correctMatch ? correctMatch[1].trim() : "A";

        return { question, options, correctAnswer };
      });
    } catch (e) {
      console.error("Quiz Parse Error:", e);
      return [];
    }
  };

  const quizItems = parseQuiz(rawQuiz);
  const score = quizItems.reduce((acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0), 0);
  const percentage = (score / (quizItems.length || 1)) * 100;

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  if (!quizItems.length) {
    return (
      <Text className="text-textMuted italic">
        *Quiz format not supported for this note.*
      </Text>
    );
  }

  return (
    <View className="gap-8">

      {quizItems.map((item, idx) => (
        <View key={idx} className="gap-4">
          <Text className="text-textPrimary font-bold text-base leading-6">
            {idx + 1}. {item.question}
          </Text>
          <View className="gap-2.5">
            {item.options.map((opt) => {
              const isSelected = answers[idx] === opt.label;
              const isCorrect = isSubmitted && opt.label === item.correctAnswer;
              const isWrong =
                isSubmitted && isSelected && opt.label !== item.correctAnswer;

              let bgColor = "bg-surfaceElevated";
              let borderColor = "border-surfaceBorder";
              if (isSelected) {
                bgColor = "bg-accent";
                borderColor = "border-accent";
              }
              if (isCorrect) {
                bgColor = "bg-success/15";
                borderColor = "border-success/50";
              }
              if (isWrong) {
                bgColor = "bg-error/15";
                borderColor = "border-error/50";
              }

              return (
                <TouchableOpacity
                  key={opt.label}
                  disabled={isSubmitted}
                  onPress={() => setAnswers({ ...answers, [idx]: opt.label })}
                  className={`flex-row items-center border rounded-2xl p-4 ${bgColor} ${borderColor} gap-3`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? "border-accent bg-accent" : "border-surfaceBorder"}`}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={14} color="#FFF" />
                    )}
                  </View>
                  <Text
                    className={`flex-1 text-[14px] ${isSelected ? "text-white font-bold" : "text-textSecondary font-medium"}`}
                  >
                    {opt.label}. {opt.text}
                  </Text>
                  {isCorrect && (
                    <MaterialIcons
                      name="done-all"
                      size={20}
                      color={theme.success}
                    />
                  )}
                  {isWrong && (
                    <MaterialIcons name="close" size={20} color={theme.error} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {!isSubmitted && (
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-accent rounded-2xl py-4 items-center shadow-lg shadow-accent/40 mt-4"
        >
          <Text className="text-white font-bold text-base">{t('submitQuiz')}</Text>
        </TouchableOpacity>
      )}

      {isSubmitted && (
        <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            className="p-6 rounded-3xl border-2 items-center gap-4 overflow-hidden"
            style={{ 
                backgroundColor: theme.surfaceElevated, 
                borderColor: `${theme.accent}30` 
            }}
        >
          {/* Background Glow Effect */}
          <View 
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" 
            style={{ backgroundColor: theme.accent }} 
          />
          
          <View 
            className="w-20 h-20 rounded-full items-center justify-center shadow-2xl" 
            style={{ backgroundColor: theme.accent }}
          >
            <MaterialIcons 
                name={percentage >= 80 ? "emoji-events" : percentage >= 50 ? "grade" : "psychology"} 
                size={40} 
                color={theme.background} 
            />
          </View>
          
          <View className="items-center">
            <Text 
                className="text-[36px] font-extrabold tracking-tighter" 
                style={{ color: theme.accent }}
            >
                {score} / {quizItems.length}
            </Text>
            <Text 
                className="text-[12px] font-bold tracking-widest uppercase mt-0.5" 
                style={{ color: theme.textMuted }}
            >
                {percentage >= 80 ? "EXCELLENT WORK!" : percentage >= 50 ? "GOOD PROGRESS" : "KEEP STUDYING"} • {Math.round(percentage)}%
            </Text>
          </View>
          
          <View 
            className="w-full h-2 rounded-full overflow-hidden mt-2" 
            style={{ backgroundColor: theme.surface }}
          >
            <View 
                className="h-full" 
                style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: theme.accent 
                }} 
            />
          </View>

          <TouchableOpacity
            onPress={() => {
              setIsSubmitted(false);
              setAnswers({});
            }}
            className="mt-3 px-10 py-3.5 rounded-2xl border"
            activeOpacity={0.7}
            style={{ 
                backgroundColor: `${theme.accent}15`, 
                borderColor: `${theme.accent}30` 
            }}
          >
            <Text className="font-bold text-[15px]" style={{ color: theme.accent }}>{t('practiceAgain')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function LanguageModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (lang: string) => void;
}) {
  const { t, language } = useTranslation();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-surfaceElevated rounded-t-3xl p-6 pb-12">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-text dark:text-white">
              {t('chooseLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView className="max-h-[400px]">
            <View className="flex-row flex-wrap gap-3">
              {LANGUAGES.filter(l => l.value !== language).map((lang) => (
                <TouchableOpacity
                  key={lang.value}
                  onPress={() => onSelect(lang.value)}
                  className="bg-accent px-5 py-3 rounded-2xl shadow-sm border border-accentLight/20"
                >
                  <Text className="text-white font-bold">{lang.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
