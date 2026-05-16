import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    SafeAreaView, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const DEMO_USER_ID = 'a0000000-0000-0000-0000-000000000001'

const WEEKLY_MENU = {
    lunch: {
        Monday: 'Dal Makhani Thali — Dal · Rice · 2 Roti · Pickle',
        Tuesday: 'Paneer Butter Masala — Paneer · Naan · Rice',
        Wednesday: 'Rajma Chawal — Rajma · Steamed Rice · Salad',
        Thursday: 'South Indian Meal — Sambar · Rasam · Idli · Chutney',
        Friday: 'Chole Bhature — 2 Bhature · Chole · Onion',
        Saturday: 'Veg Pulao Box — Pulao · Raita · Papad',
    },
    snack: {
        Monday: 'Pav Bhaji — 2 Pav · Bhaji · Butter',
        Tuesday: 'Masala Chai + Biscuits',
        Wednesday: 'Samosa (2 pcs) + Chutney',
        Thursday: 'Veg Sandwich + Juice',
        Friday: 'Poha + Masala Chai',
        Saturday: 'Gulab Jamun (2 pcs) + Chai',
    }
}

const PLANS = {
    lunch: [
        {
            key: '1_month_lunch',
            duration: '1_month',
            label: '1 Month Lunch Plan',
            price: 1499,
            months: 1,
            days: 30,
            perMonth: 1499,
            discount: null,
        },
        {
            key: '3_month_lunch',
            duration: '3_month',
            label: '3 Month Lunch Plan',
            price: 3822,
            months: 3,
            days: 90,
            perMonth: 1274,
            discount: '15% off',
        },
    ],
    snack: [
        {
            key: '1_month_snack',
            duration: '1_month',
            label: '1 Month Snack Plan',
            price: 799,
            months: 1,
            days: 30,
            perMonth: 799,
            discount: null,
        },
        {
            key: '3_month_snack',
            duration: '3_month',
            label: '3 Month Snack Plan',
            price: 2037,
            months: 3,
            days: 90,
            perMonth: 679,
            discount: '15% off',
        },
    ],
}

// Plans are locked until June 2026
function isLocked() {
    const now = new Date()
    const unlockDate = new Date('2026-06-01')
    return now < unlockDate
}

function daysUntilJune() {
    const now = new Date()
    const june = new Date('2026-06-01')
    return Math.ceil((june - now) / 86400000)
}

