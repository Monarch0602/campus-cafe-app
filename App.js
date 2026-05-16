import 'react-native-gesture-handler'
import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Text } from 'react-native'
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
import AddressScreen from './screens/AddressScreen'

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
  useEffect(() => {
    // Try to restore user session on app start
    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            setCurrentUser({
              id: profile.id,
              phone: profile.phone,
              name: profile.full_name,
              role: profile.role,
            })
          }
        }
      } catch (err) {
        console.log('Session load error:', err)
      }
    }
    loadSession()
    useEffect(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp()
        return true
      })
      return () => backHandler.remove()
    }, [])
  }, [])

  return (
    <CartProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Address" component={AddressScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  )
}
