import { createClient } from './lib/supabase/server'

async function checkSchema() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cytology_images').select('*').limit(1)
  
  if (error) {
    console.error('Error fetching cytology_images:', error)
  } else {
    console.log('Sample data from cytology_images:', data)
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
    }
  }
}

checkSchema()
