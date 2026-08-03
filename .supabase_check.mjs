import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_KEY (or VITE_SUPABASE_*) in your environment.');
  process.exit(2);
}

const supabase = createClient(url, key);

(async () => {
  try {
    const { data, error } = await supabase.from('diagrams').select('id').limit(1);
    if (error) {
      console.error('Query error:', error.message || error);
      // try to detect missing table
      if ((error.message || '').toLowerCase().includes('does not exist') || (error.code && String(error.code).includes('42'))) {
        console.log('Table `diagrams` does not exist.');
        process.exit(3);
      }
      process.exit(1);
    }
    console.log('Table `diagrams` exists. Sample:', data && data[0]);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
