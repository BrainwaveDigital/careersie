-- Check what's actually in parsed_json for the Chuck Norris CV
SELECT 
  id,
  original_filename,
  status,
  parsed_json IS NULL as json_is_null,
  parsed_json::text as raw_json,
  jsonb_typeof(parsed_json) as json_type,
  parsed_json ? 'llm' as has_llm_key,
  (parsed_json->'llm') IS NULL as llm_is_null,
  created_at,
  updated_at
FROM parsed_documents
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
ORDER BY created_at DESC
LIMIT 1;

-- Also check the actual structure
SELECT 
  jsonb_object_keys(parsed_json) as top_level_keys
FROM parsed_documents
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
  AND parsed_json IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;
