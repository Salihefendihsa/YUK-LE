import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getDistrictsByCity, getNeighborhoodsByDistrict, TR_CITIES } from '../../data/tr-location';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { radius } from '../../theme/radius';
import { spacing } from '../../theme/spacing';
import { SearchablePickerModal } from './SearchablePickerModal';

type PickerKind = 'city' | 'district' | 'neighborhood' | null;

type Props = {
  labelPrefix: string;
  city: string;
  district: string;
  neighborhood?: string;
  showNeighborhood?: boolean;
  onChange: (next: { city: string; district: string; neighborhood?: string }) => void;
};

function FieldButton({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.fieldBtn} onPress={onPress}>
        <Text style={[styles.fieldValue, !value && styles.fieldPlaceholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    </View>
  );
}

export function TrLocationFields({
  labelPrefix,
  city,
  district,
  neighborhood = '',
  showNeighborhood = false,
  onChange,
}: Props) {
  const [picker, setPicker] = useState<PickerKind>(null);

  const districtOptions = city ? getDistrictsByCity(city) : [];
  const neighborhoodOptions = district ? getNeighborhoodsByDistrict(district) : [];

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{labelPrefix}</Text>
      <FieldButton
        label="İl"
        value={city}
        placeholder="İl seçin"
        onPress={() => setPicker('city')}
      />
      <FieldButton
        label="İlçe"
        value={district}
        placeholder={city ? 'İlçe seçin' : 'Önce il seçin'}
        onPress={() => city && setPicker('district')}
      />
      {showNeighborhood ? (
        <FieldButton
          label="Mahalle (opsiyonel)"
          value={neighborhood}
          placeholder={district ? 'Mahalle seçin' : 'Önce ilçe seçin'}
          onPress={() => district && setPicker('neighborhood')}
        />
      ) : null}

      <SearchablePickerModal
        visible={picker === 'city'}
        title={`${labelPrefix} — İl seçin`}
        items={[...TR_CITIES]}
        selected={city}
        onSelect={(nextCity) =>
          onChange({ city: nextCity, district: '', neighborhood: '' })
        }
        onClose={() => setPicker(null)}
      />
      <SearchablePickerModal
        visible={picker === 'district'}
        title={`${labelPrefix} — İlçe seçin`}
        items={districtOptions}
        selected={district}
        searchable={districtOptions.length > 6}
        onSelect={(nextDistrict) =>
          onChange({ city, district: nextDistrict, neighborhood: '' })
        }
        onClose={() => setPicker(null)}
      />
      <SearchablePickerModal
        visible={picker === 'neighborhood'}
        title={`${labelPrefix} — Mahalle seçin`}
        items={neighborhoodOptions}
        selected={neighborhood}
        searchable={false}
        onSelect={(nextHood) => onChange({ city, district, neighborhood: nextHood })}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing[2], marginBottom: spacing[3] },
  blockTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: palette.gold,
    marginBottom: spacing[1],
  },
  fieldWrap: { gap: spacing[1] },
  fieldLabel: { ...typography.label },
  fieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    backgroundColor: palette.input,
  },
  fieldValue: { fontFamily: fontFamily.regular, fontSize: 15, color: palette.text, flex: 1 },
  fieldPlaceholder: { color: palette.textMuted },
  chevron: { fontSize: 18, color: palette.textMuted, marginLeft: spacing[2] },
});
