import { useEffect, useState } from 'react';
import { auth } from '../api/services';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({ name: '', phone: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    auth.profile().then((r) => setProfile({ name: r.data.name, phone: r.data.phone || '', email: r.data.email }));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault(); setSavingProfile(true);
    try {
      const { data } = await auth.updateProfile({ name: profile.name, phone: profile.phone });
      toast.success('Profile updated!');
      // Update local auth context name
      setProfile((p) => ({ ...p, name: data.name, phone: data.phone || '' }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('New passwords do not match'); return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    setSavingPw(true);
    try {
      await auth.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  const roleColor = { admin: '#6366f1', driver: '#10b981', customer: '#f59e0b' };
  const roleBg = { admin: '#e0e7ff', driver: '#dcfce7', customer: '#fef9c3' };

  return (
    <>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Settings ⚙️</div>
          <div className="page-subtitle">Manage your profile and account security</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>

        {/* Profile card */}
        <div className="card" style={{ animation: 'slideUp 0.4s ease both' }}>
          <div className="card-header">
            <div className="card-title">👤 My Profile</div>
          </div>
          <div className="card-body">
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '1.5rem', flexShrink: 0,
              }}>
                {profile.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{profile.email}</div>
                <span style={{
                  display: 'inline-block', marginTop: 4,
                  background: roleBg[user?.role], color: roleColor[user?.role],
                  borderRadius: 999, padding: '0.15rem 0.65rem',
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
                }}>
                  {user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">📞 Phone Number</label>
                <input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+63 900 000 0000"
                />
                {!profile.phone && (
                  <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 3 }}>
                    ⚠️ No phone number yet — add one so drivers can contact you!
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input value={profile.email} disabled style={{ background: 'var(--surface2)', color: 'var(--text-3)' }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 3 }}>Email cannot be changed</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? '⏳ Saving...' : '💾 Save Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Change password card */}
        <div className="card" style={{ animation: 'slideUp 0.4s ease 0.08s both' }}>
          <div className="card-header">
            <div className="card-title">🔒 Change Password</div>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password" placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password" placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password" placeholder="••••••••"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  required
                />
                {passwords.confirm && passwords.newPassword !== passwords.confirm && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 3 }}>
                    ✕ Passwords do not match
                  </div>
                )}
                {passwords.confirm && passwords.newPassword === passwords.confirm && passwords.confirm.length >= 6 && (
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 3 }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPw}>
                {savingPw ? '⏳ Updating...' : '🔒 Change Password'}
              </button>
            </form>

            <div style={{ marginTop: '1.25rem', background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-2)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Password tips:</div>
              <div>• At least 6 characters</div>
              <div>• Mix letters and numbers</div>
              <div>• Never share your password</div>
            </div>
          </div>
        </div>

        {/* Account info card */}
        <div className="card" style={{ animation: 'slideUp 0.4s ease 0.16s both' }}>
          <div className="card-header">
            <div className="card-title">ℹ️ Account Info</div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Account Type', value: user?.role?.toUpperCase(), icon: '🪪' },
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—', icon: '📅' },
              { label: 'Status', value: 'Active', icon: '✅' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{icon} {label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
