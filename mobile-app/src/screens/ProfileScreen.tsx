import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Sparkles, Leaf, Award, ShieldCheck, LogOut, Edit3, Settings, ChevronRight } from 'lucide-react-native';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { currentUser, logout } = useAuth();
  const { items } = useApp();

  const userItemsCount = items.filter((i) => i.ownerId === currentUser?.userId).length;
  const userEcoPoints = currentUser?.ecoPoints || 0;

  // Impact calculations
  const kgWasteSaved = Math.round(userEcoPoints * 0.45);
  const co2Prevented = Math.round(userEcoPoints * 1.2);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to sign out of EcoShare?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRow}>
          {currentUser?.avatarUrl ? (
            <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{currentUser?.name?.[0] || 'U'}</Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{currentUser?.name || 'Eco Member'}</Text>
            <Text style={styles.userEmail}>{currentUser?.email}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color="#059669" />
              <Text style={styles.verifiedText}>Verified EcoShare Member</Text>
            </View>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Edit3 size={15} color="#059669" />
          <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
        </TouchableOpacity>

        {/* EcoPoints Banner */}
        <View style={styles.pointsBanner}>
          <View style={styles.pointsLeft}>
            <Sparkles size={24} color="#d97706" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.pointsValue}>{userEcoPoints}</Text>
              <Text style={styles.pointsLabel}>Total EcoPoints</Text>
            </View>
          </View>

          <View style={styles.tierPill}>
            <Award size={14} color="#b45309" />
            <Text style={styles.tierText}>
              {userEcoPoints > 500 ? 'Eco Champion' : userEcoPoints > 200 ? 'Green Contributor' : 'Seedling'}
            </Text>
          </View>
        </View>
      </View>

      {/* Impact Stats Grid */}
      <Text style={styles.sectionTitle}>Environmental Impact 🌍</Text>
      <View style={styles.impactGrid}>
        <View style={styles.impactCard}>
          <Leaf size={22} color="#059669" />
          <Text style={styles.impactValue}>{userItemsCount}</Text>
          <Text style={styles.impactLabel}>Items Shared</Text>
        </View>

        <View style={styles.impactCard}>
          <Text style={styles.impactEmoji}>♻️</Text>
          <Text style={styles.impactValue}>{kgWasteSaved} kg</Text>
          <Text style={styles.impactLabel}>Waste Diverted</Text>
        </View>

        <View style={styles.impactCard}>
          <Text style={styles.impactEmoji}>🌳</Text>
          <Text style={styles.impactValue}>{co2Prevented} kg</Text>
          <Text style={styles.impactLabel}>CO₂ Prevented</Text>
        </View>
      </View>

      {/* Account & Settings Options */}
      <Text style={styles.sectionTitle}>Account & Settings</Text>
      <View style={styles.actionCard}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.actionRowLeft}>
            <Edit3 size={18} color="#059669" />
            <Text style={styles.actionRowText}>Edit Profile</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.actionRowLeft}>
            <Settings size={18} color="#0284c7" />
            <Text style={styles.actionRowText}>Preferences & Notifications</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <View style={styles.actionRowLeft}>
            <LogOut size={18} color="#ef4444" />
            <Text style={[styles.actionRowText, { color: '#ef4444' }]}>Sign Out</Text>
          </View>
          <ChevronRight size={18} color="#fca5a5" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e2e8f0'
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff'
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingVertical: 9,
    marginBottom: 14,
    gap: 6
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669'
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fef3c7'
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#b45309'
  },
  pointsLabel: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600'
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f'
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginTop: 6
  },
  impactGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  impactEmoji: {
    fontSize: 20,
    marginBottom: 2
  },
  impactValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4
  },
  impactLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b'
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9'
  }
});
