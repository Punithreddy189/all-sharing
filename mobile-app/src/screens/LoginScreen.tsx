import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react-native';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp, loginDemo } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    if (isSignUp && !name.trim()) {
      Alert.alert('Required Fields', 'Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUp(email.trim(), password, name.trim());
        Alert.alert('Welcome to EcoShare! 🎉', 'Your account has been created with 50 Welcome EcoPoints!');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error: any) {
      console.error('[LoginScreen] Auth error:', error);
      let message = 'An error occurred during authentication.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please check your credentials.';
      } else if (error?.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (error?.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      } else if (error?.message) {
        message = error.message;
      }
      Alert.alert(isSignUp ? 'Registration Failed' : 'Sign In Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setDemoLoading(true);
      await loginDemo('demo.user@ecoshare.org');
    } catch (error: any) {
      console.error('[LoginScreen] Demo login error:', error);
      Alert.alert('Demo Login Error', error?.message || 'Could not log in as demo user.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Hero */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Leaf size={36} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>EcoShare</Text>
          <Text style={styles.brandSubtitle}>Share More. Waste Less. Connect Locally.</Text>
        </View>

        {/* Card Form */}
        <View style={styles.card}>
          {/* Mode Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.tabButtonText, !isSignUp && styles.tabButtonTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.tabButtonText, isSignUp && styles.tabButtonTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full Name Input (Sign Up only) */}
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Alex Rivera"
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#64748b" />
                ) : (
                  <Eye size={18} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? 'Join EcoShare' : 'Sign In'}
                </Text>
                <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Demo Login */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? (
              <ActivityIndicator color="#059669" />
            ) : (
              <View style={styles.buttonContent}>
                <Sparkles size={18} color="#059669" />
                <Text style={styles.demoButtonText}>Explore with Demo Account</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Secured with Firebase Authentication & Cloud Firestore
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#022c22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#059669'
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#a7f3d0',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b'
  },
  tabButtonTextActive: {
    color: '#059669',
    fontWeight: '700'
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: '#0f172a'
  },
  eyeButton: {
    padding: 8
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8'
  },
  demoButton: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center'
  },
  demoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 8
  },
  footer: {
    marginTop: 20,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 11,
    color: '#a7f3d0',
    textAlign: 'center'
  }
});
