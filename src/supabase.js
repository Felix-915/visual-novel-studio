import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = "https://zejmljzwwatfuntzehvx.supabase.co";
// const supabaseKey = "sb_publishable_-rIpIK6hYF-ZaFz0CFdMvw_mH_Ia3_j";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);