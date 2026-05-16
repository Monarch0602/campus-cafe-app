import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, ActivityIndicator
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { getCurrentUser, clearCurrentUser } from '../lib/UserSession'

const ROLE_CONFIG = {
  parent: { emoji: '👨‍👩‍👧', label: 'Parent Account' },
  teacher: { emoji: '👩‍🏫', label: 'Teacher Account' },
}

export default function ProfileScreen({ navigation, route }) {
  const role = route?.params?.role || 'parent'
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG['parent']

  const [userId, setUserId] = useState(null)
  const [profile, setProfile] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  // Get real user from session (or fallback to auth)
  useEffect(() => {
    const user = getCurrentUser()
    if (user?.id) {
      setUserId(user.id)
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setUserId(session.user.id)
        else setLoading(false)
      })
    }
  }, [])

  useFocusEffect(useCallback(() => {
    if (userId) fetchProfile()
  }, [userId]))

  async function fetchProfile() {
    setLoading(true)
    try {
      // Run both queries in parallel instead of sequentially
      const [profileResult, childResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        role === 'parent'
          ? supabase.from('children').select('*').eq('parent_id', userId)
          : Promise.resolve({ data: [] })
      ])

      if (profileResult.data) setProfile(profileResult.data)
      if (childResult.data) setChildren(childResult.data)
    } catch (e) { }
    setLoading(false)
  }

  async function signOut() {
    clearCurrentUser()
    await supabase.auth.signOut()
    navigation.replace('Splash')
  }

  function getTimeSlot(notes) {
    if (!notes) return 'Morning (9AM–10AM)'
    if (notes.includes('evening')) return 'Evening (12PM–1PM)'
    return 'Morning (9AM–10AM)'
  }

  function getRollNumber(notes) {
    if (!notes) return 'N/A'
    const match = notes.match(/Roll: (\S+)/)
    return match ? match[1] : 'N/A'
  }

  function getBoard(notes) {
    if (!notes) return 'N/A'
    const match = notes.match(/Board: (\w+)/)
    return match ? match[1] : 'N/A'
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={{ fontSize: 32 }}>{cfg.emoji}</Text>
          </View>
          <Text style={s.name}>{profile?.full_name || 'Campus Cafe User'}</Text>
          <Text style={s.roleLabel}>{cfg.label}</Text>
          {profile?.phone && <Text style={s.phone}>📱 {profile.phone}</Text>}
        </View>

        {loading ? (
          <ActivityIndicator color="#B85C38" style={{ padding: 20 }} />
        ) : (
          <>
            {role === 'parent' && children.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Child Information</Text>
                {children.map(child => (
                  <View key={child.id} style={s.infoCard}>
                    <View style={s.infoRow}><Text style={s.infoIcon}>👶</Text><View style={s.infoContent}><Text style={s.infoLabel}>Name</Text><Text style={s.infoVal}>{child.full_name}</Text></View></View>
                    <View style={s.infoRow}><Text style={s.infoIcon}>🏫</Text><View style={s.infoContent}><Text style={s.infoLabel}>Class</Text><Text style={s.infoVal}>{child.class || 'Not set'}</Text></View></View>
                    <View style={s.infoRow}><Text style={s.infoIcon}>🔢</Text><View style={s.infoContent}><Text style={s.infoLabel}>Roll Number</Text><Text style={s.infoVal}>{getRollNumber(child.dietary_notes)}</Text></View></View>
                    <View style={s.infoRow}><Text style={s.infoIcon}>📚</Text><View style={s.infoContent}><Text style={s.infoLabel}>Education Board</Text><Text style={s.infoVal}>{getBoard(child.dietary_notes)}</Text></View></View>
                    <View style={s.infoRow}><Text style={s.infoIcon}>⏰</Text><View style={s.infoContent}><Text style={s.infoLabel}>Collection Slot</Text><Text style={s.infoVal}>{getTimeSlot(child.dietary_notes)}</Text></View></View>
                  </View>
                ))}
              </View>
            )}

            {role === 'teacher' && profile && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>Teacher Information</Text>
                <View style={s.infoCard}>
                  <View style={s.infoRow}><Text style={s.infoIcon}>👩‍🏫</Text><View style={s.infoContent}><Text style={s.infoLabel}>Name</Text><Text style={s.infoVal}>{profile.full_name || 'Not set'}</Text></View></View>
                  <View style={s.infoRow}><Text style={s.infoIcon}>📱</Text><View style={s.infoContent}><Text style={s.infoLabel}>Phone</Text><Text style={s.infoVal}>{profile.phone || 'Not set'}</Text></View></View>
                </View>
              </View>
            )}
          </>
        )}

        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickCard} onPress={() => navigation.navigate('OrderHistory', { role })}>
            <Text style={s.quickIcon}>📋</Text>
            <Text style={s.quickLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard} onPress={() => navigation.navigate('Notifications')}>
            <Text style={s.quickIcon}>🔔</Text>
            <Text style={s.quickLabel}>Alerts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickCard}>
            <Text style={s.quickIcon}>💬</Text>
            <Text style={s.quickLabel}>Help</Text>
          </TouchableOpacity>
        </View>

        <View style={s.menuSection}>
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate('OrderHistory', { role })}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>📋</Text></View>
            <Text style={s.rowLabel}>Order History</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Notifications')}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>🔔</Text></View>
            <Text style={s.rowLabel}>Notifications</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>💬</Text></View>
            <Text style={s.rowLabel}>Help & Support</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row} onPress={signOut}>
            <View style={s.rowIcon}><Text style={{ fontSize: 18 }}>🚪</Text></View>
            <Text style={[s.rowLabel, { color: '#B85C38' }]}>Sign Out</Text>
            <Text style={s.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAF8' },
  hero: { alignItems: 'center', padding: 32, paddingTop: 40 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#B85C38', marginBottom: 14 },
  name: { fontSize: 22, fontWeight: '700', color: '#1A1A18' },
  roleLabel: { fontSize: 13, color: '#B85C38', marginTop: 4, fontWeight: '500' },
  phone: { fontSize: 13, color: '#9C9C98', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9C9C98', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8E6E0', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F3EE', gap: 12 },
  infoIcon: { fontSize: 20, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9C9C98', marginBottom: 2 },
  infoVal: { fontSize: 14, fontWeight: '500', color: '#1A1A18' },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  quickCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8E6E0', gap: 6 },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, color: '#5C5C58', fontWeight: '500' },
  menuSection: { borderTopWidth: 1, borderTopColor: '#E8E6E0', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E0', backgroundColor: '#fff' },
  rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F5F3EE', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, color: '#1A1A18' },
  rowArrow: { fontSize: 20, color: '#9C9C98' },
})
