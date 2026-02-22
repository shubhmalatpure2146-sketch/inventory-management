import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'stocker'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await register(formData.email, formData.password, formData.name, formData.role);
        setIsLogin(true);
        setError('');
        setFormData({ email: '', password: '', name: '', role: 'stocker' });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background industrial-noise flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-space text-4xl font-bold text-foreground uppercase tracking-tight mb-2">
            Inventory System
          </h1>
          <p className="font-manrope text-muted-foreground">Industrial Management Platform</p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-sm p-6">
          <div className="flex gap-2 mb-6 bg-secondary/50 p-1 rounded-sm">
            <button
              data-testid="login-tab"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-sm font-space text-sm uppercase transition-all ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="inline-block w-4 h-4 mr-2" />
              Login
            </button>
            <button
              data-testid="register-tab"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-sm font-space text-sm uppercase transition-all ${
                !isLogin
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(70,130,180,0.3)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="inline-block w-4 h-4 mr-2" />
              Register
            </button>
          </div>

          {error && (
            <div data-testid="error-message" className="mb-4 p-3 bg-destructive/20 border border-destructive/50 rounded-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive-foreground" />
              <span className="text-sm text-destructive-foreground">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Full Name
                </label>
                <input
                  data-testid="name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Email
              </label>
              <input
                data-testid="email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Password
              </label>
              <input
                data-testid="password-input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block font-manrope text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Role
                </label>
                <select
                  data-testid="role-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 bg-background/50 border border-border rounded-sm font-manrope text-foreground focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors"
                  required={!isLogin}
                >
                  <option value="stocker">Stocker</option>
                  <option value="inventory_manager">Inventory Manager</option>
                </select>
              </div>
            )}

            <button
              data-testid="submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-sm font-space text-sm uppercase font-medium shadow-[0_0_15px_rgba(70,130,180,0.3)] hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="font-manrope text-xs text-muted-foreground">
            Demo Credentials: manager@test.com / stocker@test.com (password: demo123)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
