import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyState, LoadingState, Sheet } from '@/components/design-system';
import { ProductForm, type ProductFormValues } from '@/components/market/product-form';
import { useToast } from '@/components/ui/toast-provider';
import { DS } from '@/constants/design-system';
import { IS_API_ENABLED } from '@/services/api/config';
import { productsApi, type ProductDto } from '@/services/api/products.api';

type Editing = { mode: 'add' } | { mode: 'edit'; product: ProductDto } | null;

/**
 * A seller's own listings, and the place they add one.
 *
 * WHAT THIS REPLACED. The screen used to hold two invented listings — "Fresh
 * Tomatoes 10kg, 24 sold" and "Organic Honey 1kg, 12 sold" — and an Add tab
 * whose button answered "Product submitted for review (mock)" and cleared the
 * form. Nothing was stored, nothing was sent, and the sales figures belonged to
 * nobody. A farmer could fill that form in every day and never have listed
 * anything.
 *
 * IT NEEDS THE API AND SAYS SO. The rest of FarmBridge works on the device, but
 * a marketplace is other people: a listing that never leaves the phone is not
 * for sale. Rather than an empty shelf that reads as "nothing listed", an
 * install with no backend is told plainly where listings live.
 */
export default function SellerDashboardScreen() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const rows = await productsApi.listMine();
    setProducts(rows);
  }, []);

  useEffect(() => {
    if (!IS_API_ENABLED) return;
    let cancelled = false;
    void productsApi
      .listMine()
      .then((rows) => {
        if (cancelled) return;
        setProducts(rows);
      })
      .catch(() => {
        /* the empty state below covers it; a toast on mount helps nobody */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = IS_API_ENABLED && !loaded;

  const save = useCallback(
    async (values: ProductFormValues) => {
      setSaving(true);
      try {
        if (editing?.mode === 'edit') {
          const updated = await productsApi.update(editing.product.id, values);
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          showToast('Listing updated', 'success');
        } else {
          const created = await productsApi.create(values);
          setProducts((prev) => [created, ...prev]);
          showToast(
            created.status === 'ACTIVE' ? 'Listing is live' : 'Saved as a draft',
            'success'
          );
        }
        setEditing(null);
      } catch {
        // Deliberately not closing the sheet: the form still holds what they
        // typed, and closing it would throw the work away on a dropped signal.
        showToast('Could not save that. Check your connection and try again.', 'error');
      } finally {
        setSaving(false);
      }
    },
    [editing, showToast]
  );

  const remove = useCallback(
    async (product: ProductDto) => {
      try {
        await productsApi.remove(product.id);
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        showToast('Listing removed', 'success');
      } catch {
        showToast('Could not remove that listing.', 'error');
      }
    },
    [showToast]
  );

  const publish = useCallback(
    async (product: ProductDto) => {
      try {
        const updated = await productsApi.update(product.id, { status: 'ACTIVE' });
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(
          updated.status === 'ACTIVE'
            ? 'Listing is live'
            : 'Add some stock before publishing — it is marked sold out',
          updated.status === 'ACTIVE' ? 'success' : 'warning'
        );
      } catch {
        showToast('Could not publish that listing.', 'error');
      }
    },
    [showToast]
  );

  if (!IS_API_ENABLED) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.centre}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Listings need a connection"
            description="Produce you list is shown to buyers through the FarmBridge server. Everything else in the app works offline, but a marketplace is other people."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingState title="Loading your listings" />;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[styles.list, products.length === 0 && styles.listEmpty]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            tintColor={DS.colors.primary}
          />
        }
        ListHeaderComponent={
          products.length > 0 ? (
            <Text style={styles.count}>
              {products.length} listing{products.length === 1 ? '' : 's'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <ListingCard
            product={item}
            onEdit={() => setEditing({ mode: 'edit', product: item })}
            onPublish={() => void publish(item)}
            onRemove={() => void remove(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="basket-outline"
            title="Nothing listed yet"
            description="Add what you have to sell and buyers nearby will see it."
            actionLabel="Add produce"
            onAction={() => setEditing({ mode: 'add' })}
          />
        }
      />

      <View style={styles.footer}>
        <Button
          title="Add produce"
          size="lg"
          icon="add"
          onPress={() => setEditing({ mode: 'add' })}
          accessibilityLabel="Add produce to sell"
        />
      </View>

      <Sheet
        visible={editing !== null}
        onClose={() => (saving ? undefined : setEditing(null))}
        title={editing?.mode === 'edit' ? 'Edit listing' : 'Add produce'}
        subtitle={
          editing?.mode === 'edit'
            ? undefined
            : 'Buyers see the name, price and where it is.'
        }
        scrollable={false}>
        {editing ? (
          <ProductForm
            // Keyed so opening a second listing starts from its own values
            // rather than the last one's.
            key={editing.mode === 'edit' ? editing.product.id : 'new'}
            initial={editing.mode === 'edit' ? editing.product : null}
            submitting={saving}
            onSubmit={(values) => void save(values)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

function ListingCard({
  product,
  onEdit,
  onPublish,
  onRemove,
}: {
  product: ProductDto;
  onEdit: () => void;
  onPublish: () => void;
  onRemove: () => void;
}) {
  const price = (product.priceUsdCents / 100).toFixed(2);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {product.category} · {product.quantity} {product.unit}
            {product.province ? ` · ${product.province}` : ''}
          </Text>
        </View>
        <Text style={styles.price}>
          ${price}
          <Text style={styles.per}>/{product.unit}</Text>
        </Text>
      </View>

      <View style={styles.badges}>
        {product.status === 'ACTIVE' ? <Badge label="Live" tone="success" /> : null}
        {product.status === 'DRAFT' ? <Badge label="Draft" tone="neutral" /> : null}
        {product.status === 'SOLD_OUT' ? <Badge label="Sold out" tone="warning" /> : null}
        {product.status === 'SUSPENDED' ? <Badge label="Suspended" tone="danger" /> : null}
      </View>

      <View style={styles.actions}>
        {product.status !== 'ACTIVE' ? (
          <Button
            title="Publish"
            size="sm"
            style={styles.action}
            onPress={onPublish}
            accessibilityLabel={`Publish ${product.name} to the marketplace`}
          />
        ) : null}
        <Button
          title="Edit"
          variant="outline"
          size="sm"
          style={styles.action}
          onPress={onEdit}
          accessibilityLabel={`Edit ${product.name}`}
        />
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${product.name}`}
          hitSlop={8}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
          <Ionicons name="trash-outline" size={18} color={DS.semantic.danger.fg} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.colors.background },
  centre: { flex: 1, justifyContent: 'center' },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  list: { padding: DS.spacing.md, gap: DS.spacing.sm + 4 },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  count: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.textMuted,
  },

  card: {
    gap: DS.spacing.sm,
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.lg,
    borderWidth: DS.layout.hairline,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: DS.spacing.sm },
  name: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.semibold,
    color: DS.colors.text,
  },
  meta: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
    marginTop: 1,
  },
  price: {
    fontSize: DS.typography.h3.fontSize,
    fontFamily: DS.fontFamily.bold,
    color: DS.colors.text,
  },
  per: {
    fontSize: DS.typography.caption.fontSize,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textMuted,
  },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: DS.spacing.sm },
  action: { flex: 1 },
  remove: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DS.radius.md,
    backgroundColor: DS.semantic.danger.bg,
  },

  footer: {
    paddingHorizontal: DS.spacing.md,
    paddingTop: DS.spacing.sm,
    paddingBottom: DS.spacing.sm,
    borderTopWidth: DS.layout.hairline,
    borderTopColor: DS.colors.border,
    backgroundColor: DS.colors.surface,
  },
});
