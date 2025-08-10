'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { PaymentLayout } from '../site-layouts/PaymentLayout'; // Assuming this layout exists
import { Button } from '../components/ui/button'; // Assuming you have a Button component
import { Loader2, Lock } from 'lucide-react'; // For loading/secure icons

// --- Configuration ---
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
const LOCAL_TOKEN_URL = import.meta.env.VITE_LOCAL_GET_TOKEN_URL ?? 'http://localhost:3001/api/get-token';
const isLocalDev = import.meta.env.MODE === 'development';

const FLOW_URLS = {
    bv_payment_status: {
        local: import.meta.env.VITE_BV_PAYMENT_STATUS_LOCAL,
        powerpages: '/_api/cloudflow/v1.0/trigger/f03b3e9b-0672-f011-bec2-6045bd5dca91'
    },
    payment_intent_creation: {
        local: import.meta.env.VITE_PAYMENT_INTENT_LOCAL,
        powerpages: '/_api/cloudflow/v1.0/trigger/564677df-c675-f011-b4cc-002248ae768f'
    },
    pp_payment_creation: {
        local: import.meta.env.VITE_PP_PAYMENT_CREATION_LOCAL,
        powerpages: '/_api/cloudflow/v1.0/trigger/5af8c913-d275-f011-b4cc-002248ad99ee'
    },
    pp_payment_update: {
        local: import.meta.env.VITE_PP_PAYMENT_UPDATE_LOCAL,
        powerpages: '/_api/cloudflow/v1.0/trigger/483cfd9c-d375-f011-b4cc-6045bd5dca91'
    }
};

// --- Helper Functions (Token Caching) ---
let _cachedLocalToken: string | null = null;
let _cachedLocalTokenAt = 0;
const LOCAL_TOKEN_TTL = 4 * 60 * 1000; // 4 minutes

