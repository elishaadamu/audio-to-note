import React, { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import NoteCard, { NoteItem } from '@/components/NoteCard';
import { RefreshControl } from 'react-native';
import { notesService } from '@/services/notesService';
import { ListSkeleton } from '@/components/SkeletonLoader';
import { getAuthToken } from '@/services/apiClient';

import { useTranslation } from '@/hooks/useTranslation';

const FILTERS = ['All', 'Today', 'This Week', 'Processed', 'Processing'];

export default function NotesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotes = async (refreshing = false) => {
    if (!refreshing) setIsLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const data = await notesService.fetchNotes();
      
      const transformedNotes: NoteItem[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        date: new Date(n.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).replace(', ', ', '),
        duration: n.duration,
        topic: n.topic,
        summary: n.summary,
        wordCount: n.wordCount,
        status: 'processed'
      }));

      setNotes(transformedNotes);
    } catch (error: any) {
      console.error('Fetch notes error:', error);
      if (error.message.includes('401')) {
          router.replace('/(auth)/login');
      } else {
        Alert.alert('Fetch Error', `Could not load notes: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotes(true);
  };

  const filtered = notes.filter(n => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.topic.toLowerCase().includes(search.toLowerCase()) ||
      n.summary.toLowerCase().includes(search.toLowerCase());

    let matchFilter = true;
    if (activeFilter === 'Today') matchFilter = n.date.startsWith(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    if (activeFilter === 'Processed') matchFilter = n.status === 'processed';
    if (activeFilter === 'Processing') matchFilter = n.status === 'processing';

    return matchSearch && matchFilter;
  });

  const handleNotePress = (note: NoteItem) => {
    router.push({ pathname: '/note/[id]', params: { id: note.id, title: note.title } } as any);
  };

  const handleLongPressNote = (note: NoteItem) => {
    Alert.alert(
      t('deleteNote'),
      t('deleteNoteConfirm'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('delete'), 
          style: "destructive", 
          onPress: () => deleteNote(note.id) 
        }
      ]
    );
  };

  const deleteNote = async (id: string) => {
    try {
      await notesService.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error: any) {
      console.error("Delete note error:", error);
      Alert.alert("Error", error.message || "Could not delete note.");
    }
  };

  const containerPaddingTop = Platform.OS === 'ios' ? 'pt-4' : 'pt-16';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View className={`px-6 ${containerPaddingTop} pb-3 gap-3.5`}>
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text className="text-[30px] font-extrabold text-textPrimary tracking-tight">{t('notes')}</Text>
          <Text className="text-[13px] text-textMuted mt-1">{notes.length} {t('lecturesCaptured')}</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row items-center bg-surfaceElevated rounded-[14px] border border-surfaceBorder px-3.5 py-2.5 gap-2.5">
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            className="flex-1 text-textPrimary text-[15px] p-0"
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchLectures')}
            placeholderTextColor={Colors.textPlaceholder}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter chips */}
        <Animated.ScrollView
          entering={FadeInDown.delay(150).springify()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              className={`px-3.5 py-1.5 rounded-full border ${activeFilter === f ? 'bg-accent border-accent' : 'bg-surfaceElevated border-surfaceBorder'}`}
              onPress={() => setActiveFilter(f)}
            >
              <Text className={`text-[13px] ${activeFilter === f ? 'text-textPrimary font-semibold' : 'text-textMuted font-medium'}`}>
                {t(f.toLowerCase().replace(' ', ''))}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>
      </View>

      {/* List */}
      {isLoading && !isRefreshing ? (
         <View className="flex-1">
           <ListSkeleton />
         </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
          ListEmptyComponent={
            <View className="items-center pt-16 gap-2.5">
              <MaterialIcons name="inbox" size={48} color={Colors.textPlaceholder} />
              <Text className="text-[17px] font-semibold text-textSecondary">{t('noNotesFound')}</Text>
              <Text className="text-[13px] text-textMuted text-center">{t('tryAdjusting')}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
              <NoteCard 
                note={item} 
                onPress={() => handleNotePress(item)} 
                onLongPress={() => handleLongPressNote(item)}
              />
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
