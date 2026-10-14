'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Printer,
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Tag,
  ArrowRight,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ShopAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export function ShopAuthModal({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}: ShopAuthModalProps) {
  const { loginShopOwner, registerShopOwner } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [campusAddress, setCampusAddress] = useState('');
  const [customCode, setCustomCode] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginShopOwner(loginEmail, loginPassword);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerShopOwner({
        shopName,
        ownerName,
        email: regEmail,
        password: regPassword,
        phone,
        campusAddress,
        shopCode: customCode || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zd-auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="zd-auth-modal-backdrop" onClick={onClose} />
      <div className="zd-auth-modal">
        <div className="zd-auth-modal-header">
          <div className="zd-auth-modal-badge">
            <Printer size={18} />
            <span>Print Shop Portal</span>
          </div>
          <button
            type="button"
            className="zd-icon-button zd-auth-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="zd-auth-tabs">
          <button
            type="button"
            className={`zd-auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`zd-auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(null); }}
          >
            Create Shop Account
          </button>
        </div>

        {error && (
          <div className="zd-auth-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="zd-auth-form">
            <div className="zd-auth-field">
              <label htmlFor="login-email">Shop Owner Email</label>
              <div className="zd-auth-input-wrapper">
                <Mail size={16} className="zd-auth-field-icon" />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="owner@campusprint.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="zd-auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="zd-auth-input-wrapper">
                <Lock size={16} className="zd-auth-field-icon" />
                <input
                  id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="zd-btn zd-btn-primary zd-auth-submit"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Kiosk</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="zd-auth-form">
            <div className="zd-auth-grid">
              <div className="zd-auth-field">
                <label htmlFor="shop-name">Shop Name</label>
                <div className="zd-auth-input-wrapper">
                  <Store size={16} className="zd-auth-field-icon" />
                  <input
                    id="shop-name"
                    type="text"
                    required
                    placeholder="Campus FastPrint"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>
              </div>

              <div className="zd-auth-field">
                <label htmlFor="owner-name">Owner / Manager Name</label>
                <div className="zd-auth-input-wrapper">
                  <User size={16} className="zd-auth-field-icon" />
                  <input
                    id="owner-name"
                    type="text"
                    required
                    placeholder="Ramesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="zd-auth-grid">
              <div className="zd-auth-field">
                <label htmlFor="reg-email">Business Email</label>
                <div className="zd-auth-input-wrapper">
                  <Mail size={16} className="zd-auth-field-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    placeholder="print@campus.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="zd-auth-field">
                <label htmlFor="reg-password">Password</label>
                <div className="zd-auth-input-wrapper">
                  <Lock size={16} className="zd-auth-field-icon" />
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="zd-auth-grid">
              <div className="zd-auth-field">
                <label htmlFor="phone">Phone / WhatsApp</label>
                <div className="zd-auth-input-wrapper">
                  <Phone size={16} className="zd-auth-field-icon" />
                  <input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="zd-auth-field">
                <label htmlFor="custom-code">Shop Code (Slug)</label>
                <div className="zd-auth-input-wrapper">
                  <Tag size={16} className="zd-auth-field-icon" />
                  <input
                    id="custom-code"
                    type="text"
                    placeholder="e.g. CAMPUS1"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            <div className="zd-auth-field">
              <label htmlFor="campus-address">Campus / Center Location</label>
              <div className="zd-auth-input-wrapper">
                <MapPin size={16} className="zd-auth-field-icon" />
                <input
                  id="campus-address"
                  type="text"
                  required
                  placeholder="Main Academic Block, Ground Floor (Opp. Library)"
                  value={campusAddress}
                  onChange={(e) => setCampusAddress(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="zd-btn zd-btn-primary zd-auth-submit"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Registering shop...</span>
                </>
              ) : (
                <>
                  <span>Create Print Shop & Open Kiosk</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
