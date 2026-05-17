import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    SafeAreaView, Alert, ActivityIndicator, Image
} from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'
import { notifyUser } from '../lib/Notifications'
import { getCurrentUser } from '../lib/UserSession'

const COLLECTION_SLOTS = [
    { key: 'morning', label: 'Morning Collection', time: '9:00 AM – 10:00 AM', emoji: '🌅' },
    { key: 'evening', label: 'Evening Collection', time: '12:00 PM – 1:00 PM', emoji: '🌞' },
]

function getTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
}
function formatTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}
function getCatEmoji(cat) {
    return { breakfast: '🥐', lunch: '🍱', snacks: '🍟', beverage: '☕' }[cat] || '🍽️'
}

export default function CartScreen({ navigation, route }) {
    const role = route?.params?.role || 'parent'

    const { cart, addToCart, removeFromCart, clearCart } = useCart()

    // Get REAL user ID from Supabase Auth
    const [userId, setUserId] = useState(null)
    const [slot, setSlot] = useState('morning')
    const [placing, setPlacing] = useState(false)

    useEffect(() => {
        const user = getCurrentUser()
        if (user?.id) setUserId(user.id)
        else {
            // Fallback to auth session if available
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) setUserId(session.user.id)
            })
        }
    }, [])

    const total = cart.reduce((s, i) => s + (Number(i.price) * i.qty), 0)

    async function placeOrder() {
        if (cart.length === 0) {
            Alert.alert('Empty Cart', 'Please add items before placing an order.')
            return
        }
        if (!userId) {
            Alert.alert('Sign In Required', 'Please sign in via OTP to place an order.')
            navigation.replace('Login')
            return
        }
        setPlacing(true)
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: userId,
                    order_type: 'pre_order',
                    status: 'pending',
                    delivery_date: getTomorrow(),
                    collection_slot: slot,
                    subtotal: total,
                    gst_amount: 0,
                    total_amount: total,
                    notes: `Role: ${role} | Collection: ${slot}`,
                })
                .select()
                .single()

            if (orderError) throw orderError

            await supabase.from('order_items').insert(
                cart.map(item => ({
                    order_id: order.id,
                    menu_item_id: item.id,
                    quantity: item.qty,
                    unit_price: Number(item.price),
                }))
            )

            clearCart()

            // Send notification to user
            await notifyUser(
                userId,
                '🎉 Order Placed Successfully!',
                `Your order #${order.id.slice(0, 8).toUpperCase()} for ₹${total} has been received. Collection ${slot === 'morning' ? '9–10 AM' : '12–1 PM'} tomorrow.`,
                'order_placed',
                order.id
            )

            navigation.navigate('Payment', { total, role, userId, orderId: order.id })
        } catch (err) {
            console.log('Order error:', err)
            Alert.alert('Order Failed', err.message || 'Could not place your order. Please try again.')
        } finally {
            setPlacing(false)
        }
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <View>
                    <Text style={s.title}>Your Order</Text>
                    <Text style={s.sub}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
                </View>
            </View>

            <FlatList
                data={cart}
                keyExtractor={i => i.id}
                ListHeaderComponent={
                    <View>
                        <View style={s.dateBanner}>
                            <Text style={s.dateBannerIcon}>📅</Text>
                            <View>
                                <Text style={s.dateBannerLabel}>Collection Date</Text>
                                <Text style={s.dateBannerVal}>{formatTomorrow()}</Text>
                                <Text style={s.dateBannerNote}>Pre-orders must be placed 1 day in advance</Text>
                            </View>
                        </View>

                        <View style={s.slotSection}>
                            <Text style={s.slotTitle}>Choose Collection Slot</Text>
                            <View style={s.slotRow}>
                                {COLLECTION_SLOTS.map(sl => (
                                    <TouchableOpacity key={sl.key} style={[s.slotCard, slot === sl.key && s.slotCardActive]} onPress={() => setSlot(sl.key)}>
                                        <Text style={s.slotEmoji}>{sl.emoji}</Text>
                                        <Text style={[s.slotLabel, slot === sl.key && s.slotLabelActive]}>{sl.label}</Text>
                                        <Text style={[s.slotTime, slot === sl.key && { color: '#B85C38' }]}>{sl.time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={s.idNotice}>
                            <Text style={s.idNoticeIcon}>🪪</Text>
                            <Text style={s.idNoticeText}>
                                Student identification is mandatory at the time of collection and must be verified using the respective ID card.
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={s.item}>
                        <View style={s.itemEmoji}>
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                            ) : (
                                <Text style={{ fontSize: 26 }}>{getCatEmoji(item.category)}</Text>
                            )}
                        </View>
                        <View style={s.itemInfo}>
                            <Text style={s.itemName}>{item.name}</Text>
                            <Text style={s.itemPrice}>₹{item.price} × {item.qty} = ₹{Number(item.price) * item.qty}</Text>
                        </View>
                        <View style={s.qtyCtrl}>
                            <TouchableOpacity onPress={() => removeFromCart(item)}>
                                <Text style={s.qtyBtn}>−</Text>
                            </TouchableOpacity>
                            <Text style={s.qtyNum}>{item.qty}</Text>
                            <TouchableOpacity onPress={() => addToCart(item)}>
                                <Text style={s.qtyBtn}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={s.empty}>
                        <Text style={{ fontSize: 40 }}>🛒</Text>
                        <Text style={s.emptyText}>Your cart is empty</Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={s.emptyLink}>Browse menu</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListFooterComponent={
                    cart.length > 0 ? (
                        <View>
                            <View style={s.summary}>
                                <View style={s.summaryRow}>
                                    <Text style={s.summaryLabel}>Total Amount</Text>
                                    <Text style={s.summaryVal}>₹{total}</Text>
                                </View>
                                <Text style={s.gstNote}>Inclusive of GST</Text>
                            </View>
                            <TouchableOpacity style={[s.btn, placing && s.btnDisabled]} onPress={placeOrder} disabled={placing}>
                                {placing ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Proceed to Payment · ₹{total}</Text>}
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E0' },
    back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A18' },
    sub: { fontSize: 12, color: '#9C9C98' },
    dateBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8E6E0' },
    dateBannerIcon: { fontSize: 24 },
    dateBannerLabel: { fontSize: 11, color: '#9C9C98', marginBottom: 2 },
    dateBannerVal: { fontSize: 15, fontWeight: '700', color: '#1A1A18' },
    dateBannerNote: { fontSize: 11, color: '#B85C38', marginTop: 4 },
    slotSection: { paddingHorizontal: 16, marginBottom: 12 },
    slotTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A18', marginBottom: 10 },
    slotRow: { flexDirection: 'row', gap: 10 },
    slotCard: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E0', padding: 12, alignItems: 'center', backgroundColor: '#fff', gap: 4 },
    slotCardActive: { borderColor: '#B85C38', backgroundColor: '#FFF9F7' },
    slotEmoji: { fontSize: 20 },
    slotLabel: { fontSize: 12, fontWeight: '600', color: '#1A1A18', textAlign: 'center' },
    slotLabelActive: { color: '#B85C38' },
    slotTime: { fontSize: 11, color: '#9C9C98', textAlign: 'center' },
    idNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginBottom: 8, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12 },
    idNoticeIcon: { fontSize: 18, flexShrink: 0 },
    idNoticeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E0', backgroundColor: '#fff' },
    itemEmoji: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '500', color: '#1A1A18' },
    itemPrice: { fontSize: 12, color: '#B85C38', marginTop: 2 },
    qtyCtrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5E6DF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 12 },
    qtyBtn: { fontSize: 18, color: '#B85C38', fontWeight: '600' },
    qtyNum: { fontSize: 14, fontWeight: '600', color: '#B85C38' },
    empty: { alignItems: 'center', padding: 48, gap: 12 },
    emptyText: { fontSize: 16, color: '#9C9C98' },
    emptyLink: { fontSize: 14, color: '#B85C38', fontWeight: '500' },
    summary: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E8E6E0' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    summaryLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A18' },
    summaryVal: { fontSize: 15, fontWeight: '700', color: '#B85C38' },
    gstNote: { fontSize: 11, color: '#9C9C98' },
    btn: { margin: 16, backgroundColor: '#B85C38', borderRadius: 12, padding: 16, alignItems: 'center' },
    btnDisabled: { backgroundColor: '#D4A898' },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