export default function SubscribeScreen({ navigation, route }) {
    const role = route?.params?.role || 'parent'
    const [planType, setPlanType] = useState('lunch')
    const [selected, setSelected] = useState(null)
    const [saving, setSaving] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const plans = PLANS[planType]
    const plan = plans.find(p => p.key === selected)
    const locked = isLocked()

    async function subscribe() {
        if (!plan) return
        if (locked) return
        setSaving(true)
        try {
            const startDate = new Date('2026-06-01')
            const endDate = new Date('2026-06-01')
            endDate.setDate(endDate.getDate() + plan.days)

            const { data, error } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: DEMO_USER_ID,
                    duration: plan.duration,
                    status: 'active',
                    plan_type: planType,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    meals_per_day: 1,
                    price_paid: plan.price,
                    delivery_address: 'Campus — Main School Building',
                    notes: `Role: ${role} | Plan: ${plan.label}`,
                    available_from: '2026-06-01',
                    weekly_menu: WEEKLY_MENU[planType],
                })
                .select()
                .single()

            if (error) throw error

            navigation.navigate('Payment', {
                total: plan.price,
                role,
                isSubscription: true,
                planLabel: plan.label,
                subscriptionId: data?.id,
            })
        } catch (err) {
            console.log('Subscribe error:', err)
            navigation.navigate('Payment', {
                total: plan.price,
                role,
                isSubscription: true,
                planLabel: plan.label,
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={s.header}>
                    <Text style={s.title}>Meal Plans</Text>
                    <Text style={s.sub}>Pre-pay for your meals and collect daily at Campus Cafe</Text>
                </View>

                {/* Locked banner */}
                {locked && (
                    <View style={s.lockedBanner}>
                        <Text style={s.lockedIcon}>🔒</Text>
                        <View style={s.lockedText}>
                            <Text style={s.lockedTitle}>Plans available from June 1, 2026</Text>
                            <Text style={s.lockedSub}>Opens in {daysUntilJune()} days. You can browse plans below.</Text>
                        </View>
                    </View>
                )}

                {/* Plan Type Toggle */}
                <View style={s.typeToggle}>
                    <TouchableOpacity
                        style={[s.typeBtn, planType === 'lunch' && s.typeBtnActive]}
                        onPress={() => { setPlanType('lunch'); setSelected(null) }}
                    >
                        <Text style={s.typeEmoji}>🍱</Text>
                        <Text style={[s.typeBtnText, planType === 'lunch' && s.typeBtnTextActive]}>Lunch Plans</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[s.typeBtn, planType === 'snack' && s.typeBtnActive]}
                        onPress={() => { setPlanType('snack'); setSelected(null) }}
                    >
                        <Text style={s.typeEmoji}>🍟</Text>
                        <Text style={[s.typeBtnText, planType === 'snack' && s.typeBtnTextActive]}>Snack Plans</Text>
                    </TouchableOpacity>
                </View>

                {/* Weekly Menu Preview */}
                <TouchableOpacity style={s.menuPreviewBtn} onPress={() => setShowMenu(!showMenu)}>
                    <Text style={s.menuPreviewText}>📋 View Weekly {planType === 'lunch' ? 'Lunch' : 'Snack'} Menu</Text>
                    <Text style={s.menuPreviewArrow}>{showMenu ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showMenu && (
                    <View style={s.menuBox}>
                        {Object.entries(WEEKLY_MENU[planType]).map(([day, meal]) => (
                            <View key={day} style={s.menuRow}>
                                <Text style={s.menuDay}>{day}</Text>
                                <Text style={s.menuMeal}>{meal}</Text>
                            </View>
                        ))}
                        <Text style={s.menuNote}>* Menu subject to change based on availability</Text>
                    </View>
                )}

                {/* Plans */}
                {plans.map(p => (
                    <TouchableOpacity
                        key={p.key}
                        style={[s.card, selected === p.key && s.cardActive]}
                        onPress={() => setSelected(p.key)}
                        activeOpacity={0.85}
                    >
                        <View style={s.cardTop}>
                            <View>
                                <Text style={s.planName}>{p.label}</Text>
                                {p.discount && (
                                    <View style={s.discountBadge}>
                                        <Text style={s.discountText}>{p.discount}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[s.radio, selected === p.key && s.radioActive]}>
                                {selected === p.key && <View style={s.radioDot} />}
                            </View>
                        </View>

                        <Text style={s.planPrice}>
                            ₹{p.price.toLocaleString()}
                            <Text style={s.planPer}> / {p.months} month{p.months > 1 ? 's' : ''}</Text>
                        </Text>
                        <Text style={s.planPerMonth}>₹{p.perMonth}/month (Inclusive of GST)</Text>

                        <View style={s.planDetails}>
                            <Text style={s.planDetail}>📅  {p.days} days · Mon–Sat</Text>
                            <Text style={s.planDetail}>🍽️  1 {planType === 'lunch' ? 'lunch' : 'snack'} per day</Text>
                            <Text style={s.planDetail}>📍  Campus Cafe counter collection</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Summary */}
                {plan && (
                    <View style={s.summaryBox}>
                        <Text style={s.summaryTitle}>Plan Summary</Text>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Plan</Text>
                            <Text style={s.summaryVal}>{plan.label}</Text>
                        </View>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Duration</Text>
                            <Text style={s.summaryVal}>{plan.months} month{plan.months > 1 ? 's' : ''} ({plan.days} days)</Text>
                        </View>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Collection</Text>
                            <Text style={s.summaryVal}>Mon – Sat, Daily</Text>
                        </View>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Starts</Text>
                            <Text style={s.summaryVal}>June 1, 2026</Text>
                        </View>
                        <View style={[s.summaryRow, s.totalRow]}>
                            <Text style={s.totalLabel}>Total Amount</Text>
                            <Text style={s.totalVal}>₹{plan.price.toLocaleString()}</Text>
                        </View>
                        <Text style={s.gstNote}>All prices inclusive of GST</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[s.btn, (!plan || locked || saving) && s.btnDisabled]}
                    onPress={subscribe}
                    disabled={!plan || locked || saving}
                >
                    {saving
                        ? <ActivityIndicator color="#fff" />
                        : locked
                            ? <Text style={s.btnText}>🔒 Available from June 1, 2026</Text>
                            : <Text style={s.btnText}>Subscribe · ₹{plan?.price.toLocaleString() || '—'}</Text>
                    }
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { padding: 20, paddingBottom: 8 },
    title: { fontSize: 24, fontWeight: '700', color: '#1A1A18' },
    sub: { fontSize: 13, color: '#5C5C58', marginTop: 6, lineHeight: 20 },
    lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FCD34D' },
    lockedIcon: { fontSize: 24 },
    lockedText: { flex: 1 },
    lockedTitle: { fontSize: 13, fontWeight: '600', color: '#92400E' },
    lockedSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
    typeToggle: { flexDirection: 'row', margin: 16, backgroundColor: '#F5F3EE', borderRadius: 12, padding: 4, gap: 4 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10 },
    typeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
    typeEmoji: { fontSize: 18 },
    typeBtnText: { fontSize: 13, fontWeight: '500', color: '#9C9C98' },
    typeBtnTextActive: { color: '#B85C38' },
    menuPreviewBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E8E6E0' },
    menuPreviewText: { fontSize: 13, color: '#B85C38', fontWeight: '500' },
    menuPreviewArrow: { fontSize: 12, color: '#9C9C98' },
    menuBox: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E8E6E0' },
    menuRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F3EE' },
    menuDay: { fontSize: 12, fontWeight: '600', color: '#B85C38', width: 72 },
    menuMeal: { flex: 1, fontSize: 12, color: '#1A1A18', lineHeight: 18 },
    menuNote: { fontSize: 11, color: '#9C9C98', marginTop: 10, fontStyle: 'italic' },
    card: { margin: 16, marginBottom: 0, backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#E8E6E0' },
    cardActive: { borderColor: '#B85C38', backgroundColor: '#FFF9F7' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    planName: { fontSize: 16, fontWeight: '700', color: '#1A1A18', marginBottom: 4 },
    discountBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    discountText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#E8E6E0', alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: '#B85C38' },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#B85C38' },
    planPrice: { fontSize: 24, fontWeight: '700', color: '#B85C38', marginBottom: 2 },
    planPer: { fontSize: 13, color: '#9C9C98', fontWeight: '400' },
    planPerMonth: { fontSize: 12, color: '#5C5C58', marginBottom: 12 },
    planDetails: { gap: 6 },
    planDetail: { fontSize: 12, color: '#5C5C58', lineHeight: 20 },
    summaryBox: { margin: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E6E0' },
    summaryTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A18', marginBottom: 12 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 13, color: '#5C5C58' },
    summaryVal: { fontSize: 13, color: '#1A1A18', fontWeight: '500' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#E8E6E0', paddingTop: 12, marginTop: 4, marginBottom: 4 },
    totalLabel: { fontSize: 15, fontWeight: '700', color: '#1A1A18' },
    totalVal: { fontSize: 15, fontWeight: '700', color: '#B85C38' },
    gstNote: { fontSize: 11, color: '#9C9C98', textAlign: 'right' },
    btn: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#B85C38', borderRadius: 12, padding: 16, alignItems: 'center' },
    btnDisabled: { backgroundColor: '#D4A898' },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})