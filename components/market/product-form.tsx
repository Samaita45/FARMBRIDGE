import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Input } from '@/components/design-system';
import { DS } from '@/constants/design-system';
import { MARKET_CATEGORIES, PROVINCES } from '@/constants/zimbabwe-data';
import type { CreateProductInput, ProductDto } from '@/services/api/products.api';

const UNITS = ['kg', 'crate', 'bag', 'bunch', 'litre', 'each'] as const;

export interface ProductFormValues extends CreateProductInput {
  status: 'DRAFT' | 'ACTIVE';
}

interface ProductFormProps {
  /** Pass a listing to edit it; omit to add a new one. */
  initial?: ProductDto | null;
  submitting?: boolean;
  onSubmit: (values: ProductFormValues) => void;
  onCancel?: () => void;
}

/**
 * The form behind both adding and editing a listing.
 *
 * PRICE IS TYPED IN DOLLARS AND SENT IN CENTS. The conversion happens once,
 * here, with a single round. Everything past this point is an integer, because
 * a price that travels as 8.5 comes back as 8.499999 and the farmer is short a
 * cent on every crate.
 *
 * WHAT IT REFUSES, IT REFUSES BEFORE THE NETWORK. The server validates
 * everything again — it has to, the app is not a trustworthy caller — but a
 * farmer on a slow connection should not wait for a round trip to be told the
 * price is empty.
 */
export function ProductForm({ initial, submitting, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState<string>(initial?.category ?? MARKET_CATEGORIES[0]);
  const [price, setPrice] = useState(
    initial ? (initial.priceUsdCents / 100).toFixed(2) : ''
  );
  const [unit, setUnit] = useState<string>(initial?.unit ?? 'kg');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '');
  const [province, setProvince] = useState<string>(initial?.province ?? '');
  const [touched, setTouched] = useState(false);

  const priceNumber = Number(price);
  const quantityNumber = Number(quantity);

  const nameError = name.trim().length < 2 ? 'Give the produce a name' : undefined;
  const priceError =
    !price.trim() || !Number.isFinite(priceNumber) || priceNumber <= 0
      ? 'Enter a price above zero'
      : undefined;
  const quantityError =
    !quantity.trim() || !Number.isFinite(quantityNumber) || quantityNumber < 0
      ? 'Enter how much you have'
      : undefined;

  const invalid = Boolean(nameError || priceError || quantityError);

  const submit = (status: 'DRAFT' | 'ACTIVE') => {
    setTouched(true);
    if (invalid) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      // One rounding, at the boundary. Math.round rather than a truncation so
      // 8.005 does not quietly become 8.00.
      priceUsdCents: Math.round(priceNumber * 100),
      unit,
      quantity: quantityNumber,
      province: province || undefined,
      status,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Input
        label="What are you selling?"
        placeholder="Fresh tomatoes"
        value={name}
        onChangeText={setName}
        error={touched ? nameError : undefined}
        required
      />

      <View>
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {MARKET_CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Input
          label="Price"
          placeholder="8.50"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          error={touched ? priceError : undefined}
          containerStyle={styles.flex}
          hint="US dollars"
          required
        />
        <Input
          label="How much"
          placeholder="12"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
          error={touched ? quantityError : undefined}
          containerStyle={styles.flex}
          required
        />
      </View>

      <View>
        <Text style={styles.label}>Sold by the</Text>
        <View style={styles.chips}>
          {UNITS.map((u) => (
            <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />
          ))}
        </View>
      </View>

      <Input
        label="Anything a buyer should know"
        placeholder="Picked this morning, no chemicals."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <View>
        <Text style={styles.label}>Where it is</Text>
        <View style={styles.chips}>
          {PROVINCES.map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={province === p.name}
              onPress={() => setProvince(province === p.name ? '' : p.name)}
            />
          ))}
        </View>
      </View>

      {/*
        Two ways to finish, because they are genuinely different decisions.
        Publishing puts it in front of every buyer in the tenant; saving keeps
        it to yourself until the price is right. Neither is hidden behind the
        other.
      */}
      <View style={styles.actions}>
        <Button
          title={initial ? 'Save changes' : 'Publish listing'}
          size="lg"
          loading={submitting}
          onPress={() => submit('ACTIVE')}
          accessibilityLabel={
            initial ? 'Save changes to this listing' : 'Publish this listing to the marketplace'
          }
        />
        {!initial ? (
          <Button
            title="Save as draft"
            variant="outline"
            size="lg"
            disabled={submitting}
            onPress={() => submit('DRAFT')}
            accessibilityLabel="Save this listing without publishing it"
          />
        ) : null}
        {onCancel ? (
          <Button title="Cancel" variant="ghost" disabled={submitting} onPress={onCancel} />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && styles.pressed]}>
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: DS.spacing.md, gap: DS.spacing.md, paddingBottom: DS.spacing.xl },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: DS.spacing.sm },
  pressed: { opacity: 0.8 },

  label: {
    fontSize: DS.typography.bodySm.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
    marginBottom: 6,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: DS.radius.full,
    borderWidth: 1,
    borderColor: DS.colors.borderControl,
    backgroundColor: DS.colors.surface,
  },
  chipOn: { backgroundColor: DS.colors.primary, borderColor: DS.colors.primary },
  chipText: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  chipTextOn: { color: DS.colors.textInverse },

  actions: { gap: DS.spacing.sm, marginTop: DS.spacing.xs },
});
