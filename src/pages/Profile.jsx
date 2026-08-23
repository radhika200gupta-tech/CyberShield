import { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiUser, FiMail, FiShield, FiActivity, FiEdit2, FiSave, FiX, FiCheckCircle, FiClock, FiLock, FiSmartphone } from 'react-icons/fi';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Demo User',
    email: user?.email || 'demo@cybershield.test',
  });

  const handleSave = () => {
    if (updateUser) {
      updateUser(formData);
    }
    setIsEditing(false);
    addToast('Profile updated successfully', 'success');
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || 'Demo User',
      email: user?.email || 'demo@cybershield.test',
    });
    setIsEditing(false);
  };

  const recentActivity = [
    { id: 1, action: 'Logged in from new device (Windows)', time: '2 hours ago', icon: FiClock },
    { id: 2, action: 'Phishing Simulator completed (Score: 4/4)', time: '1 day ago', icon: FiActivity },
    { id: 3, action: 'Screenshot Analyzer opened', time: '2 days ago', icon: FiShield },
    { id: 4, action: 'Profile updated', time: '1 week ago', icon: FiEdit2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Your Profile"
        description="Manage your CyberShield account information."
        icon={<FiUser />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Security */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 flex flex-col items-center text-center border-border">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-display font-bold mb-4 shadow-lg">
              {user?.avatarInitials || 'DU'}
            </div>
            <h2 className="text-xl font-medium text-text-primary mb-1">{formData.name}</h2>
            <p className="text-sm text-text-secondary mb-4">{formData.email}</p>
            
            <div className="w-full flex justify-between items-center px-4 py-2.5 bg-surface border border-border rounded-lg mb-2">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Plan</span>
              <span className="text-sm font-semibold text-accent">{user?.plan || 'Pro'}</span>
            </div>
            <div className="w-full flex justify-between items-center px-4 py-2.5 bg-surface border border-border rounded-lg">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</span>
              <span className="text-sm font-semibold text-success flex items-center gap-1.5"><FiCheckCircle size={14} /> Active</span>
            </div>
          </Card>

          <Card className="p-6 border-border bg-bg-elevated">
            <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <FiShield className="text-accent" /> Security Summary
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FiLock className="text-success mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Password</p>
                  <p className="text-xs text-text-secondary">Protected</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiSmartphone className="text-warning mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                  <p className="text-xs text-text-secondary">Not configured</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FiClock className="text-text-muted mt-0.5 shrink-0" size={16} />
                <div>
                  <p className="text-sm font-medium text-text-primary">Last Login</p>
                  <p className="text-xs text-text-secondary">Today, 09:41 AM (Mumbai)</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Profile & Activity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
              <h3 className="text-lg font-medium text-text-primary">Account Information</h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <FiEdit2 className="mr-2" size={14} /> Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="sm" onClick={handleCancel} className="flex-1 sm:flex-none">
                    <FiX className="mr-2" size={14} /> Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleSave} className="flex-1 sm:flex-none">
                    <FiSave className="mr-2" size={14} /> Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-5 max-w-md">
              <Input 
                label="Full Name" 
                icon={FiUser} 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={!isEditing}
              />
              <Input 
                label="Email Address" 
                type="email"
                icon={FiMail} 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isEditing}
              />
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="text-lg font-medium text-text-primary mb-4 flex items-center gap-2 pb-4 border-b border-border">
              <FiActivity className="text-accent" /> Recent Activity
            </h3>
            <div className="space-y-0">
              {recentActivity.map((activity, index) => (
                <div key={activity.id} className={`flex items-start gap-4 py-3.5 ${index !== recentActivity.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <activity.icon size={14} className="text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-text-primary font-medium">{activity.action}</p>
                    <p className="text-xs text-text-muted mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
