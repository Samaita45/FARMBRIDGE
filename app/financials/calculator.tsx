import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { CROPS } from '@/constants/zimbabwe-data';

function calc(
  hectares: number,
  yieldKg: number,
  pricePerKg: number,
  seed: number,
  fertilizer: number,
  labor: number,
  other: number
) {
  const gross = yieldKg * pricePerKg;
  const costs = seed + fertilizer + labor + other;
  const net = gross - costs;
  const roi = costs > 0 ? (net / costs) * 100 : 0;
  const breakEven = yieldKg > 0 ? costs / yieldKg : 0;
  return { gross, costs, net, roi, breakEven };
}

export default function ProfitCalculatorScreen() {
  const [hectares, setHectares] = useState('1');
  const [yieldKg, setYieldKg] = useState('8000');
  const [pricePerKg, setPricePerKg] = useState('0.85');
  const [seed, setSeed] = useState('120');
  const [fertilizer, setFertilizer] = useState('350');
  const [labor, setLabor] = useState('200');
  const [other, setOther] = useState('80');

  const h = parseFloat(hectares) || 0;
  const y = parseFloat(yieldKg) || 0;
  const p = parseFloat(pricePerKg) || 0;

  const result = useMemo(
    () =>
      calc(
        h,
        y,
        p,
        parseFloat(seed) || 0,
        parseFloat(fertilizer) || 0,
        parseFloat(labor) || 0,
        parseFloat(other) || 0
      ),
    [h, y, p, seed, fertilizer, labor, other]
  );

  const tomato = CROPS.find((c) => c.id === 'tomatoes');
  const onion = CROPS.find((c) => c.id === 'onions');

  const compare = useMemo(() => {
    if (!tomato || !onion) return null;
    const t = calc(h, 12000 * h, tomato.currentPriceUSD, 150 * h, 400 * h, 250 * h, 100 * h);
    const o = calc(h, 10000 * h, onion.currentPriceUSD, 80 * h, 300 * h, 200 * h, 80 * h);
    return { tomato: t, onion: o };
  }, [h, tomato, onion]);

  return (
    <ScrollView className="flex-1 bg-surface p-4" keyboardShouldPersistTaps="handled">
      <Text className="font-sans text-gray-600">Estimate profit before planting</Text>

      <Field label="Hectares" value={hectares} onChange={setHectares} />
      <Field label="Expected yield (kg)" value={yieldKg} onChange={setYieldKg} />
      <Field label="Market price ($/kg)" value={pricePerKg} onChange={setPricePerKg} />
      <Field label="Seed cost ($)" value={seed} onChange={setSeed} />
      <Field label="Fertilizer ($)" value={fertilizer} onChange={setFertilizer} />
      <Field label="Labor ($)" value={labor} onChange={setLabor} />
      <Field label="Other costs ($)" value={other} onChange={setOther} />

      <View className="mt-4 rounded-2xl bg-white p-4">
        <Row label="Gross revenue" value={`$${result.gross.toFixed(0)}`} />
        <Row label="Total costs" value={`$${result.costs.toFixed(0)}`} />
        <Row label="Net profit" value={`$${result.net.toFixed(0)}`} highlight={result.net >= 0} />
        <Row label="ROI" value={`${result.roi.toFixed(1)}%`} />
        <Row label="Break-even price" value={`$${result.breakEven.toFixed(2)}/kg`} />
      </View>

      {compare ? (
        <View className="mt-4 rounded-2xl bg-primary/10 p-4">
          <Text className="font-sans-semibold text-dark">Tomatoes vs Onions ({h} ha)</Text>
          <Text className="mt-2 font-sans text-sm text-gray-700">
            🍅 Tomatoes: ${compare.tomato.net.toFixed(0)} net · ROI {compare.tomato.roi.toFixed(0)}%
          </Text>
          <Text className="mt-1 font-sans text-sm text-gray-700">
            🧅 Onions: ${compare.onion.net.toFixed(0)} net · ROI {compare.onion.roi.toFixed(0)}%
          </Text>
          <Text className="mt-2 font-sans text-xs text-primary">
            {compare.tomato.net >= compare.onion.net
              ? 'Tomatoes look more profitable this season at current prices.'
              : 'Onions look more profitable this season at current prices.'}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <Text className="mt-3 font-sans-semibold text-dark">{label}</Text>
      <TextInput
        className="mt-1 rounded-xl bg-white px-4 py-3 font-sans"
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
      />
    </>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between border-b border-gray-50 py-2">
      <Text className="font-sans text-gray-600">{label}</Text>
      <Text className={`font-sans-semibold ${highlight === false ? 'text-error' : 'text-dark'}`}>
        {value}
      </Text>
    </View>
  );
}
