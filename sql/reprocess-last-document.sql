-- Find the most recent parsed document and reset it to 'pending' to reprocess
UPDATE parsed_documents
SET 
  status = 'pending',
  parsed_json = NULL,
  parsed_at = NULL
WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
  AND id = (
    SELECT id 
    FROM parsed_documents 
    WHERE profile_id = '24986b6e-7a91-4bb8-9a32-8a345aeb1875'
    ORDER BY created_at DESC 
    LIMIT 1
  )
RETURNING id, original_filename, status;
