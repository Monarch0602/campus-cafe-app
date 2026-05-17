import 'react-native-gesture-handler'
import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text, View, ActivityIndicator } from 'react-native'
import auth from '@react-native-firebase/auth'
import { CartProvider } from './context/CartContext'
import { supabase } from './lib/supabase'
import { setCurrentUser } from './lib/UserSession'

import SplashScreen from './screens/SplashScreen'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import HomeScreen from './screens/HomeScreen'
import MenuScreen from './screens/MenuScreen'
import CartScreen from './screens/CartScreen'
import PaymentScreen from './screens/PaymentScreen'
import SubscribeScreen from './screens/SubscribeScreen'
import ProfileScreen from './screens/ProfileScreen'
import SuccessScreen from './screens/SuccessScreen'
import OrderHistoryScreen from './screens/OrderHistoryScreen'
import NotificationsScreen from './screens/NotificationsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabNavigator({ route }) {
  const role = route?.params?.role || 'parent'
  const profileData = route?.params?.profileData || {}
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#B85C38',
        tabBarInactiveTintColor: '#9C9C98',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E8E6E0', paddingBottom: 8, paddingTop: 6, height: 62 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} initialParams={{ role, profileData }} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="Menu" component={MenuScreen} initialParams={{ role }} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🍽️</Text> }} />
      <Tab.Screen name="Subscribe" component={SubscribeScreen} initialParams={{ role }} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>📅</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ role }} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null)
  const [initialParams, setInitialParams] = useState({})

  useEffect(() => {
    // Listen to Firebase auth state — runs on app start AND when user signs in/out
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser?.phoneNumber) {
        try {
          // User is signed in with Firebase — look up profile
          const phone = firebaseUser.phoneNumber.replace('+91', '')
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle()

          if (profile) {
            setCurrentUser({
              id: profile.id,
              phone: profile.phone,
              name: profile.full_name,
              role: profile.role,
            })
            const role = profile.role === 'org_admin' ? 'org' : profile.role || 'parent'
            setInitialParams({
              role,
              userId: profile.id,
              phone: profile.phone,
              profileData: { name: profile.full_name, phone: profile.phone },
            })
            setInitialRoute('Main')
          } else {
            // Signed in but no profile yet — go to register
            setInitialRoute('Splash')
          }
        } catch (err) {
          console.log('Session restore error:', err)
          setInitialRoute('Splash')
        }
      } else {
        // No Firebase session — go to splash
        setInitialRoute('Splash')
      }
    })
    return () => unsubscribe()
  }, [])

  // Show loading while checking auth state
  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#B85C38' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    )
  }

  return (
    <CartProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={TabNavigator} initialParams={initialParams} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  )
}
