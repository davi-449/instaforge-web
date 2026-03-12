const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function getSchema() {
  const { data, error } = await supabase.rpc('get_schema');
  if (error) {
    console.log("RPC failed, trying to query information_schema...");
    // We can't query information_schema directly with anon key usually, but let's try
    const { data: tables, error: tableError } = await supabase
      .from('brand_settings')
      .select('*')
      .limit(1);
    console.log("brand_settings:", tables);
  } else {
    console.log(data);
  }
}
getSchema();
