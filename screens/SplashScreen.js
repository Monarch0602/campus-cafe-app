import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native'

export default function SplashScreen({ navigation }) {
    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                {/* Hero */}
                <View style={s.hero}>
                    <Text style={s.heroEmoji}>☕</Text>
                    <Text style={s.heroTag}>School Meal Service</Text>
                    <Text style={s.heroTitle}>Campus{'\n'}Cafe</Text>
                    <Text style={s.heroSub}>Fresh meals delivered to your campus daily</Text>
                    <View style={s.timeBadge}>
                        <View style={s.liveDot} />
                        <Text style={s.timeText}>Delivery: 9AM–10AM · 12PM–1PM</Text>
                    </View>
                </View>

                {/* Features */}
                <View style={s.features}>
                    {[
                        { emoji: '🍱', text: 'Pre-order next day\'s meal' },
                        { emoji: '📅', text: 'Monthly subscription plans' },
                        { emoji: '✅', text: 'Managed delivery to your campus' },
                    ].map(f => (
                        <View key={f.text} style={s.featureRow}>
                            <Text style={s.featureEmoji}>{f.emoji}</Text>
                            <Text style={s.featureText}>{f.text}</Text>
                        </View>
                    ))}
                </View>

                {/* Auth buttons */}
                <View style={s.authBox}>
                    <TouchableOpacity
                        style={s.registerBtn}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.85}
                    >
                        <Text style={s.registerBtnText}>Create Account</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.loginBtn}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.85}
                    >
                        <Text style={s.loginBtnText}>Sign In</Text>
                    </TouchableOpacity>

                    <Text style={s.disclaimer}>
                        Access by invitation only.{'\n'}You need an access code to create an account.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    scroll: { flexGrow: 1 },
    hero: { backgroundColor: '#7A3520', padding: 32, paddingTop: 60, paddingBottom: 40 },
    heroEmoji: { fontSize: 48, marginBottom: 12 },
    heroTag: { color: 'rgba(255,200,150,0.9)', fontSize: 11, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: '500' },
    heroTitle: { color: '#fff', fontSize: 42, fontWeight: '700', lineHeight: 48, marginBottom: 8 },
    heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginBottom: 20, lineHeight: 22 },
    timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start', gap: 8 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
    timeText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
    features: { padding: 24, gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureEmoji: { fontSize: 22, width: 32 },
    featureText: { fontSize: 14, color: '#1A1A18', fontWeight: '400' },
    authBox: { padding: 24, paddingTop: 8, gap: 10 },
    registerBtn: { backgroundColor: '#B85C38', borderRadius: 14, padding: 16, alignItems: 'center' },
    registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    loginBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#B85C38' },
    loginBtnText: { color: '#B85C38', fontSize: 16, fontWeight: '600' },
    disclaimer: { fontSize: 12, color: '#9C9C98', textAlign: 'center', lineHeight: 18, marginTop: 4 },
})
