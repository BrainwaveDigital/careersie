-- Get the latest parsed document with full JSON to see what's actually saved
SELECT 
    id,
    file_name,
    status,
    profile_id,
    parsed_json->'llm'->>'name' as extracted_name,
    jsonb_array_length(parsed_json->'llm'->'experiences') as experience_count,
    jsonb_array_length(parsed_json->'llm'->'education') as education_count,
    jsonb_array_length(parsed_json->'llm'->'skills') as skills_count,
    parsed_at,
    created_at
FROM public.parsed_documents
WHERE parsed_json->'llm' IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;
