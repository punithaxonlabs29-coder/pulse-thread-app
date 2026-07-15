import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = 'image' | 'video' | 'doc';
type Tab = 'media' | 'docs' | 'links';

interface MediaItem {
  id: string;
  messageId: string;
  name: string;
  type: MediaType;
  uri?: string;          // for image / video thumbnails
  duration?: string;     // e.g. "0:32" for videos
  fileName?: string;     // for docs
  fileSize?: string;     // e.g. "1.2 MB"
  fileExt?: string;      // PDF, DOCX, XLSX …
  senderName?: string;
  createdAt: string;     // ISO string
  caption?: string;
}

interface LinkItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  senderName: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');
const CELL = (width - 4) / 3;   // 3-column grid with 2px gaps

function groupByPeriod<T extends { createdAt: string }>(items: T[]) {
  const now = new Date();
  const recentCut = new Date(now); recentCut.setDate(now.getDate() - 7);
  const monthCut  = new Date(now); monthCut.setMonth(now.getMonth() - 1);

  const recent: T[] = [], lastMonth: T[] = [], older: T[] = [];
  for (const item of items) {
    const d = new Date(item.createdAt);
    if (d >= recentCut)      recent.push(item);
    else if (d >= monthCut)  lastMonth.push(item);
    else                     older.push(item);
  }
  return { recent, lastMonth, older };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── File-type colours & icons ────────────────────────────────────────────────

const EXT_CONFIG: Record<string, { color: string; icon: string }> = {
  PDF:  { color: '#E53935', icon: 'file-pdf-box' },
  DOCX: { color: '#1565C0', icon: 'file-word-box' },
  DOC:  { color: '#1565C0', icon: 'file-word-box' },
  XLSX: { color: '#2E7D32', icon: 'file-excel-box' },
  XLS:  { color: '#2E7D32', icon: 'file-excel-box' },
  PPTX: { color: '#E65100', icon: 'file-powerpoint-box' },
  ZIP:  { color: '#6A1B9A', icon: 'folder-zip' },
};

function extConfig(ext = '') {
  return EXT_CONFIG[ext.toUpperCase()] ?? { color: '#607D8B', icon: 'file-outline' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

import { Image } from 'expo-image';
import { MediaCacheManager } from '../services/MediaCacheManager';

function MediaThumbnail({ item }: { item: MediaItem }) {
  const [url, setUrl] = useState<string | null>(item.uri || null);

  React.useEffect(() => {
    let isMounted = true;
    
    const resolveThumbnail = async () => {
      // 1. Check cache first (contains generated video thumbnails or cached images)
      const state = await MediaCacheManager.getMediaState(item.messageId);
      if (state?.thumbnail_uri) {
        if (isMounted) setUrl(state.thumbnail_uri);
        return;
      }
      
      if (state?.local_uri && item.type === 'image') {
         if (isMounted) setUrl(state.local_uri);
         return;
      }

      // 2. If no cache and it's a video without a URI, we can't easily generate one without downloading.
      // 3. For images/videos with missing URLs, try the API
      if (!url) {
        try {
          const { ConnectsService } = require('../services/connects.service');
          const attachments = await ConnectsService.getMessageAttachment(item.messageId);
          if (!isMounted) return;
          if (attachments && attachments.length > 0) {
             const att = attachments.find((a: any) => a.name === item.name) || attachments[0];
             const remoteUrl = att?.url || att?.file_url;
             if (remoteUrl) {
               // If it's a video, a remote URL won't render in <Image>.
               // But at least we fetched it. If image, it will render.
               setUrl(remoteUrl);
             }
          }
        } catch (err) {
          console.log("Failed to load media url", err);
        }
      }
    };
    
    resolveThumbnail();
    return () => { isMounted = false; };
  }, [item.messageId, item.name, item.type, url]);

  return (
    <>
      {url && (item.type === 'image' || url.startsWith('file://')) ? (
        <Image source={{ uri: url }} style={s.cellImage} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[s.cellImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name={item.type === 'video' ? 'videocam-outline' : 'image-outline'} size={24} color="#9CA3AF" />
        </View>
      )}
      {item.type === 'video' && (
        <>
          <View style={s.playCircle}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
          {!!item.duration && (
            <View style={s.durationBadge}>
              <Text style={s.durationText}>{item.duration}</Text>
            </View>
          )}
        </>
      )}
    </>
  );
}

function MediaCell({ item }: { item: MediaItem }) {
  if (item.type === 'doc') {
    const cfg = extConfig(item.fileExt);
    return (
      <TouchableOpacity style={[s.cell, s.docCell]} activeOpacity={0.85}>
        <View style={s.docPreview}>
          <View style={[s.docIconBig, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={36} color={cfg.color} />
          </View>
          <Text style={s.docCellName} numberOfLines={2}>{item.fileName}</Text>
        </View>
        <View style={[s.docCellFooter, { borderTopColor: cfg.color + '30' }]}>
          <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
          <View style={{ marginLeft: 6 }}>
            <Text style={s.docCellFileName} numberOfLines={1}>{item.fileName}</Text>
            <Text style={s.docCellMeta}>{item.fileSize} • {item.fileExt}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.cell} activeOpacity={0.85}>
      <MediaThumbnail item={item} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={s.sectionLabel}>{title}</Text>;
}

function Grid({ items }: { items: MediaItem[] }) {
  const rows: MediaItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
  return (
    <View style={s.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.gridRow}>
          {row.map(item => <MediaCell key={item.id} item={item} />)}
          {/* fill empty slots so partial rows stay left-aligned */}
          {row.length === 2 && <View style={[s.cell, { backgroundColor: 'transparent' }]} />}
          {row.length === 1 && <>
            <View style={[s.cell, { backgroundColor: 'transparent' }]} />
            <View style={[s.cell, { backgroundColor: 'transparent' }]} />
          </>}
        </View>
      ))}
    </View>
  );
}

function DocRow({ item }: { item: MediaItem }) {
  const cfg = extConfig(item.fileExt);
  return (
    <TouchableOpacity style={s.docRow} activeOpacity={0.7}>
      <MaterialCommunityIcons name={cfg.icon as any} size={36} color={cfg.color} />
      <View style={s.docRowInfo}>
        <Text style={s.docRowName}>{item.fileName}</Text>
        <Text style={s.docRowMeta}>{item.fileSize} • {item.fileExt}</Text>
      </View>
      <Text style={s.docRowDate}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

function LinkRow({ item }: { item: LinkItem }) {
  return (
    <TouchableOpacity style={s.linkRow} activeOpacity={0.7}>
      <View style={s.linkIcon}>
        <Ionicons name="link" size={20} color="#F97316" />
      </View>
      <View style={s.linkInfo}>
        <Text style={s.linkTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.linkDomain}>{item.domain}</Text>
      </View>
      <Text style={s.docRowDate}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MediaScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('media');
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [docItems, setDocItems] = useState<MediaItem[]>([]);
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);

  useEffect(() => {
    if (!channelId) return;

    const loadData = async () => {
      // Import dynamically to avoid circular dependencies if any
      const { messageRepository } = require('../services/message.repository');
      const messages = await messageRepository.getMessages(channelId as string, 10000);
      
      const newMedia: MediaItem[] = [];
      const newDocs: MediaItem[] = [];
      const newLinks: LinkItem[] = [];
      
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      messages.forEach((msg: any) => {
        const createdAt = msg.created_at;
        const senderName = msg.sender_name;

        // Extract Links from Text
        if (msg.text) {
          const urls = msg.text.match(urlRegex);
          if (urls) {
            urls.forEach((url: string) => {
              try {
                const domain = new URL(url).hostname;
                newLinks.push({
                  id: `${msg.message_id}_${url}`,
                  url,
                  title: url,
                  domain,
                  senderName,
                  createdAt
                });
              } catch (e) {
                // invalid url
              }
            });
          }
        }

        // Extract Attachments
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att: any) => {
            const type = att.type || att.mime_type || "";
            const url = att.url || att.file_url;
            const name = att.name || "Attachment";
            
            const baseItem = {
              id: att.id || `${msg.message_id}_${name}`,
              messageId: msg.message_id,
              name: name,
              senderName,
              createdAt,
              caption: msg.text,
            };

            if (type.startsWith("image/")) {
              newMedia.push({ ...baseItem, type: 'image', uri: url });
            } else if (type.startsWith("video/") || name.endsWith(".webm") || name.endsWith(".mp4")) {
              // format duration if needed, assume att.duration is seconds or string
              let durationStr = '';
              if (att.duration) {
                const d = typeof att.duration === 'string' ? parseFloat(att.duration) : att.duration;
                if (!isNaN(d)) {
                   const m = Math.floor(d / 60);
                   const s = Math.floor(d % 60);
                   durationStr = `${m}:${s < 10 ? '0' : ''}${s}`;
                }
              }
              newMedia.push({ ...baseItem, type: 'video', uri: url, duration: durationStr });
            } else if (type.startsWith("audio/")) {
              // Ignore audio for now, or add to docs?
            } else if (type.toLowerCase() === "link" || att.file_type === "Link") {
               // Ignore links here as they should be in text, or add them
               if (url) {
                 try {
                   newLinks.push({
                     id: baseItem.id,
                     url,
                     title: name !== "Attachment" ? name : url,
                     domain: new URL(url).hostname,
                     senderName,
                     createdAt
                   });
                 } catch (e) {}
               }
            } else {
              // Document
              const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
              let sizeStr = '';
              if (att.size) {
                 const kb = att.size / 1024;
                 if (kb > 1024) sizeStr = `${(kb / 1024).toFixed(1)} MB`;
                 else sizeStr = `${kb.toFixed(0)} KB`;
              }
              newDocs.push({ ...baseItem, type: 'doc', fileName: name, fileExt: ext, fileSize: sizeStr });
            }
          });
        }
      });

      setMediaItems(newMedia);
      setDocItems(newDocs);
      setLinkItems(newLinks);
    };

    loadData();
  }, [channelId]);

  const mediaGroups = useMemo(() => groupByPeriod(mediaItems), [mediaItems]);
  const docGroups   = useMemo(() => groupByPeriod(docItems),   [docItems]);
  const linkGroups  = useMemo(() => groupByPeriod(linkItems),  [linkItems]);

  return (
    <SafeAreaView style={s.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#FAFAFA" />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F97316" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>All media</Text>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {(['media', 'docs', 'links'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={s.tabItem}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {activeTab === tab && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <>
            {mediaGroups.recent.length > 0 && (
              <>
                <SectionHeader title="RECENT" />
                <Grid items={mediaGroups.recent} />
              </>
            )}
            {mediaGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" />
                <Grid items={mediaGroups.lastMonth} />
              </>
            )}
            {mediaGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" />
                <Grid items={mediaGroups.older} />
              </>
            )}
            {mediaItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="images-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyText}>No media shared yet</Text>
              </View>
            )}
          </>
        )}

        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <>
            {docGroups.recent.length > 0 && (
              <>
                <SectionHeader title="RECENT" />
                {docGroups.recent.map(item => <DocRow key={item.id} item={item} />)}
              </>
            )}
            {docGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" />
                {docGroups.lastMonth.map(item => <DocRow key={item.id} item={item} />)}
              </>
            )}
            {docGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" />
                {docGroups.older.map(item => <DocRow key={item.id} item={item} />)}
              </>
            )}
            {docItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyText}>No documents shared yet</Text>
              </View>
            )}
          </>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <>
            {linkGroups.recent.length > 0 && (
              <>
                <SectionHeader title="RECENT" />
                {linkGroups.recent.map(item => <LinkRow key={item.id} item={item} />)}
              </>
            )}
            {linkGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" />
                {linkGroups.lastMonth.map(item => <LinkRow key={item.id} item={item} />)}
              </>
            )}
            {linkGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" />
                {linkGroups.older.map(item => <LinkRow key={item.id} item={item} />)}
              </>
            )}
            {linkItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="link-outline" size={48} color="#D1D5DB" />
                <Text style={s.emptyText}>No links shared yet</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: { fontSize: 15, fontWeight: '500', color: '#6B7280' },
  tabLabelActive: { color: '#F97316', fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2.5,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // Section header
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Grid
  grid: { paddingHorizontal: 1 },
  gridRow: { flexDirection: 'row', marginBottom: 2 },
  cell: {
    width: CELL,
    height: CELL,
    marginHorizontal: 1,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    borderRadius: 6,
  },
  cellImage: { width: '100%', height: '100%' },

  // Video overlay
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: { fontSize: 11, color: '#fff', fontWeight: '600' },

  // Doc cell (in 3-col grid)
  docCell: { backgroundColor: '#fff', borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E7EB' },
  docPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8 },
  docIconBig: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  docCellName: { fontSize: 10, color: '#374151', fontWeight: '600', textAlign: 'center' },
  docCellFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCellFileName: { fontSize: 9, fontWeight: '700', color: '#111827' },
  docCellMeta: { fontSize: 8, color: '#9CA3AF' },

  // Doc list row
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  docRowInfo: { flex: 1, marginLeft: 12 },
  docRowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  docRowMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  docRowDate: { fontSize: 11, color: '#9CA3AF' },

  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkInfo: { flex: 1, marginLeft: 12 },
  linkTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  linkDomain: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
});
