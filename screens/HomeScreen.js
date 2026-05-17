import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Image, BackHandler, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Beverage']
const CAT_EMOJI = { All: '🍽️', Breakfast: '🥐', Lunch: '🍱', Snacks: '🍟', Beverage: '☕' }

const FALLBACK_MENU = []

function getTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
}
function formatTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function HomeScreen({ navigation, route }) {
    const role = route?.params?.role || 'parent'
    const profileData = route?.params?.profileData || {}

    // Use shared cart context
    const { cart, addToCart, cartCount } = useCart()

    const [menuItems, setMenuItems] = useState(FALLBACK_MENU)
    const [category, setCategory] = useState('All')
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const showSubscribe = role === 'parent' || role === 'org'
    const [tab, setTab] = useState('pre_order')

    // Handle hardware back button — exit app from Home, otherwise allow normal back
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                BackHandler.exitApp()
                return true  // tells Android "we handled it, don't do default"
            }

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress)

            return () => subscription.remove()
        }, [])
    )

    useFocusEffect(
        useCallback(() => { fetchTomorrowMenu() }, [])
    )

    async function fetchTomorrowMenu() {
        setLoading(true)
        try {
            const { data } = await supabase
                .from('daily_menu').select('*, menu_items(*)').eq('menu_date', getTomorrow())
            if (data && data.length > 0) {
                const visible = data
                    .filter(d => d.menu_items?.is_available !== false)
                    .map(d => ({ ...d.menu_items, is_special: d.is_special }))
                if (visible.length > 0) setMenuItems(visible)
            }
        } catch (e) { }
        setLoading(false)
    }

    async function onRefresh() {
        setRefreshing(true)
        await fetchTomorrowMenu()
        setRefreshing(false)
    }

    const filtered = category === 'All' ? menuItems : menuItems.filter(i => i.category === category.toLowerCase())
    const special = menuItems.find(i => i.is_special)
    const roleLabel = { org: 'Organization', parent: 'Parent', teacher: 'Teacher' }[role]
    const timeSlot = profileData?.slot === 'evening' ? '12PM – 1PM' : '9AM – 10AM'

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#B85C38"
                        colors={['#B85C38']}
                    />
                }
            >
                <View style={s.header}>
                    <View>
                        <Text style={s.greeting}>Good morning 👋</Text>
                        <Text style={s.title}>Campus Cafe</Text>
                    </View>
                    <View style={s.roleBadge}><Text style={s.roleText}>{roleLabel}</Text></View>
                </View>

                <View style={s.deliveryBanner}>
                    <View style={s.deliveryLeft}>
                        <Text style={s.deliveryIcon}>📅</Text>
                        <View>
                            <Text style={s.deliveryTitle}>Ordering for Tomorrow</Text>
                            <Text style={s.deliveryDate}>{formatTomorrow()}</Text>
                        </View>
                    </View>
                    <View style={s.slotBadge}><Text style={s.slotText}>⏰ {timeSlot}</Text></View>
                </View>

                <View style={s.tabs}>
                    <TouchableOpacity style={[s.tab, tab === 'pre_order' && s.tabActive]} onPress={() => setTab('pre_order')}>
                        <Text style={[s.tabText, tab === 'pre_order' && s.tabTextActive]}>Pre-order</Text>
                    </TouchableOpacity>
                    {showSubscribe && (
                        <TouchableOpacity style={[s.tab, tab === 'subscribe' && s.tabActive]} onPress={() => setTab('subscribe')}>
                            <Text style={[s.tabText, tab === 'subscribe' && s.tabTextActive]}>Subscribe</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {tab === 'pre_order' && (
                    <View>
                        {loading && (
                            <View style={s.syncBar}>
                                <ActivityIndicator size="small" color="#B85C38" />
                                <Text style={s.syncText}>Loading tomorrow's menu...</Text>
                            </View>
                        )}
                        {special && (
                            <TouchableOpacity style={s.special} onPress={() => addToCart(special)} activeOpacity={0.9}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.specialTag}>Tomorrow's Special</Text>
                                    <Text style={s.specialName}>{special.name}</Text>
                                    <Text style={s.specialPrice}>₹{special.price}</Text>
                                    <View style={s.specialBtn}><Text style={s.specialBtnText}>Add to Cart</Text></View>
                                </View>
                                <Text style={{ fontSize: 52 }}>🍛</Text>
                            </TouchableOpacity>
                        )}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
                            {CATEGORIES.filter(cat => {
                                if (cat === 'All') return true
                                return menuItems.some(item => item.category === cat.toLowerCase())
                            }).map(cat => (
                                <TouchableOpacity key={cat} style={[s.catChip, category === cat && s.catActive]} onPress={() => setCategory(cat)}>
                                    <Text style={{ fontSize: 22 }}>{CAT_EMOJI[cat]}</Text>
                                    <Text style={[s.catLabel, category === cat && { color: '#B85C38' }]}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={s.sectionHeader}>
                            <Text style={s.sectionTitle}>Tomorrow's Menu</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Menu', { role })}>
                                <Text style={s.seeAll}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cardRow}>
                            {filtered.map(item => (
                                <TouchableOpacity key={item.id} style={s.foodCard} onPress={() => addToCart(item)} activeOpacity={0.85}>
                                    <View style={s.foodImg}>
                                        {item.image_url ? (
                                            <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                        ) : (
                                            <Text style={{ fontSize: 36 }}>{getCategoryEmoji(item.category)}</Text>
                                        )}
                                    </View>
                                    <View style={s.foodInfo}>
                                        <Text style={s.foodName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={s.foodDesc} numberOfLines={1}>{item.description}</Text>
                                        <View style={s.foodBottom}>
                                            <Text style={s.foodPrice}>₹{item.price}</Text>
                                            <View style={s.addBtn}><Text style={s.addBtnText}>+</Text></View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {tab === 'subscribe' && showSubscribe && (
                    <View style={s.subscribePrompt}>
                        <Text style={s.subscribeEmoji}>📅</Text>
                        <Text style={s.subscribeTitle}>Meal Subscription</Text>
                        <Text style={s.subscribeSub}>Subscribe for 1 or 3 months. Collection begins June 1, 2026.</Text>
                        <TouchableOpacity style={s.subscribeBtn} onPress={() => navigation.navigate('Subscribe', { role })}>
                            <Text style={s.subscribeBtnText}>View Plans</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {cartCount > 0 && tab === 'pre_order' && (
                <TouchableOpacity style={s.cartFloat} onPress={() => navigation.navigate('Cart', { cart, role })}>
                    <Text style={s.cartFloatText}>🛒  View Cart · {cartCount} items</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    )
}

function getCatEmoji(cat) {
    return { thali: '🍛', rice: '🍚', roti: '🥙', snacks: '🍟', dessert: '🍰', beverage: '☕' }[cat] || '🍽️'
}

function getCategoryEmoji(cat) {
    return { breakfast: '🥐', lunch: '🍱', snacks: '🍟', beverage: '☕' }[cat] || '🍽️'
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16 },
    greeting: { fontSize: 13, color: '#9C9C98' },
    title: { fontSize: 24, fontWeight: '700', color: '#1A1A18', marginTop: 2 },
    roleBadge: { backgroundColor: '#F5E6DF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    roleText: { color: '#B85C38', fontSize: 12, fontWeight: '500' },
    deliveryBanner: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E8E6E0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    deliveryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    deliveryIcon: { fontSize: 22 },
    deliveryTitle: { fontSize: 12, color: '#9C9C98', marginBottom: 2 },
    deliveryDate: { fontSize: 14, fontWeight: '600', color: '#1A1A18' },
    slotBadge: { backgroundColor: '#F5E6DF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    slotText: { fontSize: 11, color: '#B85C38', fontWeight: '500' },
    tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F5F3EE', borderRadius: 10, padding: 4, marginBottom: 4 },
    tab: { flex: 1, padding: 9, borderRadius: 8, alignItems: 'center' },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '500', color: '#9C9C98' },
    tabTextActive: { color: '#B85C38' },
    syncBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 8, backgroundColor: '#FFF8E7', borderRadius: 10, padding: 10 },
    syncText: { fontSize: 12, color: '#B85C38' },
    special: { margin: 20, marginTop: 12, backgroundColor: '#2D6A4F', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    specialTag: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
    specialName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
    specialPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 12 },
    specialBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' },
    specialBtnText: { color: '#fff', fontSize: 12, fontWeight: '500' },
    catRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 8 },
    catChip: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', minWidth: 60 },
    catActive: { backgroundColor: '#F5E6DF', borderColor: '#B85C38' },
    catLabel: { fontSize: 10, color: '#5C5C58', fontWeight: '500' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A18' },
    seeAll: { fontSize: 13, color: '#B85C38' },
    cardRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
    foodCard: { width: 155, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E8E6E0', overflow: 'hidden' },
    foodImg: { height: 90, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center' },
    foodInfo: { padding: 10 },
    foodName: { fontSize: 13, fontWeight: '600', color: '#1A1A18', marginBottom: 2 },
    foodDesc: { fontSize: 11, color: '#9C9C98', marginBottom: 8 },
    foodBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    foodPrice: { fontSize: 14, fontWeight: '700', color: '#B85C38' },
    addBtn: { width: 26, height: 26, backgroundColor: '#B85C38', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 18, lineHeight: 22 },
    subscribePrompt: { margin: 20, backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E8E6E0', alignItems: 'center' },
    subscribeEmoji: { fontSize: 48, marginBottom: 12 },
    subscribeTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A18', marginBottom: 8 },
    subscribeSub: { fontSize: 13, color: '#5C5C58', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
    subscribeBtn: { backgroundColor: '#B85C38', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32 },
    subscribeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    cartFloat: { position: 'absolute', bottom: 16, left: 20, right: 20, backgroundColor: '#B85C38', borderRadius: 14, padding: 16, alignItems: 'center' },
    cartFloatText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
