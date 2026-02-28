import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hgfbxpmzdiktsicdjtno.supabase.co'
const supabaseKey = 'sb_publishable_5mPO3YezPMbX3UBMIzSHJA_zPF6FD2F'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
    const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true })
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
    const { count: staffCount } = await supabase.from('staff_members').select('*', { count: 'exact', head: true })

    console.log('Customers:', customerCount)
    console.log('Orders:', orderCount)
    console.log('Staff:', staffCount)
}

checkData()
