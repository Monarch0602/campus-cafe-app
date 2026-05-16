import { supabase } from './supabase'

/**
 * Save a notification to the database
 * This shows up in the user's notification screen
 */
export async function notifyUser(userId, title, body, type = 'general', orderId = null) {
    if (!userId) return
    try {
        await supabase.from('notifications').insert({
            user_id: userId,
            title,
            body,
            type,
            order_id: orderId,
            is_read: false,
        })
    } catch (err) {
        console.log('Notify error:', err)
    }
}

/**
 * Get unread notification count for the bell icon badge
 */
export async function getUnreadCount(userId) {
    if (!userId) return 0
    try {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)
        return count || 0
    } catch (err) {
        return 0
    }
}