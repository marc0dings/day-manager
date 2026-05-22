import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/events-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { CalendarEvent } from '@/types/event';

type ChecklistItem = { id: string; text: string; checked: boolean };
type Checklist = { id: string; title: string; items: ChecklistItem[]; eventId?: string };

const DELETE_WIDTH = 72;
const SWIPE_THRESHOLD = 48;

function SwipeableCard({
  children,
  onDelete,
  enabled,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  enabled: boolean;
}) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onUpdate(e => {
      translateX.value = Math.max(-DELETE_WIDTH, Math.min(0, e.translationX));
    })
    .onEnd(e => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_WIDTH);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    if (!enabled) translateX.value = withSpring(0);
  }, [enabled]);

  return (
    <View>
      <View style={[styles.deleteAction, { width: DELETE_WIDTH }]}>
        <TouchableOpacity onPress={onDelete} style={styles.deleteActionBtn}>
          <ThemedText style={styles.deleteActionText}>🗑</ThemedText>
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={animStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function ChecklistsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const inputBg = scheme === 'light' ? '#F2F2F7' : '#2C2C2E';
  const tint = Colors[scheme].tint;
  const { t } = useTranslation();

  const { events } = useEvents();

  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newEventId, setNewEventId] = useState<string | null>(null);
  const [showInlineEventPicker, setShowInlineEventPicker] = useState(false);
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);

  function getEvent(eventId?: string): CalendarEvent | undefined {
    return eventId ? events.find(e => e.id === eventId) : undefined;
  }

  function formatEventDate(date: Date) {
    const locale = t('locale');
    return (
      date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' +
      date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    );
  }

  function createChecklist() {
    if (!newTitle.trim()) return;
    const id = Date.now().toString();
    setChecklists(prev => [
      ...prev,
      { id, title: newTitle.trim(), items: [], eventId: newEventId ?? undefined },
    ]);
    setNewTitle('');
    setNewEventId(null);
    setShowInlineEventPicker(false);
    setShowModal(false);
    setExpandedId(id);
  }

  function closeCreateModal() {
    setShowModal(false);
    setNewEventId(null);
    setShowInlineEventPicker(false);
  }

  function addItem(listId: string) {
    const text = (newItemTexts[listId] ?? '').trim();
    if (!text) return;
    setChecklists(prev =>
      prev.map(l =>
        l.id === listId
          ? { ...l, items: [...l.items, { id: Date.now().toString(), text, checked: false }] }
          : l
      )
    );
    setNewItemTexts(prev => ({ ...prev, [listId]: '' }));
  }

  function toggleItem(listId: string, itemId: string) {
    setChecklists(prev =>
      prev.map(l =>
        l.id === listId
          ? { ...l, items: l.items.map(i => (i.id === itemId ? { ...i, checked: !i.checked } : i)) }
          : l
      )
    );
  }

  function deleteItem(listId: string, itemId: string) {
    setChecklists(prev =>
      prev.map(l =>
        l.id === listId ? { ...l, items: l.items.filter(i => i.id !== itemId) } : l
      )
    );
  }

  function deleteChecklist(listId: string) {
    setChecklists(prev => prev.filter(l => l.id !== listId));
    if (expandedId === listId) setExpandedId(null);
  }

  function startEdit(list: Checklist) {
    setEditingId(list.id);
    setEditTitle(list.title);
  }

  function saveEdit(listId: string) {
    if (editTitle.trim()) {
      setChecklists(prev =>
        prev.map(l => (l.id === listId ? { ...l, title: editTitle.trim() } : l))
      );
    }
    setEditingId(null);
  }

  function setListEvent(listId: string, eventId: string | null) {
    setChecklists(prev =>
      prev.map(l => (l.id === listId ? { ...l, eventId: eventId ?? undefined } : l))
    );
    setShowPickerFor(null);
  }

  const sortedEvents = [...events].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  function renderEventPickerList(
    selectedEventId: string | null | undefined,
    onSelect: (eventId: string | null) => void,
  ) {
    return (
      <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.pickerRow} onPress={() => onSelect(null)}>
          <ThemedText style={[styles.pickerRowLabel, { opacity: 0.5 }]}>{t('checklists.noEvent')}</ThemedText>
          {!selectedEventId && <ThemedText style={{ color: tint }}>✓</ThemedText>}
        </TouchableOpacity>
        {sortedEvents.length === 0 && (
          <ThemedText style={styles.pickerEmpty}>{t('checklists.noEventsToLink')}</ThemedText>
        )}
        {sortedEvents.map(ev => (
          <TouchableOpacity key={ev.id} style={styles.pickerRow} onPress={() => onSelect(ev.id)}>
            <View style={[styles.eventDot, { backgroundColor: ev.color ?? tint }]} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.pickerRowLabel}>{ev.title}</ThemedText>
              <ThemedText style={styles.pickerRowDate}>{formatEventDate(ev.startAt)}</ThemedText>
            </View>
            {selectedEventId === ev.id && <ThemedText style={{ color: tint }}>✓</ThemedText>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const active = checklists.filter(l => l.items.length === 0 || l.items.some(i => !i.checked));
  const completed = checklists.filter(l => l.items.length > 0 && l.items.every(i => i.checked));

  function renderChecklist(list: Checklist) {
    const done = list.items.filter(i => i.checked).length;
    const total = list.items.length;
    const isExpanded = expandedId === list.id;
    const isEditing = editingId === list.id;
    const progressPct = total > 0 ? `${(done / total) * 100}%` : '0%';
    const linkedEvent = getEvent(list.eventId);

    return (
      <SwipeableCard
        key={list.id}
        onDelete={() => deleteChecklist(list.id)}
        enabled={!isExpanded}
      >
        <View style={[styles.listCard, { backgroundColor: cardBg }]}>

          <View style={styles.listHeader}>
            <TouchableOpacity
              style={styles.listHeaderLeft}
              onPress={() => !isEditing && setExpandedId(isExpanded ? null : list.id)}
              activeOpacity={0.7}
            >
              {isEditing ? (
                <TextInput
                  style={[styles.titleInput, { color: Colors[scheme].text, borderColor: tint }]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  onSubmitEditing={() => saveEdit(list.id)}
                  onBlur={() => saveEdit(list.id)}
                  autoFocus
                  returnKeyType="done"
                />
              ) : (
                <ThemedText type="defaultSemiBold">{list.title}</ThemedText>
              )}
              {total > 0 && !isEditing && (
                <ThemedText style={styles.progress}>{done}/{total}</ThemedText>
              )}
            </TouchableOpacity>
            <View style={styles.listHeaderRight}>
              <TouchableOpacity onPress={() => setShowPickerFor(list.id)} hitSlop={8}>
                <ThemedText style={[styles.iconBtn, { opacity: list.eventId ? 0.85 : 0.3 }]}>📅</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => isEditing ? saveEdit(list.id) : startEdit(list)}
                hitSlop={8}
              >
                <ThemedText style={styles.iconBtn}>{isEditing ? '✓' : '✎'}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : list.id)}
                hitSlop={8}
              >
                <ThemedText style={styles.chevron}>{isExpanded ? '▲' : '▼'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {linkedEvent && !isEditing && (
            <TouchableOpacity style={styles.eventBadge} onPress={() => setShowPickerFor(list.id)}>
              <View style={[styles.eventDot, { backgroundColor: linkedEvent.color ?? tint }]} />
              <ThemedText style={styles.eventBadgeText} numberOfLines={1}>
                {linkedEvent.title}
              </ThemedText>
              <ThemedText style={styles.eventBadgeDate}>
                {formatEventDate(linkedEvent.startAt)}
              </ThemedText>
            </TouchableOpacity>
          )}

          {total > 0 && (
            <View style={[styles.progressBar, { backgroundColor: inputBg }]}>
              <View style={[styles.progressFill, { backgroundColor: tint, width: progressPct as any }]} />
            </View>
          )}

          {isExpanded && (
            <View style={styles.itemsContainer}>
              {list.items.map(item => (
                <View key={item.id} style={styles.itemRow}>
                  <TouchableOpacity
                    style={styles.itemPressable}
                    onPress={() => toggleItem(list.id, item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, { borderColor: tint }, item.checked && { backgroundColor: tint }]}>
                      {item.checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                    </View>
                    <ThemedText style={[styles.itemText, item.checked && styles.itemDone]}>
                      {item.text}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteItem(list.id, item.id)} hitSlop={8}>
                    <ThemedText style={styles.deleteItemBtn}>✕</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.addItemRow}>
                <TextInput
                  style={[styles.addItemInput, { backgroundColor: inputBg, color: Colors[scheme].text }]}
                  placeholder={t('checklists.addItemPlaceholder')}
                  placeholderTextColor={Colors[scheme].icon}
                  value={newItemTexts[list.id] ?? ''}
                  onChangeText={t2 => setNewItemTexts(prev => ({ ...prev, [list.id]: t2 }))}
                  onSubmitEditing={() => addItem(list.id)}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addItemBtn, { backgroundColor: tint }]}
                  onPress={() => addItem(list.id)}
                >
                  <ThemedText style={styles.addItemBtnText}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </SwipeableCard>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: Colors[scheme].background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <ThemedText type="title">{t('checklists.title')}</ThemedText>
        </View>

        {active.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('checklists.active')}
            </ThemedText>
            {active.map(renderChecklist)}
          </View>
        )}

        {completed.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              {t('checklists.completed')}
            </ThemedText>
            {completed.map(renderChecklist)}
          </View>
        )}

        {checklists.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.hint}>{t('checklists.empty')}</ThemedText>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tint }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </TouchableOpacity>

      {/* New checklist modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeCreateModal}>
        <Pressable style={styles.modalOverlay} onPress={closeCreateModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={[styles.modalBox, { backgroundColor: cardBg }]}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                {t('checklists.newChecklist')}
              </ThemedText>
              <TextInput
                style={[styles.modalInput, { backgroundColor: inputBg, color: Colors[scheme].text }]}
                placeholder={t('checklists.titlePlaceholder')}
                placeholderTextColor={Colors[scheme].icon}
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
                onSubmitEditing={createChecklist}
                returnKeyType="done"
              />

              {/* Event assignment row */}
              <TouchableOpacity
                style={[styles.assignEventRow, { backgroundColor: inputBg }]}
                onPress={() => setShowInlineEventPicker(p => !p)}
                activeOpacity={0.7}
              >
                {newEventId && getEvent(newEventId) && (
                  <View style={[styles.eventDot, { backgroundColor: getEvent(newEventId)!.color ?? tint }]} />
                )}
                <ThemedText
                  style={[styles.assignEventLabel, { color: newEventId ? tint : Colors[scheme].icon }]}
                  numberOfLines={1}
                >
                  {'📅  ' + (newEventId && getEvent(newEventId) ? getEvent(newEventId)!.title : t('checklists.assignEvent'))}
                </ThemedText>
                {newEventId && (
                  <TouchableOpacity
                    onPress={() => { setNewEventId(null); setShowInlineEventPicker(false); }}
                    hitSlop={8}
                  >
                    <ThemedText style={{ opacity: 0.4, fontSize: 14 }}>✕</ThemedText>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showInlineEventPicker && renderEventPickerList(newEventId, (id) => setNewEventId(id))}

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: tint }]}
                onPress={createChecklist}
              >
                <ThemedText style={styles.modalBtnText}>{t('checklists.create')}</ThemedText>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Event picker for existing checklists */}
      <Modal
        visible={showPickerFor !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerFor(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPickerFor(null)}>
          <Pressable style={[styles.modalBox, { backgroundColor: cardBg }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {t('checklists.eventPickerTitle')}
            </ThemedText>
            {renderEventPickerList(
              checklists.find(l => l.id === showPickerFor)?.eventId ?? null,
              (id) => setListEvent(showPickerFor!, id),
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 100 },
  header: { marginBottom: 4 },
  section: { gap: 10 },
  sectionTitle: { marginBottom: 2 },
  emptyCard: { borderRadius: 14, padding: 16 },
  hint: { opacity: 0.45, fontStyle: 'italic', fontSize: 14, textAlign: 'center' },

  deleteAction: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    backgroundColor: '#FF3B30', borderRadius: 14, overflow: 'hidden',
  },
  deleteActionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteActionText: { fontSize: 22 },

  listCard: { borderRadius: 14, padding: 16, gap: 10 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  listHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleInput: {
    flex: 1, fontSize: 16, fontWeight: '600',
    borderBottomWidth: 1.5, paddingVertical: 2, marginRight: 8,
  },
  iconBtn: { fontSize: 18, opacity: 0.6 },
  progress: { opacity: 0.5, fontSize: 14 },
  chevron: { opacity: 0.4, fontSize: 12 },
  progressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  eventBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eventBadgeText: { fontSize: 13, opacity: 0.75, flex: 1 },
  eventBadgeDate: { fontSize: 11, opacity: 0.45 },
  eventDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  itemsContainer: { gap: 8, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemPressable: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  itemText: { fontSize: 15, flex: 1 },
  itemDone: { opacity: 0.4, textDecorationLine: 'line-through' },
  deleteItemBtn: { fontSize: 16, opacity: 0.35, paddingHorizontal: 4 },

  addItemRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  addItemInput: { flex: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  addItemBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addItemBtnText: { color: 'rgba(0,0,0,0.8)', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: 'rgba(0,0,0,0.8)', fontSize: 32, fontWeight: '300', lineHeight: 40 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  modalBox: { borderRadius: 18, padding: 24, gap: 12 },
  modalTitle: { marginBottom: 4 },
  modalInput: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  modalBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: 'rgba(0,0,0,0.8)', fontWeight: '600', fontSize: 16 },

  assignEventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  assignEventLabel: { flex: 1, fontSize: 15 },

  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 2 },
  pickerRowLabel: { fontSize: 14, flex: 1 },
  pickerRowDate: { fontSize: 12, opacity: 0.45 },
  pickerEmpty: { opacity: 0.45, fontStyle: 'italic', fontSize: 14, padding: 8 },
});
