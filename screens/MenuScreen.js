import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Image } from 'react-native'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

const FALLBACK_MENU = [
    { id: '1', name: 'Dal Makhani Thali', description: 'Dal · Rice · Roti · Pickle · Papad', category: 'thali', price: 150, is_veg: true, is_spicy: false, is_special: true },
    { id: '2', name: 'Paneer Butter Masala Thali', description: 'Paneer · Naan · Dal Soup · Gulab Jamun', category: 'thali', price: 170, is_veg: true, is_spicy: false, is_special: false },
    { id: '3', name: 'Veg Pulao Box', description: 'Jeera Pulao · Raita · Papad', category: 'rice', price: 120, is_veg: true, is_spicy: false, is_special: false },
    { id: '4', name: 'Rajma Chawal', description: 'Rajma · Steamed Rice · Onion Salad', category: 'rice', price: 125, is_veg: true, is_spicy: true, is_special: false },
    { id: '5', name: 'South Indian Meal', description: 'Sambar Rice · Rasam · Idli · Chutney', category: 'thali', price: 130, is_veg: true, is_spicy: false, is_special: false },
    { id: '6', name: 'Chole Bhature Box', description: '2 Bhature · Chole · Onion', category: 'roti', price: 140, is_veg: true, is_spicy: true, is_special: false },
    { id: '7', name: 'Pav Bhaji Meal', description: '2 Pav · Bhaji · Butter · Lemon', category: 'snacks', price: 110, is_veg: true, is_spicy: false, is_special: false },
    { id: '8', name: 'Egg Curry Tiffin', description: '2 Eggs · Curry · Rice · Roti', category: 'thali', price: 145, is_veg: false, is_spicy: true, is_special: false },
    { id: '9', name: 'Masala Chai', description: 'Freshly brewed spiced tea', category: 'beverage', price: 25, is_veg: true, is_spicy: false, is_special: false },
    { id: '10', name: 'Gulab Jamun (2 pcs)', description: 'Soft gulab jamun in sugar syrup', category: 'dessert', price: 40, is_veg: true, is_spicy: false, is_special: false },
]

function getTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
}

