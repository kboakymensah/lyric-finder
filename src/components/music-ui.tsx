import { Image } from 'expo-image';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const musicColors = {
  background: '#050505',
  surface: '#161613',
  surfaceRaised: '#1D1C18',
  border: '#343124',
  gold: '#F7C948',
  text: '#FFFDF7',
  muted: '#AAA69C',
  darkText: '#14120C',
} as const;

export const musicSpacing = { screen: 20, section: 28, item: 12 } as const;
export const screenContentBottomInset = 172;
export const bottomNavigationMinimumHeight = 68;

type ArtworkTileProps = {
  artworkUrl: string | null;
  title: string;
  size?: number;
  rounded?: number;
};

export function ArtworkTile({ artworkUrl, title, size = 64, rounded = 12 }: ArtworkTileProps) {
  const style = { borderRadius: rounded, height: size, width: size };

  if (artworkUrl) {
    return <Image source={{ uri: artworkUrl }} style={[styles.artwork, style]} accessibilityLabel={`${title} artwork`} />;
  }

  return <View style={[styles.artworkFallback, style]} accessibilityLabel={`${title} artwork unavailable`}><Text style={styles.note}>♫</Text></View>;
}

type ScreenContainerProps = PropsWithChildren<{ testID?: string }>;

export function ScreenContainer({ children, testID = 'screen-content' }: ScreenContainerProps) {
  return <ScrollView testID={testID} contentContainerStyle={styles.screenContent} style={styles.screen}>{children}</ScrollView>;
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

type CompactSongRowProps = {
  artworkUrl: string | null;
  title: string;
  artist: string;
  onPress?: () => void;
  trailing?: ReactNode;
};

export function CompactSongRow({ artworkUrl, title, artist, onPress, trailing }: CompactSongRowProps) {
  const content = <>
    <ArtworkTile artworkUrl={artworkUrl} title={title} size={52} rounded={9} />
    <View style={styles.songCopy}><Text numberOfLines={1} style={styles.songTitle}>{title}</Text><Text numberOfLines={1} style={styles.songArtist}>{artist}</Text></View>
    {trailing}
  </>;

  if (!onPress) return <View style={styles.songRow}>{content}</View>;

  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title} by ${artist}`} onPress={onPress} style={styles.songRow}>{content}</Pressable>;
}

type MediaCardProps = {
  artworkUrl: string | null;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export function MediaCard({ artworkUrl, title, subtitle, onPress }: MediaCardProps) {
  const content = <><ArtworkTile artworkUrl={artworkUrl} title={title} size={124} rounded={14} /><Text numberOfLines={1} style={styles.cardTitle}>{title}</Text><Text numberOfLines={1} style={styles.cardSubtitle}>{subtitle}</Text></>;
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title}`} onPress={onPress} style={styles.mediaCard}>{content}</Pressable> : <View style={styles.mediaCard}>{content}</View>;
}

export function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{actionLabel && onAction ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable> : null}</View>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <View style={styles.emptyState}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyMessage}>{message}</Text></View>;
}

export function GoldButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.goldButton, disabled && styles.goldButtonDisabled]}><Text style={styles.goldButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: musicColors.background, flex: 1 },
  screenContent: { gap: musicSpacing.item, paddingBottom: screenContentBottomInset, paddingHorizontal: musicSpacing.screen, paddingTop: 20 },
  artwork: { backgroundColor: musicColors.surfaceRaised },
  artworkFallback: { alignItems: 'center', backgroundColor: musicColors.gold, justifyContent: 'center' },
  note: { color: musicColors.darkText, fontSize: 25, fontWeight: '900' },
  eyebrow: { color: musicColors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 1.45, textTransform: 'uppercase' },
  songRow: { alignItems: 'center', borderBottomColor: musicColors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, minHeight: 70, paddingVertical: 9 },
  songCopy: { flex: 1, gap: 2 },
  songTitle: { color: musicColors.text, fontSize: 16, fontWeight: '800' },
  songArtist: { color: musicColors.muted, fontSize: 13 },
  mediaCard: { gap: 6, width: 124 },
  cardTitle: { color: musicColors.text, fontSize: 14, fontWeight: '800' },
  cardSubtitle: { color: musicColors.muted, fontSize: 12 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  sectionTitle: { color: musicColors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  sectionAction: { color: musicColors.gold, fontSize: 13, fontWeight: '800' },
  emptyState: { backgroundColor: musicColors.surface, borderColor: musicColors.border, borderRadius: 18, borderWidth: 1, gap: 6, padding: 20 },
  emptyTitle: { color: musicColors.text, fontSize: 17, fontWeight: '800' },
  emptyMessage: { color: musicColors.muted, fontSize: 14, lineHeight: 20 },
  goldButton: { alignItems: 'center', backgroundColor: musicColors.gold, borderRadius: 999, justifyContent: 'center', minHeight: 54, paddingHorizontal: 18 },
  goldButtonDisabled: { opacity: 0.45 },
  goldButtonText: { color: musicColors.darkText, fontSize: 16, fontWeight: '900' },
});
