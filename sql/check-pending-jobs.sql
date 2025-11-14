-- Check for pending parsing jobs
SELECT 
    pj.id,
    pj.parsed_document_id,
    pj.status,
    pj.attempts,
    pj.created_at,
    pd.file_name,
    pd.status as doc_status
FROM public.parsing_jobs pj
LEFT JOIN public.parsed_documents pd ON pj.parsed_document_id = pd.id
WHERE pj.status = 'pending'
ORDER BY pj.created_at ASC;

-- Check recent parsed documents
SELECT 
    id,
    file_name,
    status,
    parsed_at,
    created_at
FROM public.parsed_documents
ORDER BY created_at DESC
LIMIT 5;
