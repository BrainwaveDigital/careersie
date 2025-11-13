#!/usr/bin/env node
// Insert a parsed_document referencing an existing user_id (from earlier run) and run the worker
require('./load-env')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const existingUserId = '5aad8d45-29af-46c3-ba03-5634a6ddbd8c'
  const filename = `integration-user-${Date.now()}.txt`
  const content = `Test User\nEmail: test@example.com\nExperience: Something`
  const buffer = Buffer.from(content, 'utf8')
  const storagePath = `resumes/${existingUserId}/${Date.now()}_${filename}`

  // upload file
  try {
    const { error } = await supabase.storage.from('resumes').upload(storagePath, buffer, { contentType: 'text/plain' })
    if (error) {
      console.error('upload error', error)
      process.exit(1)
    }
  } catch (e) {
    console.error('upload exception', e)
    process.exit(1)
  }

  // insert parsed_document with real user id
  const { data: parsedRows, error: pdErr } = await supabase.from('parsed_documents').insert([{
    user_id: existingUserId,
    file_name: filename,
    storage_path: storagePath,
    content_type: 'text/plain',
    size_bytes: buffer.length,
    status: 'uploaded'
  }]).select()
  if (pdErr) {
    console.error('Failed to insert parsed_documents', pdErr)
    process.exit(1)
  }
  const parsedDocument = Array.isArray(parsedRows) ? parsedRows[0] : parsedRows

  const { data: jobRows, error: jobErr } = await supabase.from('parsing_jobs').insert([{ parsed_document_id: parsedDocument.id, status: 'pending' }]).select()
  if (jobErr) {
    console.error('Failed to create parsing job', jobErr)
    process.exit(1)
  }
  const job = Array.isArray(jobRows) ? jobRows[0] : jobRows

  console.log('Inserted parsedDocument', parsedDocument.id, 'job', job.id)

  const worker = require('./parsing-worker')
  try {
    await worker.runJob(job)
    console.log('Worker runJob completed')
  } catch (e) {
    console.error('Worker runJob failed', e)
    process.exit(1)
  }

  const { data: updatedDocs, error: udErr } = await supabase.from('parsed_documents').select('*').eq('id', parsedDocument.id).limit(1)
  if (udErr) {
    console.error('Failed fetching updated parsed_document', udErr)
    process.exit(1)
  }
  console.log('Updated parsed document:', JSON.stringify(updatedDocs[0], null, 2))
}

main()
