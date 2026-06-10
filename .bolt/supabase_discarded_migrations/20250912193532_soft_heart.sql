@@ .. @@
     generate_seo_metadata,
     is_public,
-    public_name,
-    public_description,
     project_description,
@@ .. @@
     (p.data->>'generateSeoMetadata')::boolean AS generate_seo_metadata,
     p.is_public,
-    p.public_name,
-    p.public_description,
     p.data->>'projectDescription' AS project_description,