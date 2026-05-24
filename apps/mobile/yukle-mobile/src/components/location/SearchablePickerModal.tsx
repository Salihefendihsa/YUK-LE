import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';

type Props = {
  visible: boolean;
  title: string;
  items: string[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  searchable?: boolean;
};

export function SearchablePickerModal({
  visible,
  title,
  items,
  selected,
  onSelect,
  onClose,
  searchable = true,
}: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    if (!q) return items;
    return items.filter((item) => item.toLocaleLowerCase('tr-TR').includes(q));
  }, [items, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>Kapat</Text>
          </Pressable>
        </View>
        {searchable ? (
          <TextInput
            style={styles.search}
            placeholder="Ara..."
            placeholderTextColor={palette.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        ) : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const on = item === selected;
            return (
              <Pressable
                style={[styles.row, on && styles.rowOn]}
                onPress={() => {
                  onSelect(item);
                  setQuery('');
                  onClose();
                }}
              >
                <Text style={[styles.rowText, on && styles.rowTextOn]}>{item}</Text>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>Sonuç bulunamadı</Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing[6] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  title: { ...typography.h2, fontSize: 18 },
  close: { ...typography.link },
  search: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.input,
  },
  row: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  rowOn: { backgroundColor: palette.brandMuted },
  rowText: { fontFamily: fontFamily.regular, fontSize: 16, color: palette.text },
  rowTextOn: { fontFamily: fontFamily.semiBold, color: palette.brand },
  empty: {
    ...typography.caption,
    textTransform: 'none',
    textAlign: 'center',
    marginTop: spacing[6],
  },
});
