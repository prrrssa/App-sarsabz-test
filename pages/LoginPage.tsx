import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { APP_NAME, LOGO_ICON_PATH, LOGO_TEXT_PATH } from '../constants';
import Card from '../components/common/Card';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('نام کاربری یا رمز عبور نامعتبر است.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900 dark:to-gray-900 p-4">
      <div className="flex flex-col items-center mb-6">
        <img src={LOGO_ICON_PATH} alt={`${APP_NAME} آیکون`} className="w-24 h-24 md:w-28 md:h-28 mb-3 rounded-full shadow-lg" />
        <img src={LOGO_TEXT_PATH} alt={APP_NAME} className="h-10 md:h-12" />
      </div>
      <Card title="ورود به سیستم" className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="نام کاربری"
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="رمز عبور"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <Button type="submit" variant="secondary" className="w-full" disabled={loading}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;