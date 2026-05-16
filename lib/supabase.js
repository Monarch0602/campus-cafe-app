import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btykhywsidlusbyrmkhp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0eWtoeXdzaWRsdXNieXJta2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTE4NjksImV4cCI6MjA5MzA2Nzg2OX0.D9VqwQmW9JgLuqA9hQfAFuqseJnmV0ro4FfFidvxDvE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
