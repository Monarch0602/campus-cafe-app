import {
    View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, BackHandler
} from 'react-native'
import { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

export default function PaymentScreen({ navigation, route }) {
    const {
        total = 0,
        cart = [],
        role = 'parent',
        orderId = null,
        isSubscription = false,
        planLabel = null,
        subscriptionId = null,
    } = route.params || {}

    // Intercept Android back button
    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role } }] })
                return true
            })
            return () => backHandler.remove()
        }, [])
    )

    function goHome() {
        navigation.reset({ index: 0, routes: [{ name: 'Main', params: { role } }] })
    }

    function confirmPayment() {
        navigation.navigate('Success', {
            total,
            role,
            orderId,
            isSubscription,
            planLabel,
            subscriptionId,
        })
    }

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={goHome} style={s.back}>
                    <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <Text style={s.title}>Payment</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* QR Only notice */}
                <View style={s.qrOnlyBanner}>
                    <Text style={s.qrOnlyIcon}>📱</Text>
                    <Text style={s.qrOnlyText}>QR Code payment only</Text>
                </View>

                {/* Amount */}
                <View style={s.amountBox}>
                    <Text style={s.amountLabel}>Amount to Pay</Text>
                    <Text style={s.amountVal}>₹{Number(total).toLocaleString()}</Text>
                    <Text style={s.amountGst}>Inclusive of GST</Text>
                </View>

                {/* QR Code */}
                <View style={s.qrBox}>
                    <Text style={s.qrTitle}>Scan QR to Pay</Text>
                    <Text style={s.qrSub}>Use any UPI app — PhonePe, GPay, Paytm</Text>

                    {/* QR graphic */}
                    <View style={s.qrWrapper}>
                        <View style={s.qrGrid}>
                            {Array.from({ length: 100 }, (_, i) => {
                                const filled = [
                                    0, 1, 2, 3, 4, 5, 6,
                                    7, 13, 14, 20,
                                    21, 22, 23, 24, 25, 26, 27,
                                    28, 34, 35, 41,
                                    42, 43, 44, 45, 46, 47, 48,
                                    56, 57, 63,
                                    70, 71, 72, 73, 74, 75, 76,
                                    77, 83, 84, 90,
                                    93, 94, 95, 96, 97, 98, 99
                                ].includes(i)
                                return <View key={i} style={[s.qrCell, filled && s.qrCellFilled]} />
                            })}
                        </View>
                    </View>

                    <Text style={s.qrName}>Campus Cafe</Text>
                    <Text style={s.qrUpi}>UPI ID: campuscafe@upi</Text>
                    <Text style={s.qrAmount}>₹{Number(total).toLocaleString()}</Text>
                </View>

                {/* Instructions */}
                <View style={s.instructionBox}>
                    <Text style={s.instructionTitle}>How to pay</Text>
                    {[
                        'Open any UPI app on your phone',
                        'Tap "Scan QR" and scan the code above',
                        `Enter amount ₹${Number(total).toLocaleString()} if not auto-filled`,
                        'Complete payment and tap "I have paid" below',
                    ].map((step, i) => (
                        <View key={i} style={s.instructionRow}>
                            <View style={s.instructionNum}>
                                <Text style={s.instructionNumText}>{i + 1}</Text>
                            </View>
                            <Text style={s.instructionText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment confirmation note */}
                <View style={s.noteBox}>
                    <Text style={s.noteText}>
                        💡 Payment confirmation will be shared separately within the app after verification by Campus Cafe.
                    </Text>
                </View>

                <TouchableOpacity style={s.btn} onPress={confirmPayment}>
                    <Text style={s.btnText}>✓  I have paid · ₹{Number(total).toLocaleString()}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelBtn} onPress={goHome}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8E6E0' },
    back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: '#1A1A18' },
    qrOnlyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 8, backgroundColor: '#E6F1FB', borderRadius: 10, padding: 10 },
    qrOnlyIcon: { fontSize: 18 },
    qrOnlyText: { fontSize: 13, color: '#0C447C', fontWeight: '500' },
    amountBox: { alignItems: 'center', paddingVertical: 20, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E8E6E0', marginBottom: 16 },
    amountLabel: { fontSize: 12, color: '#9C9C98', marginBottom: 4 },
    amountVal: { fontSize: 36, fontWeight: '700', color: '#B85C38' },
    amountGst: { fontSize: 12, color: '#9C9C98', marginTop: 4 },
    qrBox: { margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E8E6E0' },
    qrTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18', marginBottom: 4 },
    qrSub: { fontSize: 12, color: '#9C9C98', marginBottom: 16 },
    qrWrapper: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E8E6E0', marginBottom: 14 },
    qrGrid: { width: 150, height: 150, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
    qrCell: { width: 12, height: 12, borderRadius: 1, backgroundColor: 'transparent' },
    qrCellFilled: { backgroundColor: '#1A1A18' },
    qrName: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
    qrUpi: { fontSize: 12, color: '#9C9C98', marginTop: 4 },
    qrAmount: { fontSize: 22, fontWeight: '700', color: '#B85C38', marginTop: 8 },
    instructionBox: { margin: 16, marginTop: 0, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E8E6E0' },
    instructionTitle: { fontSize: 13, fontWeight: '600', color: '#1A1A18', marginBottom: 12 },
    instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    instructionNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    instructionNumText: { fontSize: 11, fontWeight: '700', color: '#B85C38' },
    instructionText: { flex: 1, fontSize: 13, color: '#5C5C58', lineHeight: 20 },
    noteBox: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF8E7', borderRadius: 12, padding: 12 },
    noteText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
    btn: { marginHorizontal: 16, backgroundColor: '#B85C38', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    cancelBtn: { marginHorizontal: 16, borderWidth: 1, borderColor: '#E8E6E0', borderRadius: 12, padding: 14, alignItems: 'center' },
    cancelBtnText: { color: '#9C9C98', fontSize: 14 },
})
