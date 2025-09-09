@@ .. @@
-import { createClient } from '@supabase/supabase-js'
+import { createClient } from '@supabase/supabase-js';
+import AsyncStorage from '@react-native-async-storage/async-storage';
 
-const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
-const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
+// Configuración de Supabase
+const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
+const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
 
-export const supabase = createClient(supabaseUrl, supabaseAnonKey)
+export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
+  auth: {
+    storage: AsyncStorage,
+    autoRefreshToken: true,
+    persistSession: true,
+    detectSessionInUrl: false,
+  },
+});
+
+// Tipos para TypeScript
+export type Database = {
+  public: {
+    Tables: {
+      couples_sessions: {
+        Row: {
+          id: string;
+          couple_name: string;
+          user1_name: string;
+          user2_name: string | null;
+          current_wheel_type: string | null;
+          current_options: any[] | null;
+          is_spinning: boolean | null;
+          wheel_rotation: number | null;
+          spin_start_time: string | null;
+          last_result: string | null;
+          result_for_user: string | null;
+          created_at: string | null;
+          updated_at: string | null;
+        };
+        Insert: {
+          id?: string;
+          couple_name: string;
+          user1_name: string;
+          user2_name?: string | null;
+          current_wheel_type?: string | null;
+          current_options?: any[] | null;
+          is_spinning?: boolean | null;
+          wheel_rotation?: number | null;
+          spin_start_time?: string | null;
+          last_result?: string | null;
+          result_for_user?: string | null;
+          created_at?: string | null;
+          updated_at?: string | null;
+        };
+        Update: {
+          id?: string;
+          couple_name?: string;
+          user1_name?: string;
+          user2_name?: string | null;
+          current_wheel_type?: string | null;
+          current_options?: any[] | null;
+          is_spinning?: boolean | null;
+          wheel_rotation?: number | null;
+          spin_start_time?: string | null;
+          last_result?: string | null;
+          result_for_user?: string | null;
+          created_at?: string | null;
+          updated_at?: string | null;
+        };
+      };
+    };
+  };
+};