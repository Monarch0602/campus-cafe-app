import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator, RefreshControl
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/UserSession'

const TYPE_CONFIG = {
    order_placed: { emoji: '🎉', bg: '#D8F3DC' },
    order_confirmed: { emoji: '✅', bg: '#DBEAFE' },
    order_prepared: { emoji: '👨‍🍳', bg: '#EDE9FE' },
    order_ready: { emoji: '🍱', bg: '#FFEDD5' },
    order_collected: { emoji: '✓', bg: '#D1FAE5' },
    menu_update: { emoji: '📋', bg: '#FEF3C7' },
    payment: { emoji: '💳', bg: '#D1FAE5' },
    general: { emoji: '🔔', bg: '#F5F3EE' },
}

function timeAgo(dateStr) {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now - date
    const mins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMs / 3600000)
    const days = Math.floor(diffMs / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function NotificationsScreen({ navigation }) {
    const [userId, setUserId] = useState(null)
    const [notifications, setNotifs] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        const user = getCurrentUser()
        if (user?.id) setUserId(user.id)
        else setLoading(false)
    }, [])

    useFocusEffect(useCallback(() => {
        if (userId) fetchNotifications()
    }, [userId]))

    async function fetchNotifications() {
        setLoading(true)
        try {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50)
            if (data) setNotifs(data)
        } catch (e) { }
        setLoading(false)
    }

    async function markAllAsRead() {
        if (!userId) return
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
        fetchNotifications()
    }

    async function markAsRead(id) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }

    async function onRefresh() {
        setRefreshing(true)
        await fetchNotifications()
        setRefreshing(false)
    }

    async function clearAll() {
        if (!userId) return
        await supabase.from('notifications').delete().eq('user_id', userId)
        fetchNotifications()
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.title}>Notifications</Text>
                    <Text style={s.sub}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={s.markAllBtn}>
                        <Text style={s.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#B85C38" />
                    <Text style={s.loadingText}>Loading...</Text>
                </View>
            ) : !userId ? (
                <View style={s.center}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
                    <Text style={s.emptyTitle}>Please sign in</Text>
                    <Text style={s.emptyText}>Sign in to see your notifications.</Text>
                </View>
            ) : notifications.length === 0 ? (
                <View style={s.center}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🔕</Text>
                    <Text style={s.emptyTitle}>No notifications yet</Text>
                    <Text style={s.emptyText}>You'll see alerts about your orders and updates here.</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={n => n.id}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B85C38" />}
                    renderItem={({ item }) => {
                        const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general
                        return (
                            <TouchableOpacity
                                style={[s.notif, !item.is_read && s.notifUnread]}
                                onPress={() => markAsRead(item.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[s.icon, { backgroundColor: cfg.bg }]}>
                                    <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                                </View>
                                <View style={s.notifContent}>
                                    <View style={s.notifTop}>
                                        <Text style={[s.notifTitle, !item.is_read && s.notifTitleUnread]} numberOfLines={1}>
                                            {item.title}
                                        </Text>
                                        <Text style={s.notifTime}>{timeAgo(item.created_at)}</Text>
                                    </View>
                                    <Text style={s.notifBody} numberOfLines={2}>{item.body}</Text>
                                </View>
                                {!item.is_read && <View style={s.unreadDot} />}
                            </TouchableOpacity>
                        )
                    }}
                    ListFooterComponent={
                        notifications.length > 0 ? (
                            <TouchableOpacity onPress={clearAll} style={s.clearAllBtn}>
                                <Text style={s.clearAllText}>Clear all notifications</Text>
                            </TouchableOpacity>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8E6E0', backgroundColor: '#fff' },
    back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A18' },
    sub: { fontSize: 12, color: '#9C9C98', marginTop: 1 },
    markAllBtn: { backgroundColor: '#F5E6DF', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    markAllText: { fontSize: 11, color: '#B85C38', fontWeight: '600' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { fontSize: 14, color: '#9C9C98', marginTop: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A18', marginBottom: 8 },
    emptyText: { fontSize: 13, color: '#9C9C98', textAlign: 'center', lineHeight: 20 },
    notif: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F3EE', backgroundColor: '#fff' },
    notifUnread: { backgroundColor: '#FFF9F7' },
    icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    notifContent: { flex: 1 },
    notifTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    notifTitle: { flex: 1, fontSize: 14, color: '#1A1A18', fontWeight: '500' },
    notifTitleUnread: { fontWeight: '700' },
    notifTime: { fontSize: 11, color: '#9C9C98', marginLeft: 8 },
    notifBody: { fontSize: 13, color: '#5C5C58', lineHeight: 18 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#B85C38', marginTop: 6, marginLeft: 4 },
    clearAllBtn: { padding: 20, alignItems: 'center' },
    clearAllText: { fontSize: 13, color: '#9C9C98' },
})