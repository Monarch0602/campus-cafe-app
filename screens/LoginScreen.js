import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setCurrentUser } from '../lib/UserSession'

export default function LoginScreen({ navigation }) {
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [countdown, setCountdown] = useState(0)

    function formatPhone(raw) {
        const digits = raw.replace(/\D/g, '')
        if (digits.startsWith('91') && digits.length === 12) return '+' + digits
        if (digits.length === 10) return '+91' + digits
        return '+' + digits
    }

    async function sendOTP() {
        if (phone.length < 10) {
            Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.')
            return
        }
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
            if (error) throw error
            setStep(2)
            setCountdown(30)
            const timer = setInterval(() => {
                setCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
            }, 1000)
        } catch (err) {
            Alert.alert('Error', err.message || 'Failed to send OTP.')
        }
        setLoading(false)
    }

    async function verifyOTP() {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code.')
            return
        }
        setLoading(true)
        try {
            const formattedPhone = formatPhone(phone)

            // Run auth verification and profile lookup in parallel
            const [authResult, profileResult] = await Promise.all([
                supabase.auth.verifyOtp({
                    phone: formattedPhone,
                    token: otp,
                    type: 'sms',
                }),
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('phone', phone.trim())
                    .maybeSingle()
            ])

            if (authResult.error) throw authResult.error

            const existingProfile = profileResult.data

            if (existingProfile) {
                setCurrentUser({
                    id: existingProfile.id,
                    phone: existingProfile.phone,
                    name: existingProfile.full_name,
                    role: existingProfile.role,
                })
                const role = existingProfile.role === 'org_admin' ? 'org' : existingProfile.role || 'parent'
                navigation.replace('Main', {
                    role,
                    userId: existingProfile.id,
                    phone: existingProfile.phone,
                    profileData: { name: existingProfile.full_name, phone: existingProfile.phone },
                })
            } else {
                navigation.replace('Register', { phone: formattedPhone })
            }
        } catch (err) {
            Alert.alert('Invalid OTP', err.message || 'The code is incorrect.')
        }
        setLoading(false)
    }

    if (step === 1) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                        <Text style={s.backText}>‹ Back</Text>
                    </TouchableOpacity>
                    <View style={s.logoBox}>
                        <Text style={s.logoEmoji}>☕</Text>
                        <Text style={s.logoTitle}>Welcome to Campus Cafe</Text>
                        <Text style={s.logoSub}>Sign in with your mobile number</Text>
                    </View>
                    <View style={s.card}>
                        <Text style={s.fieldLabel}>Mobile Number</Text>
                        <View style={s.phoneRow}>
                            <View style={s.countryCode}><Text style={s.countryCodeText}>🇮🇳 +91</Text></View>
                            <TextInput style={s.phoneInput} placeholder="10-digit number" placeholderTextColor="#9C9C98"
                                value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10} autoFocus
                                editable={!loading} />
                        </View>
                        <Text style={s.hint}>We'll send a 6-digit OTP to verify your number</Text>
                        <TouchableOpacity style={[s.btn, (loading || phone.length < 10) && s.btnDisabled]}
                            onPress={sendOTP} disabled={loading || phone.length < 10}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Send OTP</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll}>
                <TouchableOpacity onPress={() => setStep(1)} style={s.back}>
                    <Text style={s.backText}>‹ Back</Text>
                </TouchableOpacity>
                <View style={s.logoBox}>
                    <Text style={s.logoEmoji}>📱</Text>
                    <Text style={s.logoTitle}>Verify OTP</Text>
                    <Text style={s.logoSub}>Enter the 6-digit code sent to{'\n'}+91 {phone}</Text>
                </View>
                <View style={s.card}>
                    <Text style={s.fieldLabel}>Enter OTP</Text>
                    <TextInput style={[s.phoneInput, s.otpInput]} placeholder="• • • • • •" placeholderTextColor="#9C9C98"
                        value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} autoFocus
                        editable={!loading} />
                    <TouchableOpacity style={[s.btn, (loading || otp.length !== 6) && s.btnDisabled]}
                        onPress={verifyOTP} disabled={loading || otp.length !== 6}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Verify & Sign In</Text>}
                    </TouchableOpacity>
                    <View style={s.resendRow}>
                        {countdown > 0
                            ? <Text style={s.resendTimer}>Resend OTP in {countdown}s</Text>
                            : <TouchableOpacity onPress={sendOTP}><Text style={s.resendBtn}>Resend OTP</Text></TouchableOpacity>
                        }
                    </View>
                    <TouchableOpacity style={s.changeNum} onPress={() => { setStep(1); setOtp('') }}>
                        <Text style={s.changeNumText}>Change phone number</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    scroll: { flexGrow: 1, padding: 24 },
    back: { marginBottom: 8 },
    backText: { color: '#B85C38', fontSize: 15, fontWeight: '500' },
    logoBox: { alignItems: 'center', paddingVertical: 32 },
    logoEmoji: { fontSize: 48, marginBottom: 8 },
    logoTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A18', textAlign: 'center' },
    logoSub: { fontSize: 14, color: '#9C9C98', marginTop: 4, textAlign: 'center', lineHeight: 22 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8E6E0' },
    fieldLabel: { fontSize: 12, color: '#9C9C98', fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
    phoneRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    countryCode: { backgroundColor: '#F5F3EE', borderRadius: 10, padding: 14, justifyContent: 'center' },
    countryCodeText: { fontSize: 14, color: '#1A1A18', fontWeight: '500' },
    phoneInput: { flex: 1, backgroundColor: '#F5F3EE', borderRadius: 10, padding: 14, fontSize: 16, color: '#1A1A18' },
    otpInput: { flex: 0, letterSpacing: 8, fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#B85C38', marginBottom: 16 },
    hint: { fontSize: 12, color: '#9C9C98', marginBottom: 16, lineHeight: 18 },
    btn: { backgroundColor: '#B85C38', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
    btnDisabled: { backgroundColor: '#D4A898' },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    resendRow: { alignItems: 'center', marginTop: 16 },
    resendTimer: { fontSize: 13, color: '#9C9C98' },
    resendBtn: { fontSize: 13, color: '#B85C38', fontWeight: '600' },
    changeNum: { alignItems: 'center', marginTop: 10 },
    changeNumText: { fontSize: 12, color: '#9C9C98' },
})
