import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value.replace(/['"]/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function getSchema() {
  const { data: brand_settings, error: e1 } = await supabase.from('brand_settings').select('*').limit(1);
  console.log("brand_settings:", brand_settings);
  
  const { data: projects, error: e2 } = await supabase.from('projects').select('*').limit(1);
  console.log("projects:", projects, e2);
  
  const { data: posts, error: e3 } = await supabase.from('posts').select('*').limit(1);
  console.log("posts:", posts, e3);
  
  const { data: carousels, error: e4 } = await supabase.from('carousels').select('*').limit(1);
  console.log("carousels:", carousels, e4);
}
getSchema();
