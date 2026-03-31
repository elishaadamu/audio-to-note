import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

export interface NoteItem {
  id: string;
  title: string;
  date: string;
  duration: string;
  topic: string;
  summary: string;
  wordCount: number;
  status: 'processed' | 'processing' | 'failed';
}

interface NoteCardProps {
  note: NoteItem;
  onPress: () => void;
  onLongPress?: () => void;
}

import { useTranslation } from '@/hooks/useTranslation';

export default function NoteCard({ note, onPress, onLongPress }: NoteCardProps) {
  const { t } = useTranslation();
  
  const statusConfig = {
    processed: { color: Colors.success, label: t('done'), icon: 'check-circle' as const },
    processing: { color: Colors.warning, label: t('processing'), icon: 'hourglass-empty' as const },
    failed: { color: Colors.danger, label: t('failed'), icon: 'error' as const },
  };

  const status = statusConfig[note.status];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress}
      activeOpacity={0.82} 
      className="bg-surfaceElevated rounded-2xl p-4 border border-surfaceBorder mb-3 gap-2.5"
    >
      {/* Header row */}
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-xl bg-accentGlow items-center justify-center">
          <MaterialIcons name="mic" size={18} color={Colors.accent} />
        </View>
        <View className="flex-1">
          <Text className="text-textPrimary text-[15px] font-semibold tracking-tight" numberOfLines={1}>{note.title}</Text>
          <Text className="text-textMuted text-[11px] mt-px">{note.date}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      </View>

      {/* Preview */}
      <Text className="text-textSecondary text-[13px] leading-relaxed" numberOfLines={2}>{note.summary}</Text>

      {/* Footer */}
      <View className="flex-row items-center justify-between flex-wrap gap-1.5">
        <View className="flex-row items-center gap-1 bg-accentGlow px-2 py-1 rounded-md">
          <MaterialIcons name="label" size={11} color={Colors.accent} />
          <Text className="text-accentLight text-[11px] font-medium">{note.topic}</Text>
        </View>

        <View className="flex-row gap-1.5 items-center">
          <View className="flex-row items-center gap-1 bg-surface px-2 py-1 rounded-md">
            <MaterialIcons name="access-time" size={11} color={Colors.textMuted} />
            <Text className="text-textMuted text-[11px] font-medium">{note.duration}</Text>
          </View>

          <View className="flex-row items-center gap-1 bg-surface px-2 py-1 rounded-md">
            <MaterialIcons name="text-fields" size={11} color={Colors.textMuted} />
            <Text className="text-textMuted text-[11px] font-medium">{note.wordCount.toLocaleString()}{t('word_shortcut')}</Text>
          </View>

          <View className="flex-row items-center gap-1 px-2 py-1 rounded-md" style={{ backgroundColor: `${status.color}18` }}>
            <MaterialIcons name={status.icon} size={11} color={status.color} />
            <Text className="text-[11px] font-medium" style={{ color: status.color }}>{status.label}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
