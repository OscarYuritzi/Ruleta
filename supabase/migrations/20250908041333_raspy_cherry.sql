@@ .. @@
     wheel_type text,
     current_options jsonb DEFAULT '[]'::jsonb,
+    last_result text,
     last_activity timestamptz DEFAULT now(),