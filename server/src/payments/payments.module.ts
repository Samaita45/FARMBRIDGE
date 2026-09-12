import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { PaynowProvider } from './providers/paynow.provider';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaynowProvider,
    MockPaymentProvider,
    {
      // One place decides which gateway is live. Swapping providers, or adding
      // a second one later, does not touch checkout or the payments service.
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, PaynowProvider, MockPaymentProvider],
      useFactory: (
        config: ConfigService,
        paynow: PaynowProvider,
        mock: MockPaymentProvider,
      ) => (config.get<string>('PAYMENT_PROVIDER', 'mock') === 'paynow' ? paynow : mock),
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
