import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { PostItemScreen } from '../screens/PostItemScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatDetailScreen } from '../screens/ChatDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { Home, PlusCircle, Inbox, User, MessageSquare } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();

const HomeStackNavigator: React.FC = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
        headerTintColor: '#059669',
        headerShadowVisible: false
      }}
    >
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notification Center' }}
      />
    </HomeStack.Navigator>
  );
};

const ChatStackNavigator: React.FC = () => {
  return (
    <ChatStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
        headerTintColor: '#059669',
        headerShadowVisible: false
      }}
    >
      <ChatStack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ headerShown: false }}
      />
      <ChatStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route }: any) => ({
          headerTitle: route?.params?.recipientName || 'Chat'
        })}
      />
    </ChatStack.Navigator>
  );
};

const ProfileStackNavigator: React.FC = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#ffffff'
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: '#0f172a'
        },
        headerTintColor: '#059669',
        headerShadowVisible: false
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          headerTitle: 'EcoProfile'
        }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerTitle: 'Edit Profile'
        }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerTitle: 'Settings & Preferences'
        }}
      />
    </ProfileStack.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { requests } = useApp();
  const { currentUser, loading } = useAuth();

  console.log('🚀 NAV USER:', currentUser ? currentUser.userId : 'null');
  console.log('AppNavigator loading:', loading);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const pendingIncomingCount = requests.filter(
    (r) => r.ownerId === currentUser?.userId && r.status === 'Pending'
  ).length;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0'
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '700',
          color: '#0f172a'
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        }
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />
        }}
      />

      <Tab.Screen
        name="Post"
        component={PostItemScreen}
        options={{
          headerTitle: 'Share an Item',
          tabBarLabel: 'Share Item',
          tabBarIcon: ({ color, size }) => <PlusCircle size={size || 22} color={color} />
        }}
      />

      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          headerTitle: 'Item Requests',
          tabBarLabel: 'Requests',
          tabBarBadge: pendingIncomingCount > 0 ? pendingIncomingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#059669', fontSize: 10 },
          tabBarIcon: ({ color, size }) => <Inbox size={size || 22} color={color} />
        }}
      />

      <Tab.Screen
        name="MessagesTab"
        component={ChatStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size || 22} color={color} />
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          headerShown: false,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
