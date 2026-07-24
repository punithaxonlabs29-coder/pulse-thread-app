import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';
import { createStyles } from '../styles/media.styles';

// ─── Sub-components ───────────────────────────────────────────────────────────

import { Image } from 'expo-image';
import { MediaCacheManager } from '../services/MediaCacheManager';

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

function MediaThumbnail({ item, styles: s }: { item: MediaItem, styles: any }) {
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
              <AppText style={s.durationText}>{item.duration}</AppText>
            </View>
          )}
        </>
      )}
    </>
  );
}

function MediaCell({ item, styles: s }: { item: MediaItem, styles: any }) {
  if (item.type === 'doc') {
    const cfg = extConfig(item.fileExt);
    return (
      <TouchableOpacity style={[s.cell, s.docCell]} activeOpacity={0.85}>
        <View style={s.docPreview}>
          <View style={[s.docIconBig, { backgroundColor: cfg.color + '18' }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={36} color={cfg.color} />
          </View>
          <AppText style={s.docCellName} numberOfLines={2}>{item.fileName}</AppText>
        </View>
        <View style={[s.docCellFooter, { borderTopColor: cfg.color + '30' }]}>
          <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
          <View style={{ marginLeft: 6 }}>
            <AppText style={s.docCellFileName} numberOfLines={1}>{item.fileName}</AppText>
            <AppText style={s.docCellMeta}>{item.fileSize} • {item.fileExt}</AppText>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={s.cell} activeOpacity={0.85}>
      <MediaThumbnail item={item} styles={s} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title, styles: s }: { title: string, styles: any }) {
  return <AppText style={s.sectionLabel}>{title}</AppText>;
}

function Grid({ items, styles: s }: { items: MediaItem[], styles: any }) {
  const rows: MediaItem[][] = [];
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3));
  return (
    <View style={s.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={s.gridRow}>
          {row.map(item => <MediaCell key={item.id} item={item} styles={s} />)}
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

function DocRow({ item, styles: s }: { item: MediaItem, styles: any }) {
  const cfg = extConfig(item.fileExt);
  return (
    <TouchableOpacity style={s.docRow} activeOpacity={0.7}>
      <MaterialCommunityIcons name={cfg.icon as any} size={36} color={cfg.color} />
      <View style={s.docRowInfo}>
        <AppText style={s.docRowName}>{item.fileName}</AppText>
        <AppText style={s.docRowMeta}>{item.fileSize} • {item.fileExt}</AppText>
      </View>
      <AppText style={s.docRowDate}>{formatDate(item.createdAt)}</AppText>
    </TouchableOpacity>
  );
}

function LinkRow({ item, styles: s, colors }: { item: LinkItem, styles: any, colors: any }) {
  return (
    <TouchableOpacity style={s.linkRow} activeOpacity={0.7}>
      <View style={s.linkIcon}>
        <Ionicons name="link" size={20} color={colors.brand.primary} />
      </View>
      <View style={s.linkInfo}>
        <AppText style={s.linkTitle} numberOfLines={1}>{item.title}</AppText>
        <AppText style={s.linkDomain}>{item.domain}</AppText>
      </View>
      <AppText style={s.docRowDate}>{formatDate(item.createdAt)}</AppText>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MediaScreen() {
  const colors = useColors();
  const s = React.useMemo(() => createStyles(colors), [colors]);
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
      <StatusBar style="dark" backgroundColor={colors.background.surface} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={s.headerTitle}>All media</AppText>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {(['media', 'docs', 'links'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={s.tabItem}
            onPress={() => setActiveTab(tab)}
          >
            <AppText style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </AppText>
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
                <SectionHeader title="RECENT" styles={s} />
                <Grid items={mediaGroups.recent} styles={s} />
              </>
            )}
            {mediaGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" styles={s} />
                <Grid items={mediaGroups.lastMonth} styles={s} />
              </>
            )}
            {mediaGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" styles={s} />
                <Grid items={mediaGroups.older} styles={s} />
              </>
            )}
            {mediaItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="images-outline" size={48} color={colors.text.muted} />
                <AppText style={s.emptyText}>No media shared yet</AppText>
              </View>
            )}
          </>
        )}

        {/* DOCS TAB */}
        {activeTab === 'docs' && (
          <>
            {docGroups.recent.length > 0 && (
              <>
                <SectionHeader title="RECENT" styles={s} />
                {docGroups.recent.map(item => <DocRow key={item.id} item={item} styles={s} />)}
              </>
            )}
            {docGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" styles={s} />
                {docGroups.lastMonth.map(item => <DocRow key={item.id} item={item} styles={s} />)}
              </>
            )}
            {docGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" styles={s} />
                {docGroups.older.map(item => <DocRow key={item.id} item={item} styles={s} />)}
              </>
            )}
            {docItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="document-outline" size={48} color={colors.text.muted} />
                <AppText style={s.emptyText}>No documents shared yet</AppText>
              </View>
            )}
          </>
        )}

        {/* LINKS TAB */}
        {activeTab === 'links' && (
          <>
            {linkGroups.recent.length > 0 && (
              <>
                <SectionHeader title="RECENT" styles={s} />
                {linkGroups.recent.map(item => <LinkRow key={item.id} item={item} styles={s} colors={colors} />)}
              </>
            )}
            {linkGroups.lastMonth.length > 0 && (
              <>
                <SectionHeader title="LAST MONTH" styles={s} />
                {linkGroups.lastMonth.map(item => <LinkRow key={item.id} item={item} styles={s} colors={colors} />)}
              </>
            )}
            {linkGroups.older.length > 0 && (
              <>
                <SectionHeader title="OLDER" styles={s} />
                {linkGroups.older.map(item => <LinkRow key={item.id} item={item} styles={s} colors={colors} />)}
              </>
            )}
            {linkItems.length === 0 && (
              <View style={s.empty}>
                <Ionicons name="link-outline" size={48} color={colors.text.muted} />
                <AppText style={s.emptyText}>No links shared yet</AppText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


