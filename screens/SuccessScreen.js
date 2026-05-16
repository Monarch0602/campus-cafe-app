import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, BackHandler
} from 'react-native'
import { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

const ORDER_STEPS = [
    { label: 'Order placed', done: true, active: false },
    { label: 'Payment received', done: true, active: false },
    { label: 'Being prepared', done: false, active: true },
    { label: 'Ready for collection', done: false, active: false },
    { label: 'Collected', done: false, active: false },
]

export default function SuccessScreen({ navigation, route }) {
    const {
        total = 0,
        orderId = null,
        role = 'parent',
        isSubscription = false,
        planLabel = null,
        subscriptionId = null,
    } = route.params || {}

    const shortOrderId = orderId
        ? orderId.startsWith('DEMO-')
            ? orderId
            : '#' + orderId.slice(0, 8).toUpperCase()
        : '#' + Math.random().toString(36).slice(2, 10).toUpperCase()

    const shortSubId = subscriptionId
        ? '#' + subscriptionId.slice(0, 8).toUpperCase()
        : '#' + Math.random().toString(36).slice(2, 10).toUpperCase()

    function goHome() {
        navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role } }] })
    }

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                goHome()
                return true
            })
            return () => backHandler.remove()
        }, [])
    )

    // ── SUBSCRIPTION SUCCESS ─────────────────────────────────
    if (isSubscription) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                    <View style={s.iconWrap}>
                        <View style={[s.icon, { backgroundColor: '#E6F1FB' }]}>
                            <Text style={{ fontSize: 36 }}>📅</Text>
                        </View>
                    </View>
                    <Text style={s.title}>Subscription Activated!</Text>
                    <Text style={s.sub}>Your {planLabel || 'meal plan'} has been successfully activated. Collection begins June 1, 2026.</Text>

                    <View style={s.idBox}>
                        <Text style={s.idLabel}>Subscription ID</Text>
                        <Text style={s.idVal}>{shortSubId}</Text>
                    </View>

                    <View style={s.amountBox}>
                        <Text style={s.amountLabel}>Amount Paid</Text>
                        <Text style={s.amount}>₹{Number(total).toLocaleString()}</Text>
                        <Text style={s.amountSub}>Inclusive of GST</Text>
                    </View>

                    <View style={s.infoBox}>
                        <Text style={s.infoTitle}>Plan Details</Text>
                        <View style={s.infoRow}><Text style={s.infoLabel}>Plan</Text><Text style={s.infoVal}>{planLabel}</Text></View>
                        <View style={s.infoRow}><Text style={s.infoLabel}>Starts</Text><Text style={s.infoVal}>June 1, 2026</Text></View>
                        <View style={s.infoRow}><Text style={s.infoLabel}>Collection</Text><Text style={s.infoVal}>Mon–Sat, Daily</Text></View>
                        <View style={s.infoRow}><Text style={s.infoLabel}>Location</Text><Text style={s.infoVal}>Campus Cafe Counter</Text></View>
                        <View style={s.infoRow}><Text style={s.infoLabel}>Status</Text><Text style={[s.infoVal, { color: '#2D6A4F', fontWeight: '600' }]}>✓ Active</Text></View>
                    </View>

                    {/* ID card notice */}
                    <View style={s.idNotice}>
                        <Text style={s.idNoticeIcon}>🪪</Text>
                        <Text style={s.idNoticeText}>
                            Student identification is mandatory at the time of collection and must be verified using the respective ID card.
                        </Text>
                    </View>

                    <TouchableOpacity style={s.btn} onPress={goHome}>
                        <Text style={s.btnText}>Back to Home</Text>
                    </TouchableOpacity>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        )
    }

    // ── REGULAR ORDER SUCCESS ────────────────────────────────
    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <View style={s.iconWrap}>
                    <View style={s.icon}>
                        <Text style={{ fontSize: 36 }}>✓</Text>
                    </View>
                </View>
                <Text style={s.title}>Order Placed!</Text>
                <Text style={s.sub}>Your order has been received. Please collect at the Campus Cafe counter at your chosen time slot.</Text>

                <View style={s.idBox}>
                    <Text style={s.idLabel}>Order ID</Text>
                    <Text style={s.idVal}>{shortOrderId}</Text>
                </View>

                <View style={s.amountBox}>
                    <Text style={s.amountLabel}>Amount Paid</Text>
                    <Text style={s.amount}>₹{total}</Text>
                    <Text style={s.amountSub}>Inclusive of GST</Text>
                </View>

                {/* Order tracker — using "collection" not "delivery" */}
                <View style={s.trackBox}>
                    <Text style={s.trackTitle}>Order Status</Text>
                    {ORDER_STEPS.map((step, i) => (
                        <View key={i} style={s.trackRow}>
                            <View style={s.trackLeft}>
                                <View style={[s.dot, step.done && s.dotDone, step.active && s.dotActive]} />
                                {i < ORDER_STEPS.length - 1 && (
                                    <View style={[s.line, step.done && s.lineDone]} />
                                )}
                            </View>
                            <Text style={[s.stepLabel, (step.done || step.active) && s.stepActive]}>
                                {step.label}
                                {step.active && <Text style={s.stepNow}>  ← Now</Text>}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ID card notice */}
                <View style={s.idNotice}>
                    <Text style={s.idNoticeIcon}>🪪</Text>
                    <Text style={s.idNoticeText}>
                        Student identification is mandatory at the time of collection and must be verified using the respective ID card.
                    </Text>
                </View>

                {/* Payment confirmation note */}
                <View style={s.paymentNote}>
                    <Text style={s.paymentNoteText}>
                        💡 Payment confirmation will be shared separately within the app after verification by Campus Cafe.
                    </Text>
                </View>

                <TouchableOpacity style={s.btn} onPress={goHome}>
                    <Text style={s.btnText}>Back to Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('OrderHistory', { role })}>
                    <Text style={s.btnOutlineText}>View Order History</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    scroll: { alignItems: 'center', padding: 28, paddingTop: 48 },
    iconWrap: { marginBottom: 20 },
    icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D8F3DC', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 26, fontWeight: '700', color: '#1A1A18', marginBottom: 10, textAlign: 'center' },
    sub: { fontSize: 14, color: '#5C5C58', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    idBox: { backgroundColor: '#F5F3EE', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center', marginBottom: 12, width: '100%' },
    idLabel: { fontSize: 11, color: '#9C9C98', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    idVal: { fontSize: 16, fontWeight: '700', color: '#1A1A18', letterSpacing: 1 },
    amountBox: { backgroundColor: '#F5E6DF', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', marginBottom: 20, width: '100%' },
    amountLabel: { fontSize: 12, color: '#9C9C98', marginBottom: 4 },
    amount: { fontSize: 32, fontWeight: '700', color: '#B85C38' },
    amountSub: { fontSize: 11, color: '#C4836A', marginTop: 4 },
    trackBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: '#E8E6E0', marginBottom: 16 },
    trackTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A18', marginBottom: 16 },
    trackRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    trackLeft: { alignItems: 'center', marginRight: 14, width: 10 },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E8E6E0', marginTop: 3 },
    dotDone: { backgroundColor: '#2D6A4F' },
    dotActive: { backgroundColor: '#B85C38' },
    line: { width: 2, height: 24, backgroundColor: '#E8E6E0', marginTop: 2 },
    lineDone: { backgroundColor: '#2D6A4F' },
    stepLabel: { fontSize: 13, color: '#9C9C98', paddingBottom: 20 },
    stepActive: { color: '#1A1A18', fontWeight: '500' },
    stepNow: { color: '#B85C38', fontSize: 11 },
    idNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, width: '100%', marginBottom: 12 },
    idNoticeIcon: { fontSize: 18, flexShrink: 0 },
    idNoticeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
    paymentNote: { backgroundColor: '#F5F3EE', borderRadius: 12, padding: 12, width: '100%', marginBottom: 20 },
    paymentNoteText: { fontSize: 12, color: '#5C5C58', lineHeight: 18 },
    infoBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, width: '100%', borderWidth: 1, borderColor: '#E8E6E0', marginBottom: 16 },
    infoTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A18', marginBottom: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F3EE' },
    infoLabel: { fontSize: 13, color: '#9C9C98' },
    infoVal: { fontSize: 13, color: '#1A1A18', fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 },
    btn: { backgroundColor: '#B85C38', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%', marginBottom: 10 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    btnOutline: { borderWidth: 1.5, borderColor: '#B85C38', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
    btnOutlineText: { color: '#B85C38', fontSize: 14, fontWeight: '500' },
})
