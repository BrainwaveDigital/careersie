import { NextResponse } from 'next/server'
import { getSupabaseServerWithAuth } from '@/lib/supabase.server'
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import pdfParse from 'pdf-parse';

// POST /api/parsing
export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return new NextResponse(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
    }
    const token = auth.split(' ')[1]

    // validate token by asking Supabase auth endpoint
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return new NextResponse(JSON.stringify({ error: 'SUPABASE URL not configured' }), { status: 500 });

    const userRes = await fetch(new URL('/auth/v1/user', supabaseUrl).toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        // include anon key as apikey header to satisfy Supabase auth endpoint requirements
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      }
    })
    if (!userRes.ok) return new NextResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
    const user = await userRes.json()
    const userId = user?.id
    if (!userId) return new NextResponse(JSON.stringify({ error: 'Unable to determine user id' }), { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return new NextResponse(JSON.stringify({ error: 'No file provided (field name: file)' }), { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = (file as any).name || `upload-${Date.now()}`

    // Use service role key for storage to bypass RLS
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const sb = createClient<Database>(supabaseUrl, serviceRoleKey);

    // Upload to storage bucket 'resumes'. Ensure the bucket exists in your Supabase project.
    const storagePath = `resumes/${userId}/${Date.now()}_${filename}`
    // Attempt upload; on failure, try to create the bucket (if missing) and retry once.
    let uploadResult
    try {
      uploadResult = await sb.storage.from('resumes').upload(storagePath, buffer, {
        contentType: (file as any).type || 'application/octet-stream',
        upsert: false,
      })
    } catch (err) {
      console.error('Upload threw error:', err)
      uploadResult = { data: null, error: err }
    }

    let uploadError = uploadResult?.error
    if (uploadError) {
      console.error('Initial storage upload error:', uploadError)
      // If bucket is missing or not found, try to create it (server-only action)
      const errorMessage = (uploadError as any)?.message || ''
      const errorStatus = (uploadError as any)?.status
      const shouldTryCreate = String(errorMessage).toLowerCase().includes('not found') || errorStatus === 404
      if (shouldTryCreate) {
        try {
          console.log('Attempting to create missing storage bucket: resumes')
          const { data: createData, error: createErr } = await sb.storage.createBucket('resumes', { public: false })
          if (createErr) {
            console.error('Failed creating bucket resumes:', createErr)
          } else {
            console.log('Bucket created:', createData)
            // retry upload once
            const { error: retryErr } = await sb.storage.from('resumes').upload(storagePath, buffer, {
              contentType: (file as any).type || 'application/octet-stream',
              upsert: false,
            })
            if (retryErr) {
              console.error('Retry upload failed:', retryErr)
              return new NextResponse(JSON.stringify({ error: 'Storage upload failed after bucket create', details: retryErr }), { status: 500 })
            }
          }
        } catch (createBucketErr) {
          console.error('Error while attempting to create bucket and retry upload:', createBucketErr)
          return new NextResponse(JSON.stringify({ error: 'Storage upload failed', details: uploadError }), { status: 500 })
        }
      } else {
        return new NextResponse(JSON.stringify({ error: 'Storage upload failed', details: uploadError }), { status: 500 })
      }
    }

    // Generate a UUID for the required id field
    const id = crypto.randomUUID();
    let parsedJson = null;
    try {
      // Parse the PDF file buffer
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text || '';

      // Simple regex-based extraction for demo purposes
      const nameMatch = text.match(/Name[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i);
      const emailMatch = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
      const phoneMatch = text.match(/(\+?\d[\d\s\-()]{7,}\d)/);

      // Fake skills extraction: look for a 'Skills' section
      let skills: string[] = [];
      const skillsSection = text.match(/Skills[:\s\n]+([\w\s,\-]+)/i);
      if (skillsSection && skillsSection[1]) {
        skills = skillsSection[1].split(/,|\n|\r/).map((s: string) => s.trim()).filter(Boolean);
      }

      // Fake experience extraction: look for 'Experience' section
      let experiences: any[] = [];
      const expSection = text.match(/Experience[:\s\n]+([\s\S]{0,500})/i);
      if (expSection && expSection[1]) {
        // Just take the first line as job title/company
        const lines = expSection[1].split(/\n|\r/).map((l: string) => l.trim()).filter(Boolean);
        if (lines.length) {
          experiences.push({
            title: lines[0],
            company: lines[1] || '',
            start_date: null,
            end_date: null,
            is_current: false,
            description: lines.slice(2).join(' ')
          });
        }
      }

      // Fake education extraction: look for 'Education' section
      let education: any[] = [];
      const eduSection = text.match(/Education[:\s\n]+([\s\S]{0,300})/i);
      if (eduSection && eduSection[1]) {
        const lines = eduSection[1].split(/\n|\r/).map((l: string) => l.trim()).filter(Boolean);
        if (lines.length) {
          education.push({
            school: lines[0],
            degree: lines[1] || '',
            start_year: null,
            end_year: null,
            description: lines.slice(2).join(' ')
          });
        }
      }

      parsedJson = {
        profile: {
          full_name: nameMatch ? nameMatch[1] : '',
          email: emailMatch ? emailMatch[0] : '',
          phone: phoneMatch ? phoneMatch[0] : '',
        },
        skills,
        experiences,
        education,
        // All extra fields go under 'meta' (not validated by schema)
        meta: {
          parsed: true,
          extracted_text: text,
          num_pages: pdfData.numpages,
          info: pdfData.info,
          metadata: pdfData.metadata,
          llm: {
            name: nameMatch ? nameMatch[1] : '',
            email: emailMatch ? emailMatch[0] : '',
            phone: phoneMatch ? phoneMatch[0] : '',
            summary: '',
            skills,
            experiences,
            education,
          }
        }
      };
    } catch (parseErr) {
      console.error('PDF parsing failed:', parseErr);
      parsedJson = { parsed: false, error: 'PDF parsing failed', details: String(parseErr) };
    }
    try {
      console.log('About to insert document:', {
        userId,
        fileName: filename,
        storagePath,
        contentType: (file as any).type || null,
        sizeBytes: buffer.length,
        status: 'uploaded',
      });

      const { data, error } = await sb
        .from('parsed_documents')
        .insert({
          id,
          user_id: userId,
          file_name: filename,
          storage_path: storagePath,
          content_type: (file as any).type || null,
          size_bytes: buffer.length,
          status: 'uploaded',
          parsed_json: parsedJson,
          parsed_at: new Date().toISOString(),
        })
        .select()
        .single();

      console.log('Insert result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      var parsedDocument = data;
    } catch (err) {
      console.error('Caught error in parsing route:', err);
      return NextResponse.json(
        { error: 'Failed to create parsed_documents row', details: err },
        { status: 500 }
      );
    }

    // Generate a UUID for the required id field
    const jobId = crypto.randomUUID();
    // Create parsing job
    const { data: jobRows, error: jobErr } = await sb
      .from('parsing_jobs')
      .insert([{ id: jobId, parsed_document_id: parsedDocument!.id, status: 'pending' }])
      .select()
    if (jobErr) return new NextResponse(JSON.stringify({ error: 'Failed to create parsing_jobs row', details: jobErr }), { status: 500 })
    const parsingJob = Array.isArray(jobRows) ? jobRows[0] : jobRows

    // Optional synchronous parse stub for local testing
    if (process.env.PARSE_SYNC === '1') {
      const stubJson = { 
        parsed: true, 
        extracted_text: 'Stubbed parse - run parser worker for real parsing',
        extracted: {
          name: 'Sample User',
          email: 'sample@example.com',
          phone: '+1 (555) 123-4567'
        },
        llm: {
          name: 'Sample User',
          email: 'sample@example.com',
          phone: '+1 (555) 123-4567',
          summary: 'This is a test CV parsed with stub data. Upload a real CV to see actual parsing results.',
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'],
          experiences: [
            {
              title: 'Software Engineer',
              company: 'Tech Company',
              start_date: '2020-01',
              end_date: null,
              is_current: true,
              description: 'Working on web applications'
            }
          ],
          education: [
            {
              school: 'University',
              degree: 'Bachelor of Science',
              field_of_study: 'Computer Science',
              start_year: 2016,
              end_year: 2020
            }
          ]
        },
        // Add root-level properties that match the schema for ProcessParsedClient
        profile: {
          full_name: 'Sample User',
          email: 'sample@example.com',
          phone: '+1 (555) 123-4567',
          summary: 'This is a test CV parsed with stub data. Upload a real CV to see actual parsing results.'
        },
        experiences: [
          {
            title: 'Software Engineer',
            company: 'Tech Company',
            start_date: '2020-01-01',
            end_date: null,
            is_current: true,
            description: 'Working on web applications'
          }
        ],
        education: [
          {
            school: 'University',
            degree: 'Bachelor of Science',
            field_of_study: 'Computer Science',
            start_year: 2016,
            end_year: 2020
          }
        ],
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python']
      }
      await sb
        .from('parsed_documents')
        .update({ parsed_json: stubJson, status: 'parsed', parsed_at: new Date().toISOString() })
        .eq('id', parsedDocument!.id)

      await sb
        .from('parsing_jobs')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('id', parsingJob!.id)
    }

    return new NextResponse(JSON.stringify({ parsed_document: parsedDocument, parsing_job: parsingJob }), { status: 201 })
  } catch (err) {
    let errorMessage = 'Internal error';
    if (err instanceof Error) {
      errorMessage = err.message + (err.stack ? ('\n' + err.stack) : '');
    } else if (typeof err === 'object' && err !== null) {
      errorMessage = JSON.stringify(err);
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    console.error('API /api/parsing error:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Internal error', details: errorMessage }), { status: 500 })
  }
}

export const runtime = 'nodejs'
