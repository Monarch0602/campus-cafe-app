import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { useState, useContext, useEffect, useCallback } from 'react'
import { AddressContext } from '../App'
import { supabase } from '../lib/supabase'

const LABELS = ['Home', 'Office', 'School', 'Other']
const LABEL_ICONS = { Home: '🏠', Office: '🏢', School: '🏫', Other: '📍' }

// ── Keep this in sync with CartScreen.js ──────────────────────────────────────
// This is the real UUID of the logged-in user. If you have Supabase Auth,
// replace this with: (await supabase.auth.getUser()).data.user.id
const DEMO_USER_ID = 'a0000000-0000-0000-0000-000000000001'
// ─────────────────────────────────────────────────────────────────────────────

export default function AddressScreen({ route }) {
    const role = route.params?.role || 'parent'
    const { addressesByRole, setAddressesByRole, defaultIdByRole, setDefaultIdByRole } = useContext(AddressContext)

    const addresses = addressesByRole[role] || []
    const defaultAddressId = defaultIdByRole[role] || null

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)

    // Form state
    const [label, setLabel] = useState('Home')
    const [addressLine, setAddressLine] = useState('')
    const [city, setCity] = useState('')
    const [pincode, setPincode] = useState('')
    const [landmark, setLandmark] = useState('')

    // Load addresses for this specific user_id + role combination
    const loadAddresses = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('delivery_addresses')
                .select('*')
                .eq('user_id', DEMO_USER_ID)   // ✅ real uuid — never changes
                .eq('role', role)               // ✅ filter by role using the new column
                .order('created_at', { ascending: true })

            if (error) throw error

            setAddressesByRole(prev => ({ ...prev, [role]: data || [] }))

            // Set default to first address if none selected yet
            if (!defaultIdByRole[role] && data && data.length > 0) {
                setDefaultIdByRole(prev => ({ ...prev, [role]: data[0].id }))
            }
        } catch (err) {
            console.log('Load addresses error:', err)
            Alert.alert('Error', 'Could not load addresses. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [role])

    useEffect(() => {
        loadAddresses()
    }, [loadAddresses])

    const handleSave = async () => {
        if (!addressLine.trim() || !city.trim()) {
            Alert.alert('Missing Details', 'Please enter at least a street address and city.')
            return
        }

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('delivery_addresses')
                .insert({
                    user_id: DEMO_USER_ID,         // ✅ real uuid
                    role: role,                     // ✅ stored so we can filter later
                    address_line: addressLine.trim(),
                    city: city.trim(),
                    pincode: pincode.trim(),
                    landmark: landmark.trim(),
                    label: label,                   // optional: only if you have a label column
                })
                .select()
                .single()

            if (error) throw error

            // Update context with new address
            setAddressesByRole(prev => {
                const updated = [...(prev[role] || []), data]
                return { ...prev, [role]: updated }
            })

            // First address for this role becomes default
            if (!defaultIdByRole[role]) {
                setDefaultIdByRole(prev => ({ ...prev, [role]: data.id }))
            }

            // Reset form
            setLabel('Home')
            setAddressLine('')
            setCity('')
            setPincode('')
            setLandmark('')
            setShowForm(false)

        } catch (err) {
            console.log('Save address error:', err)
            Alert.alert('Error', 'Could not save address. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (id) => {
        Alert.alert('Remove Address', 'Are you sure you want to remove this address?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive', onPress: async () => {
                    try {
                        const { error } = await supabase
                            .from('delivery_addresses')
                            .delete()
                            .eq('id', id)

                        if (error) throw error

                        setAddressesByRole(prev => {
                            const updated = (prev[role] || []).filter(a => a.id !== id)
                            return { ...prev, [role]: updated }
                        })

                        // If deleted address was default, move default to next available
                        if (defaultIdByRole[role] === id) {
                            const remaining = addresses.filter(a => a.id !== id)
                            setDefaultIdByRole(prev => ({ ...prev, [role]: remaining[0]?.id || null }))
                        }
                    } catch (err) {
                        console.log('Delete address error:', err)
                        Alert.alert('Error', 'Could not remove address.')
                    }
                }
            },
        ])
    }

    const setAsDefault = (id) => {
        setDefaultIdByRole(prev => ({ ...prev, [role]: id }))
    }

    if (loading) {
        return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color="#B85C38" />
                <Text style={s.loadingText}>Loading addresses...</Text>
            </View>
        )
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#FAFAF8' }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={s.scroll}>

                {/* Saved addresses */}
                {addresses.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>Saved Addresses</Text>
                        {addresses.map(item => (
                            <View key={item.id} style={[s.card, item.id === defaultAddressId && s.cardDefault]}>
                                <View style={s.cardTop}>
                                    <View style={s.labelBadge}>
                                        <Text style={{ fontSize: 16 }}>
                                            {LABEL_ICONS[item.label] || '📍'}
                                        </Text>
                                        <Text style={s.labelText}>{item.address_line}</Text>
                                    </View>
                                    {item.id === defaultAddressId && (
                                        <View style={s.defaultPill}>
                                            <Text style={s.defaultPillText}>✓ Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={s.cardCity}>
                                    {item.city}{item.pincode ? ` — ${item.pincode}` : ''}
                                </Text>
                                {item.landmark ? (
                                    <Text style={s.cardLandmark}>Near: {item.landmark}</Text>
                                ) : null}

                                <View style={s.cardActions}>
                                    {item.id !== defaultAddressId && (
                                        <TouchableOpacity style={s.setDefaultBtn} onPress={() => setAsDefault(item.id)}>
                                            <Text style={s.setDefaultText}>Set as Default</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity style={s.removeBtn} onPress={() => handleDelete(item.id)}>
                                        <Text style={s.removeText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Empty state */}
                {addresses.length === 0 && !showForm && (
                    <View style={s.emptyState}>
                        <Text style={{ fontSize: 40 }}>📍</Text>
                        <Text style={s.emptyTitle}>No addresses yet</Text>
                        <Text style={s.emptySub}>Add a delivery address for your orders</Text>
                    </View>
                )}

                {/* Form */}
                {showForm ? (
                    <View style={s.form}>
                        <Text style={s.sectionTitle}>{addresses.length === 0 ? 'Add Your Address' : 'Add New Address'}</Text>

                        <Text style={s.fieldLabel}>Label</Text>
                        <View style={s.labelRow}>
                            {LABELS.map(l => (
                                <TouchableOpacity
                                    key={l}
                                    style={[s.chip, label === l && s.chipActive]}
                                    onPress={() => setLabel(l)}
                                >
                                    <Text style={{ fontSize: 13 }}>{LABEL_ICONS[l]}</Text>
                                    <Text style={[s.chipText, label === l && s.chipTextActive]}>{l}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={s.fieldLabel}>Street / Flat / Building *</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. Flat 4B, Sunrise Towers, MG Road"
                            placeholderTextColor="#9C9C98"
                            value={addressLine}
                            onChangeText={setAddressLine}
                        />

                        <Text style={s.fieldLabel}>City / Area *</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. Koregaon Park, Pune"
                            placeholderTextColor="#9C9C98"
                            value={city}
                            onChangeText={setCity}
                        />

                        <Text style={s.fieldLabel}>Pincode</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. 411001"
                            placeholderTextColor="#9C9C98"
                            keyboardType="numeric"
                            value={pincode}
                            onChangeText={setPincode}
                        />

                        <Text style={s.fieldLabel}>Landmark (optional)</Text>
                        <TextInput
                            style={s.input}
                            placeholder="e.g. Near City Mall"
                            placeholderTextColor="#9C9C98"
                            value={landmark}
                            onChangeText={setLandmark}
                        />

                        <TouchableOpacity
                            style={[s.saveBtn, saving && s.saveBtnDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.saveBtnText}>Save Address</Text>
                            }
                        </TouchableOpacity>

                        {addresses.length > 0 && (
                            <TouchableOpacity onPress={() => setShowForm(false)} style={s.cancelBtn}>
                                <Text style={s.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
                        <Text style={s.addBtnIcon}>＋</Text>
                        <Text style={s.addBtnText}>Add New Address</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const s = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 48 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#FAFAF8' },
    loadingText: { color: '#9C9C98', fontSize: 14 },

    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A18', marginBottom: 12, marginTop: 8 },

    card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E8E6E0' },
    cardDefault: { borderColor: '#B85C38' },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
    labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    labelText: { fontSize: 14, fontWeight: '600', color: '#1A1A18', flex: 1 },
    defaultPill: { backgroundColor: '#F5E6DF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
    defaultPillText: { fontSize: 11, fontWeight: '700', color: '#B85C38' },
    cardCity: { fontSize: 13, color: '#5C5C58', marginTop: 2 },
    cardLandmark: { fontSize: 12, color: '#9C9C98', marginTop: 3 },
    cardActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    setDefaultBtn: { backgroundColor: '#F5E6DF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    setDefaultText: { color: '#B85C38', fontSize: 12, fontWeight: '600' },
    removeBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E8E6E0' },
    removeText: { color: '#9C9C98', fontSize: 12 },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
    emptySub: { fontSize: 13, color: '#9C9C98', textAlign: 'center' },

    form: { marginTop: 8 },
    fieldLabel: { fontSize: 11, color: '#9C9C98', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
    labelRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8E6E0' },
    chipActive: { backgroundColor: '#F5E6DF', borderColor: '#B85C38' },
    chipText: { fontSize: 13, color: '#9C9C98' },
    chipTextActive: { color: '#B85C38', fontWeight: '600' },
    input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8E6E0', padding: 13, fontSize: 14, color: '#1A1A18' },

    saveBtn: { backgroundColor: '#B85C38', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 20 },
    saveBtnDisabled: { backgroundColor: '#D4A898' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    cancelBtn: { alignItems: 'center', marginTop: 14 },
    cancelText: { color: '#9C9C98', fontSize: 14 },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B85C3860', borderStyle: 'dashed' },
    addBtnIcon: { fontSize: 18, color: '#B85C38' },
    addBtnText: { fontSize: 14, fontWeight: '600', color: '#B85C38' },
})
