-- Get the most recent parsed document to see what data was saved
SELECT 
    id,
    file_name,
    status,
    parsed_json,
    user_id,
    profile_id,
    parsed_at,
    created_at
FROM public.parsed_documents
ORDER BY created_at DESC
LIMIT 1;
