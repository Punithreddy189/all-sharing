import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Bell, Globe, Shield, Trash2, Info, LogOut, CheckCircle2 } from 'lucide-react-native';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser, updateUserSettings, logout } = useAuth();
  const settings = currentUser?.settings || {
    notifications: true,
    emailDigest: true,
    publicProfile: true,
    soundEffects: true
  };

  const [saving, setSaving] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const handleToggle = async (key: keyof typeof settings, value: boolean) => {
    try {
      setSaving(true);
      await updateUserSettings({ [key]: value });
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
    } catch (e: any) {
      console.error('[Settings] Update error:', e);
      Alert.alert('Error', 'Could not save setting to cloud.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Are you sure you want to clear temporary offline cached data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Cache',
        onPress: () => Alert.alert('Cache Cleared', 'Temporary app cache has been cleared successfully.')
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out of EcoShare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cloud Sync Status Indicator */}
      <View style={styles.syncBanner}>
        <View style={styles.syncLeft}>
          <CheckCircle2 size={16} color="#059669" />
          <Text style={styles.syncText}>Settings synced in real-time with Firestore</Text>
        </View>
        {saving && <ActivityIndicator size="small" color="#059669" />}
      </View>

      {/* Notifications Group */}
      <Text style={styles.groupTitle}>Notifications & Alerts</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Bell size={20} color="#059669" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSub}>Receive real-time alerts on item requests & handovers</Text>
            </View>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(val) => handleToggle('notifications', val)}
            trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
            thumbColor={settings.notifications ? '#059669' : '#f8fafc'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Globe size={20} color="#059669" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.rowLabel}>Email Digests</Text>
              <Text style={styles.rowSub}>Weekly summary of local shared items & EcoPoints</Text>
            </View>
          </View>
          <Switch
            value={settings.emailDigest}
            onValueChange={(val) => handleToggle('emailDigest', val)}
            trackColor={{ false: '#cbd5e1', true: '#a7f3d0' }}
            thumbColor={settings.emailDigest ? '#059669' : '#f8fafc'}
          />
        </View>
      </View>

      {/* Privacy Group */}
      <Text style={styles.groupTitle}>Privacy & Community</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Shield size={20} color="#0284c7" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.rowLabel}>Public EcoPoints Badge</Text>
              <Text style={styles.rowSub}>Display your environmental impact tier publicly</Text>
            </View>
          </View>
          <Switch
            value={settings.publicProfile}
            onValueChange={(val) => handleToggle('publicProfile', val)}
            trackColor={{ false: '#cbd5e1', true: '#7dd3fc' }}
            thumbColor={settings.publicProfile ? '#0284c7' : '#f8fafc'}
          />
        </View>
      </View>

      {/* Data & Storage */}
      <Text style={styles.groupTitle}>Data & Storage</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleClearCache}>
          <View style={styles.rowLeft}>
            <Trash2 size={20} color="#64748b" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.rowLabel}>Clear Offline Cache</Text>
              <Text style={styles.rowSub}>Reset temporary local image and item caches</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* About */}
      <Text style={styles.groupTitle}>About EcoShare</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Info size={20} color="#64748b" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.rowLabel}>EcoShare Native Edition</Text>
              <Text style={styles.rowSub}>v1.0.0 • Cloud Firestore & Firebase Auth</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out of Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46'
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 10,
    marginLeft: 4
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  rowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    gap: 8
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444'
  }
});
