-- Check the most recent parsed document with LLM data
SELECT 
    id,
    file_name,
    status,
    parsed_json->'llm' as llm_data,
    parsed_at,
    created_at
FROM public.parsed_documents
WHERE parsed_json->'llm' IS NOT NULL
ORDER BY created_at DESC
LIMIT 1;

-- Check if experiences were inserted (they failed due to date format)
SELECT * FROM public.experiences
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
ORDER BY created_at DESC;

-- Check education
SELECT * FROM public.education  
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
ORDER BY created_at DESC;

-- Check skills
SELECT * FROM public.skills
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
ORDER BY created_at DESC;
