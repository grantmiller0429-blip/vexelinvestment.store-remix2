export type HostedPaymentProvider = 'not-configured' | 'stripe' | 'paystack' | 'flutterwave';

export const getPaymentProviderStatus = () => {
  const provider = (import.meta.env.VITE_PAYMENT_PROVIDER ?? 'not-configured') as HostedPaymentProvider;

  if (provider === 'not-configured') {
    return {
      ready: false,
      message: 'Hosted payment provider not configured yet. Add VITE_PAYMENT_PROVIDER to enable secure card checkout.',
    };
  }

  return {
    ready: true,
    message: `${provider.toUpperCase()} is configured for hosted card checkout.`,
  };
};

export const getHostedPaymentCheckoutUrl = () => {
  const provider = (import.meta.env.VITE_PAYMENT_PROVIDER ?? 'not-configured') as HostedPaymentProvider;

  if (provider === 'not-configured') {
    return '#';
  }

  if (provider === 'stripe') {
    return import.meta.env.VITE_STRIPE_CHECKOUT_URL || '#';
  }

  if (provider === 'paystack') {
    return import.meta.env.VITE_PAYSTACK_CHECKOUT_URL || '#';
  }

  if (provider === 'flutterwave') {
    return import.meta.env.VITE_FLUTTERWAVE_CHECKOUT_URL || '#';
  }

  return '#';
};
