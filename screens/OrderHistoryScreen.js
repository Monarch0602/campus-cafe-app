import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/UserSession'

const STATUS_COLOR = {
    pending: { bg: '#FEF3C7', text: '#92400E' },
    confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
    preparing: { bg: '#EDE9FE', text: '#5B21B6' },
    delivered: { bg: '#D1FAE5', text: '#065F46' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

const CAT_EMOJI = { breakfast: '🥐', lunch: '🍱', snacks: '🍟', beverage: '☕' }

function getCatEmoji(cat) {
    return { breakfast: '🥐', lunch: '🍱', snacks: '🍟', beverage: '☕' }[cat] || '🍽️'
}

export default function OrderHistoryScreen({ navigation, route }) {
    const role = route?.params?.role || 'parent'
    const [userId, setUserId] = useState(null)
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const roleLabel = { parent: 'Parent', teacher: 'Teacher' }[role] || 'User'

    // Get logged-in user from session (or fallback to auth)
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
        if (userId) fetchOrders()
    }, [userId]))

    async function fetchOrders() {
        setLoading(true)
        try {
            const { data } = await supabase
                .from('orders')
                .select('*, order_items(quantity, unit_price, menu_items(name, category, image_url))')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
            if (data) setOrders(data)
        } catch (e) { }
        setLoading(false)
    }
    async function onRefresh() {
        setRefreshing(true)
        await fetchOrders()
        setRefreshing(false)
    }

    const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount), 0)

    function goOrderNow() {
        navigation.navigate('Main', { screen: 'Home', params: { role } })
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <View>
                    <Text style={s.title}>Order History</Text>
                    <Text style={s.sub}>{roleLabel} Account</Text>
                </View>
            </View>

            {orders.length > 0 && (
                <View style={s.summaryBar}>
                    <View style={s.summaryItem}>
                        <Text style={s.summaryNum}>{orders.length}</Text>
                        <Text style={s.summaryLabel}>Total Orders</Text>
                    </View>
                    <View style={s.summaryDivider} />
                    <View style={s.summaryItem}>
                        <Text style={s.summaryNum}>₹{totalSpent}</Text>
                        <Text style={s.summaryLabel}>Total Spent</Text>
                    </View>
                    <View style={s.summaryDivider} />
                    <View style={s.summaryItem}>
                        <Text style={s.summaryNum}>{orders.filter(o => o.status === 'delivered').length}</Text>
                        <Text style={s.summaryLabel}>Collected</Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={s.center}>
                    <ActivityIndicator size="large" color="#B85C38" />
                    <Text style={s.loadingText}>Loading your orders...</Text>
                </View>
            ) : !userId ? (
                <View style={s.center}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
                    <Text style={s.emptyTitle}>Please sign in</Text>
                    <Text style={s.emptyText}>Sign in via OTP to see your order history.</Text>
                    <TouchableOpacity style={s.orderNowBtn} onPress={() => navigation.replace('Login')}>
                        <Text style={s.orderNowText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            ) : orders.length === 0 ? (
                <View style={s.center}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>🍽️</Text>
                    <Text style={s.emptyTitle}>No orders yet</Text>
                    <Text style={s.emptyText}>Your order history will appear here after you place your first order.</Text>
                    <TouchableOpacity style={s.orderNowBtn} onPress={goOrderNow}>
                        <Text style={s.orderNowText}>Order Now</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={o => o.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: order }) => {
                        const sc = STATUS_COLOR[order.status] || STATUS_COLOR.pending
                        const shortId = '#' + order.id.slice(0, 8).toUpperCase()
                        const items = order.order_items || []
                        return (
                            <View style={s.card}>
                                <View style={s.cardHeader}>
                                    <View>
                                        <Text style={s.orderId}>{shortId}</Text>
                                        <Text style={s.orderDate}>
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {' · '}
                                            {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                                        <Text style={[s.statusText, { color: sc.text }]}>{order.status.replace(/_/g, ' ')}</Text>
                                    </View>
                                </View>
                                <View style={s.itemsList}>
                                    {items.map((item, i) => (
                                        <View key={i} style={s.itemRow}>
                                            {item.menu_items?.image_url ? (
                                                <Image source={{ uri: item.menu_items.image_url }} style={{ width: 24, height: 24, borderRadius: 6 }} />
                                            ) : (
                                                <Text style={s.itemEmoji}>{CAT_EMOJI[item.menu_items?.category] || '🍽️'}</Text>
                                            )}
                                            <Text style={s.itemName} numberOfLines={1}>{item.menu_items?.name || 'Item'}</Text>
                                            <Text style={s.itemQty}>×{item.quantity}</Text>
                                            <Text style={s.itemPrice}>₹{item.unit_price * item.quantity}</Text>
                                        </View>
                                    ))}
                                </View>
                                <View style={s.cardFooter}>
                                    <View>
                                        <Text style={s.orderType}>{order.order_type?.replace(/_/g, ' ')}</Text>
                                        <Text style={s.collectionDate}>📅 Collect: {order.delivery_date}</Text>
                                        <Text style={s.collectionSlot}>
                                            {order.notes?.includes('morning') ? '🌅 Morning 9–10AM' : '🌞 Evening 12–1PM'}
                                        </Text>
                                    </View>
                                    <Text style={s.totalAmount}>₹{order.total_amount}</Text>
                                </View>
                            </View>
                        )
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#B85C38"
                            colors={['#B85C38']}
                        />
                    }
                />
            )}
        </SafeAreaView>
    )
}
function getCategoryEmoji(cat) {
    return { thali: '🍛', rice: '🍚', roti: '🥙', snacks: '🍟', dessert: '🍰', beverage: '☕' }[cat] || '🍽️'
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E8E6E0', backgroundColor: '#fff' },
    back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A18' },
    sub: { fontSize: 12, color: '#B85C38', marginTop: 1, fontWeight: '500' },
    summaryBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E6E0', paddingVertical: 14 },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryNum: { fontSize: 18, fontWeight: '700', color: '#B85C38' },
    summaryLabel: { fontSize: 11, color: '#9C9C98', marginTop: 2 },
    summaryDivider: { width: 1, backgroundColor: '#E8E6E0' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    loadingText: { fontSize: 14, color: '#9C9C98', marginTop: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A18', marginBottom: 8 },
    emptyText: { fontSize: 13, color: '#9C9C98', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    orderNowBtn: { backgroundColor: '#B85C38', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
    orderNowText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8E6E0', marginBottom: 12, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F5F3EE' },
    orderId: { fontSize: 14, fontWeight: '700', color: '#1A1A18' },
    orderDate: { fontSize: 11, color: '#9C9C98', marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    itemsList: { padding: 14, gap: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    itemEmoji: { fontSize: 16, width: 24 },
    itemName: { flex: 1, fontSize: 13, color: '#1A1A18' },
    itemQty: { fontSize: 12, color: '#9C9C98' },
    itemPrice: { fontSize: 13, fontWeight: '500', color: '#B85C38' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#FAFAF8', borderTopWidth: 1, borderTopColor: '#F5F3EE' },
    orderType: { fontSize: 11, color: '#9C9C98', textTransform: 'capitalize', marginBottom: 2 },
    collectionDate: { fontSize: 11, color: '#9C9C98' },
    collectionSlot: { fontSize: 11, color: '#9C9C98', marginTop: 2 },
    totalAmount: { fontSize: 16, fontWeight: '700', color: '#1A1A18' },
})
