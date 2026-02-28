import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hgfbxpmzdiktsicdjtno.supabase.co'
const supabaseKey = 'sb_publishable_5mPO3YezPMbX3UBMIzSHJA_zPF6FD2F'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
    const { data, error } = await supabase.from('orders').select('*').limit(3)
    if (error) {
        console.error(error)
        return
    }
    console.log(JSON.stringify(data, null, 2))
}

checkOrders()
