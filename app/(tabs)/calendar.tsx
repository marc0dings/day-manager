import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useEvents } from '@/context/events-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── constants ───────────────────────────────────────────────────────────────

const EVENT_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#0a7ea4', '#AF52DE'];

// ─── helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mondayOffset(d: Date) { return (d.getDay() + 6) % 7; }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

// ─── types ───────────────────────────────────────────────────────────────────

type EventForm = {
  title: string;
  allDay: boolean;
  startAt: Date;
  endAt: Date;
  location: string;
  color: string;
};

type PickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime';

function defaultForm(base: Date): EventForm {
  const start = new Date(base);
  const now = new Date();
  start.setHours(now.getHours() + 1, 0, 0, 0);
  return {
    title: '',
    allDay: false,
    startAt: start,
    endAt: new Date(start.getTime() + 3_600_000),
    location: '',
    color: EVENT_COLORS[4],
  };
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const cardBg = scheme === 'light' ? '#F2F2F7' : '#1C1C1E';
  const inputBg = scheme === 'light' ? '#E5E5EA' : '#2C2C2E';
  const today = new Date();

  const { t } = useTranslation();
  const locale = t('locale');
  const months = t('calendar.months', { returnObjects: true }) as string[];
  const weekdays = t('calendar.weekdays', { returnObjects: true }) as string[];

  function fmt(d: Date) {
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  function fmtDate(d: Date) {
    return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtDayLabel(d: Date) {
    return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const { events, addEvent, deleteEvent, eventsForDate } = useEvents();

  // ── calendar navigation ──
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const leadingOffset = mondayOffset(new Date(year, month, 1));
  const totalDays = daysInMonth(year, month);

  const rows = useMemo<(number | null)[][]>(() => {
    const cells: (number | null)[] = Array(leadingOffset).fill(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const r: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) r.push(cells.slice(i, i + 7));
    return r;
  }, [leadingOffset, totalDays]);

  const dotsByDay = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const ev of events) {
      const key = `${ev.startAt.getFullYear()}-${ev.startAt.getMonth()}-${ev.startAt.getDate()}`;
      if (!map[key]) map[key] = [];
      if (map[key].length < 3) map[key].push(ev.color ?? colors.tint);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(
    () => eventsForDate(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, events],
  );

  // ── event form ──
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventForm>(() => defaultForm(today));

  function openForm() {
    setForm(defaultForm(selectedDate));
    setShowForm(true);
  }

  function saveEvent() {
    if (!form.title.trim()) return;
    addEvent({
      title: form.title.trim(),
      allDay: form.allDay,
      startAt: form.startAt,
      endAt: form.endAt,
      location: form.location.trim() || undefined,
      color: form.color,
      participants: [],
      createdBy: 'me',
    });
    setShowForm(false);
  }

  // ── date / time picker ──
  const [pickerField, setPickerField] = useState<PickerField | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  function openPicker(field: PickerField) {
    const base = field.startsWith('start') ? form.startAt : form.endAt;
    setPickerValue(new Date(base));
    setPickerField(field);
  }

  function handlePickerChange(_: any, selected?: Date) {
    if (!selected || !pickerField) {
      setPickerField(null);
      return;
    }
    setPickerValue(selected);
    applyPick(pickerField, selected);
    if (Platform.OS === 'android') setPickerField(null);
  }

  function applyPick(field: PickerField, picked: Date) {
    setForm(f => {
      const s = new Date(f.startAt);
      const e = new Date(f.endAt);
      if (field === 'startDate') s.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      else if (field === 'startTime') s.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      else if (field === 'endDate') e.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      else e.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      const endAt = e <= s ? new Date(s.getTime() + 3_600_000) : e;
      return { ...f, startAt: s, endAt };
    });
  }

  const pickerMode = pickerField?.endsWith('Time') ? 'time' : 'date';

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('calendar.title')}</ThemedText>
        </ThemedView>

        {/* ── Month grid ── */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              style={styles.navBtn} hitSlop={12}
            >
              <ChevronLeft size={20} color={colors.tint} />
            </Pressable>
            <ThemedText type="defaultSemiBold" style={styles.monthLabel}>
              {months[month]} {year}
            </ThemedText>
            <Pressable
              onPress={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              style={styles.navBtn} hitSlop={12}
            >
              <ChevronRight size={20} color={colors.tint} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekdays.map(wd => (
              <View key={wd} style={styles.dayCell}>
                <ThemedText style={[styles.weekdayLabel, { color: colors.icon }]}>{wd}</ThemedText>
              </View>
            ))}
          </View>

          {rows.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((day, ci) => {
                if (day === null) return <View key={ci} style={styles.dayCell} />;
                const date = new Date(year, month, day);
                const isToday = isSameDay(date, today);
                const isSelected = isSameDay(date, selectedDate);
                const dots = dotsByDay[`${year}-${month}-${day}`] ?? [];
                return (
                  <Pressable key={ci} style={styles.dayCell} onPress={() => setSelectedDate(date)}>
                    <View style={[
                      styles.dayCircle,
                      isToday && { backgroundColor: colors.tint },
                      !isToday && isSelected && { backgroundColor: '#fff', borderWidth: 1.5, borderColor: colors.tint },
                    ]}>
                      <ThemedText style={[
                        styles.dayNumber,
                        isToday && { color: scheme === 'dark' ? '#11181C' : '#fff', fontWeight: '600' },
                        !isToday && isSelected && { color: '#11181C' },
                      ]}>
                        {day}
                      </ThemedText>
                    </View>
                    <View style={styles.dotsRow}>
                      {dots.map((c, i) => <View key={i} style={[styles.dot, { backgroundColor: c }]} />)}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ThemedView>

        {/* ── Events for selected day ── */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
          <ThemedText type="defaultSemiBold" style={styles.dayHeading}>
            {fmtDayLabel(selectedDate)}
          </ThemedText>

          {selectedEvents.length === 0 ? (
            <ThemedText style={styles.empty}>{t('calendar.noEvents')}</ThemedText>
          ) : (
            <View style={styles.eventList}>
              {selectedEvents.map(ev => (
                <View
                  key={ev.id}
                  style={[styles.eventRow, { borderLeftColor: ev.color ?? colors.tint }]}
                >
                  <View style={styles.eventContent}>
                    <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                      {ev.title}
                    </ThemedText>
                    {ev.allDay ? (
                      <ThemedText style={[styles.meta, { color: colors.icon }]}>
                        {t('calendar.allDay')}
                      </ThemedText>
                    ) : (
                      <View style={styles.metaRow}>
                        <Clock size={12} color={colors.icon} />
                        <ThemedText style={[styles.meta, { color: colors.icon }]}>
                          {fmt(ev.startAt)} – {fmt(ev.endAt)}
                        </ThemedText>
                      </View>
                    )}
                    {ev.location ? (
                      <View style={styles.metaRow}>
                        <MapPin size={12} color={colors.icon} />
                        <ThemedText style={[styles.meta, { color: colors.icon }]}>{ev.location}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => deleteEvent(ev.id)} hitSlop={8}>
                    <X size={16} color={colors.icon} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ThemedView>

      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={openForm}
        activeOpacity={0.85}
      >
        <Plus size={28} color="rgba(0,0,0,0.8)" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Event form modal ── */}
      <Modal
        visible={showForm}
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <SafeAreaView style={[styles.formRoot, { backgroundColor: colors.background }]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={[styles.formHeader, { borderBottomColor: inputBg }]}>
              <TouchableOpacity onPress={() => setShowForm(false)} hitSlop={8}>
                <X size={22} color={colors.tint} />
              </TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={styles.formTitle}>
                {t('calendar.newEvent')}
              </ThemedText>
              <TouchableOpacity
                onPress={saveEvent}
                disabled={!form.title.trim()}
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.tint, opacity: form.title.trim() ? 1 : 0.35 },
                ]}
              >
                <ThemedText style={styles.saveBtnText}>{t('calendar.save')}</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll}>

              {/* Title */}
              <View style={[styles.formSection, { backgroundColor: cardBg }]}>
                <TextInput
                  style={[styles.titleInput, { color: colors.text }]}
                  placeholder={t('calendar.titlePlaceholder')}
                  placeholderTextColor={colors.icon}
                  value={form.title}
                  onChangeText={t2 => setForm(f => ({ ...f, title: t2 }))}
                  autoFocus
                  returnKeyType="done"
                />
              </View>

              {/* All-day */}
              <View style={[styles.formSection, { backgroundColor: cardBg }]}>
                <View style={styles.formRow}>
                  <ThemedText>{t('calendar.allDay')}</ThemedText>
                  <Switch
                    value={form.allDay}
                    onValueChange={v => setForm(f => ({ ...f, allDay: v }))}
                    trackColor={{ false: inputBg, true: colors.tint }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              {/* Date / time */}
              <View style={[styles.formSection, { backgroundColor: cardBg }]}>
                <View style={styles.formRow}>
                  <ThemedText style={styles.formLabel}>{t('calendar.start')}</ThemedText>
                  <View style={styles.dtRow}>
                    <TouchableOpacity
                      style={[styles.dtBtn, { backgroundColor: inputBg }]}
                      onPress={() => openPicker('startDate')}
                    >
                      <ThemedText style={styles.dtText}>{fmtDate(form.startAt)}</ThemedText>
                    </TouchableOpacity>
                    {!form.allDay && (
                      <TouchableOpacity
                        style={[styles.dtBtn, { backgroundColor: inputBg }]}
                        onPress={() => openPicker('startTime')}
                      >
                        <ThemedText style={styles.dtText}>{fmt(form.startAt)}</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={[styles.rowSep, { backgroundColor: inputBg }]} />

                <View style={styles.formRow}>
                  <ThemedText style={styles.formLabel}>{t('calendar.end')}</ThemedText>
                  <View style={styles.dtRow}>
                    <TouchableOpacity
                      style={[styles.dtBtn, { backgroundColor: inputBg }]}
                      onPress={() => openPicker('endDate')}
                    >
                      <ThemedText style={styles.dtText}>{fmtDate(form.endAt)}</ThemedText>
                    </TouchableOpacity>
                    {!form.allDay && (
                      <TouchableOpacity
                        style={[styles.dtBtn, { backgroundColor: inputBg }]}
                        onPress={() => openPicker('endTime')}
                      >
                        <ThemedText style={styles.dtText}>{fmt(form.endAt)}</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Location */}
              <View style={[styles.formSection, { backgroundColor: cardBg }]}>
                <View style={styles.formRow}>
                  <MapPin size={18} color={colors.icon} />
                  <TextInput
                    style={[styles.locationInput, { color: colors.text }]}
                    placeholder={t('calendar.locationPlaceholder')}
                    placeholderTextColor={colors.icon}
                    value={form.location}
                    onChangeText={t2 => setForm(f => ({ ...f, location: t2 }))}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Color */}
              <View style={[styles.formSection, { backgroundColor: cardBg }]}>
                <View style={styles.formRow}>
                  <ThemedText style={styles.formLabel}>{t('calendar.color')}</ThemedText>
                  <View style={styles.colorRow}>
                    {EVENT_COLORS.map(c => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setForm(f => ({ ...f, color: c }))}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: c },
                          form.color === c && styles.colorSelected,
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── iOS date/time picker bottom sheet ── */}
      {pickerField !== null && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" onRequestClose={() => setPickerField(null)}>
          <Pressable style={styles.pickerOverlay} onPress={() => setPickerField(null)}>
            <Pressable style={[styles.pickerSheet, { backgroundColor: cardBg }]}>
              <View style={styles.pickerHandle} />
              <DateTimePicker
                value={pickerValue}
                mode={pickerMode}
                display="spinner"
                onChange={handlePickerChange}
                locale={locale}
                style={styles.picker}
              />
              <TouchableOpacity
                style={[styles.pickerDone, { backgroundColor: colors.tint }]}
                onPress={() => setPickerField(null)}
              >
                <ThemedText style={styles.pickerDoneText}>{t('calendar.done')}</ThemedText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ── Android date/time picker (native dialog) ── */}
      {pickerField !== null && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display="default"
          onChange={handlePickerChange}
        />
      )}

    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 100 },
  header: { marginBottom: 4 },
  card: { borderRadius: 14, padding: 16, gap: 10 },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 16 },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  weekdayLabel: { fontSize: 11, fontWeight: '600' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 14 },
  dotsRow: { flexDirection: 'row', gap: 2, height: 5, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  dayHeading: { fontSize: 14 },
  empty: { opacity: 0.45, fontStyle: 'italic', fontSize: 14 },
  eventList: { gap: 12 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  eventContent: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },

  formRoot: { flex: 1 },
  formHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  formTitle: { fontSize: 17 },
  saveBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  saveBtnText: { color: 'rgba(0,0,0,0.8)', fontWeight: '600', fontSize: 15 },
  formScroll: { padding: 20, gap: 12 },
  formSection: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formLabel: { fontSize: 15, opacity: 0.7 },
  rowSep: { height: 1 },
  titleInput: { fontSize: 17, paddingVertical: 2 },
  dtRow: { flexDirection: 'row', gap: 6 },
  dtBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  dtText: { fontSize: 14, fontWeight: '500' },
  locationInput: { flex: 1, fontSize: 15, marginLeft: 10 },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorCircle: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingBottom: 32, paddingHorizontal: 16 },
  pickerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#8884', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  picker: { width: '100%' },
  pickerDone: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  pickerDoneText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
