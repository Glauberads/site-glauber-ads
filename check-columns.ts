
import { supabase } from "./src/integrations/supabase/client";

async function checkColumns() {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1);
  if (error) {
    console.error("Error fetching site_settings:", error);
  } else {
    console.log("Columns found in site_settings:", Object.keys(data[0] || {}));
  }
}

checkColumns();
