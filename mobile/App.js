import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { palettes } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import ForYouScreen from './src/screens/ForYouScreen';
import SearchScreen from './src/screens/SearchScreen';
import AccountScreen from './src/screens/AccountScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused, colors }) {
  const glyph = {
    Home: '⌂',
    'For You': '★',
    Search: '⌕',
    Account: '○',
  }[label];
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {focused ? (
        <View style={{ width: 28, height: 2, backgroundColor: colors.mint, borderRadius: 2, marginBottom: 4 }} />
      ) : (
        <View style={{ height: 6 }} />
      )}
      <Text style={{ color: focused ? colors.mint : colors.inkMuted, fontSize: 16 }}>{glyph}</Text>
    </View>
  );
}

function withColors(Screen, colors) {
  return function Wrapped(props) {
    return <Screen {...props} colors={colors} />;
  };
}

function Tabs({ colors }) {
  const insets = useSafeAreaInsets();
  // Samsung 3-button bar (Back / Home / Recents) sits over a fixed-height tab bar.
  // If the OS reports no inset, still lift the tabs above the system nav.
  const bottomPad =
    insets.bottom > 0 ? Math.max(insets.bottom, 8) : Platform.OS === 'android' ? 48 : 8;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.line,
          height: 52 + bottomPad,
          paddingTop: 6,
          paddingBottom: bottomPad,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          fontWeight: '700',
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} colors={colors} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={withColors(HomeScreen, colors)} />
      <Tab.Screen name="For You" component={withColors(ForYouScreen, colors)} />
      <Tab.Screen name="Search" component={withColors(SearchScreen, colors)} />
      <Tab.Screen name="Account" component={withColors(AccountScreen, colors)} />
    </Tab.Navigator>
  );
}

function Root() {
  const { ready, themeName } = useAuth();
  const colors = palettes[themeName] || palettes.dark;

  if (!ready) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.mint} />
      </View>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    dark: themeName === 'dark',
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.bg,
      text: colors.ink,
      border: colors.line,
      primary: colors.mint,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={colors.statusBar} />
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="Tabs">{() => <Tabs colors={colors} />}</Stack.Screen>
        <Stack.Screen name="Article" component={withColors(ArticleScreen, colors)} />
        <Stack.Screen name="Login" component={withColors(LoginScreen, colors)} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  React.useEffect(() => {
    const hide = SplashScreen?.hideAsync;
    if (typeof hide === 'function') hide().catch(() => {});
  }, []);

  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ArchivoBlack_400Regular,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  const tree = (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== 'web') return tree;

  return (
    <View style={styles.webPage}>
      <View style={styles.webPhone}>{tree}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  webPage: { flex: 1, backgroundColor: '#111', alignItems: 'center' },
  webPhone: {
    width: 390,
    maxWidth: '100%',
    flex: 1,
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2a2a2a',
  },
});
