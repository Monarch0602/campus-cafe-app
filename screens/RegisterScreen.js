import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { setCurrentUser } from '../lib/UserSession'

const ACCESS_CODE = 'CCP15'
const GRADES = ['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
const BOARDS = ['CBSE', 'ICSE', 'IB', 'State Board', 'IGCSE', 'Other']
const COLLECTION_SLOTS = [
    { key: 'morning', label: 'Morning', time: '9:00 AM – 10:00 AM', emoji: '🌅' },
    { key: 'evening', label: 'Evening', time: '12:00 PM – 1:00 PM', emoji: '🌞' },
]

export default function RegisterScreen({ navigation, route }) {
    // Get real user ID from auth (or null if registering before login)
    const existingUserId = route?.params?.userId
    const existingPhone = route?.params?.phone

    const [step, setStep] = useState(existingUserId ? 2 : 1)  // Skip code if coming from login
    const [code, setCode] = useState('')
    const [role, setRole] = useState(null)
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState('')
    const [phone, setPhone] = useState(existingPhone ? existingPhone.replace('+91', '') : '')
    const [slot, setSlot] = useState('morning')

    const [childName, setChildName] = useState('')
    const [rollNumber, setRollNumber] = useState('')
    const [grade, setGrade] = useState('Grade 1')
    const [board, setBoard] = useState('CBSE')

    const [teacherGrade, setTeacherGrade] = useState('Grade 1')

    function verifyCode() {
        if (code.trim().toUpperCase() !== ACCESS_CODE) {
            Alert.alert('Invalid Code', 'The access code you entered is incorrect.')
            return
        }
        setStep(2)
    }

    function selectRole(r) { setRole(r); setStep(3) }

    async function register() {
        if (!name.trim()) { Alert.alert('Missing Info', 'Please enter your name.'); return }
        if (role === 'parent') {
            if (!childName.trim()) { Alert.alert('Missing Info', "Please enter your child's name."); return }
            if (!rollNumber.trim()) { Alert.alert('Missing Info', "Please enter your child's roll number."); return }
        }
        if (!phone.trim() || phone.length < 10) {
            Alert.alert('Missing Info', 'Please enter a valid 10-digit phone number.')
            return
        }

        setSaving(true)
        try {
            // Use existing auth user ID if logged in, otherwise generate one from phone
            let userId = existingUserId
            if (!userId) {
                const { data: { session } } = await supabase.auth.getSession()
                userId = session?.user?.id
            }

            // If no auth, create a unique ID based on phone number
            // This ensures each phone number gets its own unique user record
            if (!userId) {
                // Generate UUID v4 in JS (since we don't have auth)
                userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
                })
            }

            // Check if a profile with this phone already exists (returning user)
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('phone', phone.trim())
                .single()

            if (existingProfile) {
                userId = existingProfile.id  // Use existing ID for returning users
            }

            // Create/update profile — every phone gets its own unique ID
            await supabase.from('profiles').upsert({
                id: userId,
                full_name: name.trim(),
                phone: phone.trim(),
                role: role,
            })

            // Save child for parent — linked to REAL parent_id (unique per user)
            if (role === 'parent') {
                // Delete any old child records for this parent first
                await supabase.from('children').delete().eq('parent_id', userId)

                await supabase.from('children').insert({
                    parent_id: userId,
                    full_name: childName.trim(),
                    class: grade,
                    dietary_notes: `Roll: ${rollNumber.trim()} | Slot: ${slot} | Board: ${board}`,
                })
            }

            // Save current user globally so other screens can access it
            setCurrentUser({ id: userId, phone: phone.trim(), name: name.trim(), role })

            navigation.replace('Main', {
                role,
                userId,
                phone: phone.trim(),
                profileData: { name: name.trim(), phone: phone.trim(), slot, grade: role === 'teacher' ? teacherGrade : grade }
            })
        } catch (err) {
            console.log('Register error:', err)
            Alert.alert('Error', 'Could not save your details. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (step === 1) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.logoBox}>
                        <Text style={s.logoEmoji}>☕</Text>
                        <Text style={s.logoTitle}>Campus Cafe</Text>
                        <Text style={s.logoSub}>Create your account</Text>
                    </View>
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Enter Access Code</Text>
                        <Text style={s.cardDesc}>Campus Cafe is invite-only. Enter the access code provided by your school.</Text>
                        <TextInput style={[s.input, s.codeInput]} placeholder="CODE" placeholderTextColor="#9C9C98"
                            value={code} onChangeText={setCode} autoCapitalize="characters" autoFocus />
                        <TouchableOpacity style={s.btn} onPress={verifyCode}>
                            <Text style={s.btnText}>Verify Code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.linkBtn} onPress={() => navigation.goBack()}>
                            <Text style={s.linkText}>Already have an account? Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        )
    }

    if (step === 2) {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.stepHeader}>
                        <Text style={s.stepNum}>Step 2 of 3</Text>
                        <Text style={s.stepTitle}>I am a...</Text>
                    </View>
                    {[
                        { key: 'parent', emoji: '👨‍👩‍👧', title: 'Parent / Guardian', desc: "Order meals for your child at school" },
                        { key: 'teacher', emoji: '👩‍🏫', title: 'Teacher / Staff', desc: 'Pre-order your daily meals for collection' },
                    ].map(r => (
                        <TouchableOpacity key={r.key} style={s.roleCard} onPress={() => selectRole(r.key)} activeOpacity={0.85}>
                            <View style={s.roleEmoji}><Text style={{ fontSize: 28 }}>{r.emoji}</Text></View>
                            <View style={s.roleText}>
                                <Text style={s.roleTitle}>{r.title}</Text>
                                <Text style={s.roleDesc}>{r.desc}</Text>
                            </View>
                            <Text style={s.roleArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
                <View style={s.stepHeader}>
                    <Text style={s.stepNum}>Step 3 of 3</Text>
                    <Text style={s.stepTitle}>{role === 'parent' ? '👨‍👩‍👧 Parent Details' : '👩‍🏫 Teacher Details'}</Text>
                </View>
                <View style={s.card}>
                    <Text style={s.fieldLabel}>Your Full Name *</Text>
                    <TextInput style={s.input} placeholder="Full name" placeholderTextColor="#9C9C98" value={name} onChangeText={setName} />

                    <Text style={s.fieldLabel}>Phone Number *</Text>
                    <TextInput style={s.input} placeholder="10-digit mobile number" placeholderTextColor="#9C9C98"
                        value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={10}
                        editable={!existingPhone} />

                    {role === 'parent' && (
                        <>
                            <Text style={s.sectionDivider}>Child's Information</Text>
                            <Text style={s.fieldLabel}>Child's Full Name *</Text>
                            <TextInput style={s.input} placeholder="Child's name" placeholderTextColor="#9C9C98" value={childName} onChangeText={setChildName} />
                            <Text style={s.fieldLabel}>Roll Number *</Text>
                            <TextInput style={s.input} placeholder="e.g. 42" placeholderTextColor="#9C9C98" value={rollNumber} onChangeText={setRollNumber} keyboardType="number-pad" />
                            <Text style={s.fieldLabel}>Grade / Class *</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                <View style={s.chipRow}>
                                    {GRADES.map(g => (
                                        <TouchableOpacity key={g} style={[s.chip, grade === g && s.chipActive]} onPress={() => setGrade(g)}>
                                            <Text style={[s.chipText, grade === g && s.chipTextActive]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                            <Text style={s.fieldLabel}>Education Board *</Text>
                            <View style={s.boardGrid}>
                                {BOARDS.map(b => (
                                    <TouchableOpacity key={b} style={[s.boardChip, board === b && s.boardChipActive]} onPress={() => setBoard(b)}>
                                        <Text style={[s.boardChipText, board === b && s.boardChipTextActive]}>{b}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {role === 'teacher' && (
                        <>
                            <Text style={s.fieldLabel}>Grade / Class You Teach</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                                <View style={s.chipRow}>
                                    {GRADES.map(g => (
                                        <TouchableOpacity key={g} style={[s.chip, teacherGrade === g && s.chipActive]} onPress={() => setTeacherGrade(g)}>
                                            <Text style={[s.chipText, teacherGrade === g && s.chipTextActive]}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </>
                    )}

                    <Text style={s.sectionDivider}>Preferred Collection Slot</Text>
                    <View style={s.slotRow}>
                        {COLLECTION_SLOTS.map(sl => (
                            <TouchableOpacity key={sl.key} style={[s.slotCard, slot === sl.key && s.slotCardActive]} onPress={() => setSlot(sl.key)}>
                                <Text style={s.slotEmoji}>{sl.emoji}</Text>
                                <Text style={[s.slotLabel, slot === sl.key && s.slotLabelActive]}>{sl.label}</Text>
                                <Text style={[s.slotTime, slot === sl.key && { color: '#B85C38' }]}>{sl.time}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={register} disabled={saving}>
                        {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Account</Text>}
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#FAFAF8' },
    scroll: { flexGrow: 1, padding: 24 },
    logoBox: { alignItems: 'center', paddingVertical: 32 },
    logoEmoji: { fontSize: 48, marginBottom: 8 },
    logoTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A18' },
    logoSub: { fontSize: 14, color: '#9C9C98', marginTop: 4 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E8E6E0' },
    cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A18', marginBottom: 8 },
    cardDesc: { fontSize: 13, color: '#5C5C58', lineHeight: 20, marginBottom: 20 },
    codeInput: { fontSize: 22, fontWeight: '700', letterSpacing: 4, textAlign: 'center', color: '#B85C38' },
    input: { backgroundColor: '#F5F3EE', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A18', marginBottom: 14 },
    fieldLabel: { fontSize: 12, color: '#9C9C98', fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
    sectionDivider: { fontSize: 13, fontWeight: '600', color: '#1A1A18', marginTop: 8, marginBottom: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F3EE' },
    btn: { backgroundColor: '#B85C38', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    linkBtn: { alignItems: 'center', marginTop: 16 },
    linkText: { fontSize: 13, color: '#B85C38', fontWeight: '500' },
    stepHeader: { marginBottom: 20 },
    stepNum: { fontSize: 12, color: '#9C9C98', fontWeight: '500', marginBottom: 4 },
    stepTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A18' },
    roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E8E6E0', gap: 14 },
    roleEmoji: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F5E6DF', alignItems: 'center', justifyContent: 'center' },
    roleText: { flex: 1 },
    roleTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18', marginBottom: 2 },
    roleDesc: { fontSize: 12, color: '#9C9C98' },
    roleArrow: { fontSize: 22, color: '#9C9C98' },
    chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#F5F3EE' },
    chipActive: { backgroundColor: '#F5E6DF', borderColor: '#B85C38' },
    chipText: { fontSize: 12, color: '#5C5C58', fontWeight: '500' },
    chipTextActive: { color: '#B85C38', fontWeight: '600' },
    boardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    boardChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', backgroundColor: '#F5F3EE' },
    boardChipActive: { backgroundColor: '#F5E6DF', borderColor: '#B85C38' },
    boardChipText: { fontSize: 12, color: '#5C5C58', fontWeight: '500' },
    boardChipTextActive: { color: '#B85C38', fontWeight: '600' },
    slotRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    slotCard: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: '#E8E6E0', padding: 14, alignItems: 'center', backgroundColor: '#fff', gap: 4 },
    slotCardActive: { borderColor: '#B85C38', backgroundColor: '#FFF9F7' },
    slotEmoji: { fontSize: 24 },
    slotLabel: { fontSize: 14, fontWeight: '600', color: '#1A1A18' },
    slotLabelActive: { color: '#B85C38' },
    slotTime: { fontSize: 11, color: '#9C9C98', textAlign: 'center' },
})