export default function MenuScreen({ navigation, route }) {
    const role = route?.params?.role || 'parent'
    const { cart, addToCart, removeFromCart, cartCount } = useCart()

    const [items, setItems] = useState(FALLBACK_MENU)
    const [search, setSearch] = useState('')

    // Re-fetch every time screen is focused
    useFocusEffect(
        useCallback(() => { fetchMenu() }, [])
    )

    async function fetchMenu() {
        try {
            const { data } = await supabase
                .from('daily_menu')
                .select('*, menu_items(*)')
                .eq('menu_date', getTomorrow())

            if (data && data.length > 0) {
                const visible = data
                    .filter(d => d.menu_items?.is_available !== false)
                    .map(d => ({ ...d.menu_items, is_special: d.is_special }))
                // Always replace — even if empty — so removed items disappear
                setItems(visible)
            } else {
                // No daily_menu entries means nothing's available tomorrow
                setItems([])
            }
        } catch (e) { }
    }

    function getQty(id) { return cart.find(i => i.id === id)?.qty || 0 }
    const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <TextInput
                    style={s.search}
                    placeholder="🔍  Search meals..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#9C9C98"
                />
                <TouchableOpacity onPress={fetchMenu} style={s.refresh}>
                    <Text style={{ fontSize: 18 }}>↻</Text>
                </TouchableOpacity>
            </View>

            <View style={s.titleRow}>
                <Text style={s.title}>Tomorrow's Menu</Text>
                <Text style={s.sub}>{items.length} items available</Text>
            </View>

            {items.length === 0 ? (
                <View style={s.empty}>
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>🍽️</Text>
                    <Text style={s.emptyTitle}>No menu for tomorrow yet</Text>
                    <Text style={s.emptyText}>Please check back later or contact Campus Cafe.</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    renderItem={({ item }) => (
                        <View style={s.item}>
                            <View style={s.itemEmoji}>
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                                ) : (
                                    <Text style={{ fontSize: 28 }}>{getCatEmoji(item.category)}</Text>
                                )}
                            </View>
                            <View style={s.itemInfo}>
                                <Text style={s.itemName}>{item.name}</Text>
                                <Text style={s.itemDesc} numberOfLines={1}>{item.description}</Text>
                                <View style={s.tags}>
                                    {item.is_veg && <View style={s.tagVeg}><Text style={s.tagVegText}>Veg</Text></View>}
                                    {item.is_spicy && <View style={s.tagSpicy}><Text style={s.tagSpicyText}>Spicy</Text></View>}
                                    {item.is_special && <View style={s.tagSpecial}><Text style={s.tagSpecialText}>⭐ Special</Text></View>}
                                </View>
                            </View>
                            <View style={s.itemRight}>
                                <Text style={s.itemPrice}>₹{item.price}</Text>
                                {getQty(item.id) === 0 ? (
                                    <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item)}>
                                        <Text style={s.addBtnText}>+</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={s.qtyCtrl}>
                                        <TouchableOpacity onPress={() => removeFromCart(item)}>
                                            <Text style={s.qtyBtn}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={s.qtyNum}>{getQty(item.id)}</Text>
                                        <TouchableOpacity onPress={() => addToCart(item)}>
                                            <Text style={s.qtyBtn}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}

            {cartCount > 0 && (
                <TouchableOpacity
                    style={s.cartFloat}
                    onPress={() => navigation.navigate('Cart', { cart, role })}
                >
                    <Text style={s.cartFloatText}>🛒  View Cart · {cartCount} items</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    )
}

function getCatEmoji(cat) {
    return { breakfast: '🥐', lunch: '🍱', snacks: '🍟', beverage: '☕' }[cat] || '🍽️'
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    search: { flex: 1, backgroundColor: '#F5F3EE', borderRadius: 10, padding: 10, fontSize: 13, color: '#1A1A18' },
    refresh: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    titleRow: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8E6E0' },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A18' },
    sub: { fontSize: 12, color: '#9C9C98', marginTop: 2 },
    empty: { alignItems: 'center', justifyContent: 'center', padding: 48 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18', marginBottom: 8 },
    emptyText: { fontSize: 13, color: '#9C9C98', textAlign: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E0', backgroundColor: '#fff' },
    itemEmoji: { width: 58, height: 58, borderRadius: 12, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center' },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', color: '#1A1A18', marginBottom: 2 },
    itemDesc: { fontSize: 11, color: '#9C9C98', marginBottom: 5 },
    tags: { flexDirection: 'row', gap: 6 },
    tagVeg: { backgroundColor: '#D8F3DC', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    tagVegText: { fontSize: 10, color: '#2D6A4F', fontWeight: '500' },
    tagSpicy: { backgroundColor: '#FEF3C7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    tagSpicyText: { fontSize: 10, color: '#92400E', fontWeight: '500' },
    tagSpecial: { backgroundColor: '#FFF8E7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    tagSpecialText: { fontSize: 10, color: '#C9973A', fontWeight: '500' },
    itemRight: { alignItems: 'flex-end', gap: 8 },
    itemPrice: { fontSize: 15, fontWeight: '700', color: '#B85C38' },
    addBtn: { width: 30, height: 30, backgroundColor: '#B85C38', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    addBtnText: { color: '#fff', fontSize: 20, lineHeight: 26 },
    qtyCtrl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5E6DF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 10 },
    qtyBtn: { fontSize: 18, color: '#B85C38', fontWeight: '600' },
    qtyNum: { fontSize: 14, fontWeight: '600', color: '#B85C38' },
    cartFloat: { position: 'absolute', bottom: 16, left: 20, right: 20, backgroundColor: '#B85C38', borderRadius: 14, padding: 16, alignItems: 'center' },
    cartFloatText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
