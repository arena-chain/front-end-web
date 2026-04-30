import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Modal, Button } from '../ui/core';
import { Shield, CreditCard, Lock } from 'lucide-react';
import paymentService from '../../services/paymentService';
import { getStripePublishableKey } from '../../lib/stripe';

const stripePromise = loadStripe(getStripePublishableKey());

interface PaymentFormProps {
  amount: number;
  onSuccess: (payload: { paymentIntentId: string; paymentStatus: string }) => Promise<void> | void;
  onCancel: () => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card form is not ready yet. Please wait a moment and try again.');
        setProcessing(false);
        return;
      }

      // 1. Create PaymentIntent on the server
      const { clientSecret } = await paymentService.createPaymentIntent(amount);

      // 2. Confirm the payment on the client

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setProcessing(false);
      } else {
        if (result.paymentIntent?.status === 'succeeded') {
          await onSuccess({
            paymentIntentId: result.paymentIntent.id,
            paymentStatus: result.paymentIntent.status,
          });
          return;
        }

        setError(`Payment not completed (status: ${result.paymentIntent?.status || 'unknown'}).`);
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-muted uppercase tracking-widest font-bold">Card Details</span>
          <div className="flex gap-2">
            <Lock size={14} className="text-primary" />
            <span className="text-[10px] text-primary uppercase font-bold tracking-widest">Encrypted</span>
          </div>
        </div>
        
        <div className="p-4 bg-zinc-900 border border-white/5 rounded-md">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#71717a',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button 
          type="submit" 
          disabled={!stripe || processing} 
          isLoading={processing}
          className="w-full bg-primary text-black hover:bg-primary/90 py-6"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay ${amount.toFixed(2)}
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          disabled={processing}
          className="w-full text-zinc-500 hover:text-white"
        >
          Cancel
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
        <Shield size={12} />
        <span>Secured by Stripe Terminal</span>
      </div>
    </form>
  );
};

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onSuccess: (payload: { paymentIntentId: string; paymentStatus: string }) => Promise<void> | void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ isOpen, onClose, amount, onSuccess }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Secure Payment"
      size="md"
    >
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Finalize_Transaction</h2>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Authorization required for asset transmission</p>
        </div>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onClose} />
        </Elements>
      </div>
    </Modal>
  );
};
