import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Input, Sheet } from '@/components/design-system';
import { PriceField } from '@/components/transport/price-field';
import { DS } from '@/constants/design-system';
import type { NearbyTransportRequest } from '@/services/api/transport.api';

interface BidSheetProps {
  /** The job being bid on, or null when the sheet is closed. */
  job: NearbyTransportRequest | null;
  onClose: () => void;
  onSubmit: (amountUsd: number, note: string, etaMinutes?: number) => Promise<void>;
}

/**
 * A transporter's offer on one load.
 *
 * THE GUIDE PRICE IS A GUIDE. It is what the backend's rate table makes of the
 * distance, the weight and the goods — the same figure the farmer was shown —
 * and it is offered as a starting point rather than pre-filled as the answer.
 * Anchoring a transporter to the platform's number is how a marketplace stops
 * being one.
 *
 * REMOUNTED PER JOB. The sheet is keyed on the request id, so opening it for a
 * second load starts empty instead of carrying the previous offer over — which
 * is the kind of thing that gets a wrong price sent.
 */
export function BidSheet({ job, onClose, onSubmit }: BidSheetProps) {
  return (
    <Sheet
      visible={job !== null}
      onClose={onClose}
      title="Make an offer"
      subtitle={job ? `${job.goodsDescription} · ${Math.round(job.distanceMeters / 1000)} km` : undefined}>
      {job ? <BidForm key={job.id} job={job} onSubmit={onSubmit} /> : null}
    </Sheet>
  );
}

function BidForm({
  job,
  onSubmit,
}: {
  job: NearbyTransportRequest;
  onSubmit: (amountUsd: number, note: string, etaMinutes?: number) => Promise<void>;
}) {
  const guide = Math.round(job.estimatedPriceUsdCents / 100);

  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [eta, setEta] = useState('');
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState(false);

  const amountError = amount !== null && amount > 0 ? undefined : 'Name your price';
  const etaMinutes = eta.trim() ? Number(eta) : undefined;
  const etaError =
    eta.trim() && (!Number.isFinite(etaMinutes) || (etaMinutes ?? 0) <= 0)
      ? 'Enter the number of minutes, or leave it empty'
      : undefined;

  const send = async () => {
    setTouched(true);
    if (amountError || etaError || amount === null) return;
    setSending(true);
    try {
      await onSubmit(amount, note.trim(), etaMinutes);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.body}>
      <PriceField
        value={amount}
        onChange={setAmount}
        suggested={guide}
        error={touched ? amountError : undefined}
      />

      <Input
        label="How soon can you collect?"
        value={eta}
        onChangeText={setEta}
        keyboardType="number-pad"
        placeholder="Minutes, e.g. 90"
        error={touched ? etaError : undefined}
      />

      <Input
        label="Anything the farmer should know"
        value={note}
        onChangeText={setNote}
        placeholder="I have a tarpaulin and can load from the field."
        multiline
        numberOfLines={3}
      />

      <Text style={styles.note}>
        The farmer sees your offer alongside any others and chooses. FarmBridge
        does not take payment — you settle that between you.
      </Text>

      <Button
        title={amount ? `Send offer of $${amount}` : 'Send offer'}
        size="lg"
        loading={sending}
        onPress={() => void send()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: DS.spacing.md, paddingTop: DS.spacing.xs },
  note: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: DS.fontFamily.regular,
    color: DS.colors.textSoft,
  },
});
