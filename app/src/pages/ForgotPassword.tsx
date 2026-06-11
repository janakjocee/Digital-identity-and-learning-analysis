import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setDevResetUrl('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      setDevResetUrl(response.data.devInfo?.resetUrl || '');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Unable to request a password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <KeyRound className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <CardTitle>Reset your password</CardTitle>
          <p className="text-sm text-slate-500">Enter your account email to receive reset instructions.</p>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
              {devResetUrl && (
                <Link to={new URL(devResetUrl).pathname + new URL(devResetUrl).search}>
                  <Button className="w-full">Open development reset link</Button>
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset instructions'}
              </Button>
            </form>
          )}
          <Link to="/login" className="mt-6 flex items-center justify-center text-sm text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
