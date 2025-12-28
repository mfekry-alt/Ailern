import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { ROUTES } from '@/lib/constants';
import { Button, Card } from '@/components/ui';

type Status = 'idle' | 'loading' | 'success' | 'expired' | 'error';

export const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState<string>('');
    const isBusy = status === 'loading';

    const canVerify = useMemo(() => Boolean(token), [token]);
    const canResend = useMemo(() => Boolean(email), [email]);

    useEffect(() => {
        const verify = async () => {
            if (!canVerify) return;
            setStatus('loading');
            setMessage('');
            try {
                const response = await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
                const apiMessage = (response.data as any)?.message;
                setStatus('success');
                setMessage(apiMessage || 'Your email has been verified successfully.');
            } catch (err: any) {
                const apiMessage = err?.response?.data?.message as string | undefined;
                const code = err?.response?.data?.code as string | undefined;
                if (code === 'TOKEN_EXPIRED' || err?.response?.status === 410) {
                    setStatus('expired');
                    setMessage(apiMessage || 'This verification link has expired.');
                    return;
                }
                setStatus('error');
                setMessage(apiMessage || 'Invalid verification link.');
            }
        };

        void verify();
    }, [canVerify, token]);

    const handleResend = async () => {
        setStatus('loading');
        setMessage('');
        try {
            const response = await api.post(ENDPOINTS.AUTH.VERIFY_EMAIL, { email, resend: true });
            const apiMessage = (response.data as any)?.message;
            setStatus('success');
            setMessage(apiMessage || 'If an account exists with this email, a verification link has been sent.');
        } catch (err: any) {
            const apiMessage = err?.response?.data?.message as string | undefined;
            setStatus('error');
            setMessage(apiMessage || 'Failed to resend verification email. Please try again.');
        }
    };

    const title =
        status === 'success'
            ? 'Confirmation Success'
            : status === 'expired'
                ? 'Link Expired'
                : status === 'error'
                    ? 'Verification Error'
                    : 'Verify Your Email';

    const description =
        status === 'loading'
            ? 'Processing your request...'
            : message || (canVerify ? 'Confirming your email address.' : canResend ? 'Resend your verification email.' : 'Missing verification information.');

    return (
        <Card variant="elevated" padding="lg">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-secondary-900 mb-2">{title}</h1>
                <p className="text-secondary-600 mb-6">{description}</p>

                {status === 'success' && (
                    <div className="space-y-3">
                        <Link to={ROUTES.DASHBOARD}>
                            <Button fullWidth>Go to Dashboard</Button>
                        </Link>
                        <Link to={ROUTES.LOGIN}>
                            <Button fullWidth variant="outline">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                )}

                {status === 'expired' && (
                    <div className="space-y-3">
                        {canResend ? (
                            <Button fullWidth onClick={handleResend} isLoading={isBusy}>
                                Resend Confirmation
                            </Button>
                        ) : (
                            <Link to={ROUTES.LOGIN}>
                                <Button fullWidth>Back to Login</Button>
                            </Link>
                        )}
                    </div>
                )}

                {(status === 'idle' || status === 'error') && (
                    <div className="space-y-3">
                        {canResend && (
                            <Button fullWidth onClick={handleResend} isLoading={isBusy}>
                                Resend Confirmation
                            </Button>
                        )}
                        <Link to={ROUTES.LOGIN}>
                            <Button fullWidth variant="outline">
                                Back to Login
                            </Button>
                        </Link>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="space-y-3">
                        <Button fullWidth isLoading>
                            Loading
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};