async function getLocalAccessToken(): Promise<string> {
    if (_cachedLocalToken && Date.now() - _cachedLocalTokenAt < LOCAL_TOKEN_TTL) {
        return _cachedLocalToken;
    }
    const res = await fetch(LOCAL_TOKEN_URL, { method: 'POST' });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to get local access token: ${res.status} ${txt}`);
    }
    const j = await res.json().catch(() => ({}));
    const token = j.accessToken ?? j.access_token ?? j.token;
    if (!token || typeof token !== 'string') {
        throw new Error('get-token did not return an access token.');
    }
    _cachedLocalToken = token;
    _cachedLocalTokenAt = Date.now();
    return token;
}

// --- API Call Abstraction ---
async function callFlow(urlLocal: string, urlPP: string, body: object) {
    if (isLocalDev) {
        const token = await getLocalAccessToken();
        const res = await fetch(urlLocal, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => '');
            throw new Error(`Local flow call failed: ${res.status} ${txt}`);
        }
        return await res.json();
    } else {
        const response = await (window as any).shell.ajaxSafePost({
            type: 'POST',
            url: urlPP,
            data: { eventData: JSON.stringify(body) }
        });
        return JSON.parse(response);
    }
}

// --- Checkout Form Component ---
// This component contains the card element and payment logic.
const CheckoutForm = ({ amount, description, bvPaymentId, onPaymentSuccess, onPaymentFailure }: {
    amount: number;
    description: string;
    bvPaymentId: string;
    onPaymentSuccess: () => void;
    onPaymentFailure: (errorMsg: string) => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // This function is now nested and accepts the correct ID
    async function updatePaymentStatus(ppPaymentId: string, statusCode: number) {
        await callFlow(
            FLOW_URLS.pp_payment_update.local,
            FLOW_URLS.pp_payment_update.powerpages,
            { pp_payment_id: ppPaymentId, pp_paymentstatus: statusCode }
        );
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) {
            return; // Stripe.js has not yet loaded.
        }

        setIsProcessing(true);
        setErrorMessage(null);
        
        let newPpPaymentId: string | null = null; // Variable to hold the new ID

        try {
            // 1. Create Stripe PaymentIntent via your backend flow
            const intentResponse = await callFlow(
                FLOW_URLS.payment_intent_creation.local,
                FLOW_URLS.payment_intent_creation.powerpages,
                { amount: Math.round(amount * 100), currency: 'cad' }
            );
            const clientSecret = intentResponse.client_secret;
            if (!clientSecret) {
                throw new Error("Failed to create Payment Intent.");
            }

            // 2. Create pp_payment record in Dataverse and CAPTURE its ID
            const ppPaymentResponse = await callFlow(
                FLOW_URLS.pp_payment_creation.local,
                FLOW_URLS.pp_payment_creation.powerpages,
                {
                    userid: isLocalDev ? import.meta.env.VITE_LOCAL_DEV_USER_ID : undefined,
                    bv_payment_id: bvPaymentId,
                    pp_paymentidentifier: intentResponse.id,
                    pp_paymentmethod: 'stripe'
                }
            );
            
            // **FIX**: Store the new ID returned from the flow
            newPpPaymentId = ppPaymentResponse.pp_payment_id;
            if (!newPpPaymentId) {
                throw new Error("Failed to get new payment record ID from Dataverse.");
            }

            // 3. Confirm the payment with Stripe.js using the CardElement
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error("Card element not found.");
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: cardElement },
            });

            if (error) {
                throw new Error(error.message || "An unknown payment error occurred.");
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                // **FIX**: Use the new ID to update the status
                await updatePaymentStatus(newPpPaymentId, 3); // 3 = Succeeded
                onPaymentSuccess();
            } else {
                 // **FIX**: Use the new ID to update the status
                await updatePaymentStatus(newPpPaymentId, 2); // 2 = Failed
                throw new Error("Payment did not succeed. Status: " + (paymentIntent?.status || 'unknown'));
            }

        } catch (err: any) {
            console.error(err);
             // **FIX**: If we have a new ID, mark it as failed.
            if (newPpPaymentId) {
                await updatePaymentStatus(newPpPaymentId, 2); // 2 = Failed
            }
            setErrorMessage(err.message);
            onPaymentFailure(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                color: '#011d41',
                fontFamily: 'system-ui, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': { color: '#6b7280' },
            },
            invalid: { color: '#a4262c', iconColor: '#a4262c' },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Complete Your Payment</h2>
                <p className="text-gray-600 mb-2">{description}</p>
                <p className="font-semibold text-lg mb-6">Amount: ${(amount).toFixed(2)} CAD</p>
            </div>
            <div className="p-4 border border-gray-300 rounded-lg">
                <CardElement options={cardElementOptions} />
            </div>
            {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-[#a4262c] text-white text-lg font-semibold px-8 py-4 h-auto hover:bg-[#8b1f24] disabled:bg-gray-400"
            >
                {isProcessing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                    <><Lock className="mr-2 h-5 w-5" /> Pay Now</>
                )}
            </Button>
        </form>
    );
};

// --- Main Page Component ---
export default function PaymentPage() {
    const [searchParams] = useSearchParams();
    const bvPaymentId = searchParams.get('id');

    const [status, setStatus] = useState<'loading' | 'invalid' | 'paid' | 'pending' | 'error'>('loading');
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState<string>('');
    
    useEffect(() => {
        if (!bvPaymentId) {
            setStatus('invalid');
            return;
        }
        checkPaymentStatus(bvPaymentId);
    }, [bvPaymentId]);

    async function checkPaymentStatus(pid: string) {
        setStatus('loading');
        try {
            const res = await callFlow(
                FLOW_URLS.bv_payment_status.local,
                FLOW_URLS.bv_payment_status.powerpages,
                { pid }
            );
            if (res.result === 'invalid') setStatus('invalid');
            else if (res.result === 'paid') setStatus('paid');
            else if (res.result === 'pending') {
                setAmount(res.amount);
                setDescription(res.description);
                setStatus('pending');
            } else {
                setStatus('error'); // Handle unexpected result from flow
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }

    const renderStatusMessage = (icon: string, title: string, message: string) => (
        <div className="text-center">
            <div className="text-5xl mb-4">{icon}</div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-gray-600">{message}</p>
        </div>
    );

    return (
        <PaymentLayout>
            <div className="min-h-screen flex items-center justify-center bg-[#efefef] p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                    {status === 'loading' && renderStatusMessage('⏳', 'Loading...', 'Checking payment status, please wait.')}
                    {status === 'invalid' && renderStatusMessage('❌', 'Invalid Link', 'This payment link is not valid. Please check the URL.')}
                    {status === 'paid' && renderStatusMessage('✅', 'Payment Complete', 'This payment has already been successfully processed.')}
                    {status === 'error' && renderStatusMessage('🔥', 'Error', 'Something went wrong. Please refresh and try again.')}
                    {status === 'pending' && bvPaymentId && (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                amount={amount}
                                description={description}
                                bvPaymentId={bvPaymentId}
                                onPaymentSuccess={() => setStatus('paid')}
                                onPaymentFailure={() => setStatus('error')}
                            />
                        </Elements>
                    )}
                </div>
            </div>
        </PaymentLayout>
    );
}
