-- Check the status of parsed_documents
SELECT 
    id,
    file_name,
    status,
    parsed_at,
    text_extracted IS NOT NULL as has_text,
    parsed_json IS NOT NULL as has_json,
    error_text,
    created_at
FROM public.parsed_documents
ORDER BY created_at DESC
LIMIT 5;

-- Check parsing jobs
SELECT 
    pj.id,
    pj.parsed_document_id,
    pj.status,
    pj.attempts,
    pj.created_at,
    pd.file_name
FROM public.parsing_jobs pj
LEFT JOIN public.parsed_documents pd ON pj.parsed_document_id = pd.id
ORDER BY pj.created_at DESC
LIMIT 5;

-- Update the Chuck Norris document to trigger re-parsing
-- First, let's manually parse it with stub data
UPDATE public.parsed_documents
SET 
    parsed_json = '{"parsed": true, "extracted_text": "stubbed parse - Chuck Norris CV", "name": "Chuck Norris", "email": "chuck.norris@example.com", "skills": ["Martial Arts", "Acting", "Roundhouse Kicks"]}'::jsonb,
    status = 'parsed',
    parsed_at = NOW()
WHERE file_name LIKE '%Chuck%' OR file_name LIKE '%Norris%'
RETURNING id, file_name, status;
