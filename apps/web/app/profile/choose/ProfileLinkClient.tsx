"use client"


import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ProfileLinkClient() {
  const [href, setHref] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const { data: sessionRes } = await supabaseClient.auth.getSession()
        const user = sessionRes?.session?.user
        if (!user) {
          if (mounted) setHref('/profile')
          return
        }

        const { data, error } = await supabaseClient
          .from('parsed_documents')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'parsed')
          .order('parsed_at', { ascending: false })
          .limit(1)

        if (error || !data || data.length === 0 || !data[0]?.id) {
          if (mounted) setHref('/profile')
        } else {
          if (mounted) setHref(`/parsed/${data[0].id}`)
        }
      } catch (e) {
        if (mounted) setHref('/profile')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // While loading, link to profile to avoid empty href; will redirect client-side if parsed exists
  const link = href || '/profile'

  return (
    <Link href={link}>
      <Button variant="default" style={{
        background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
        borderRadius: '14px',
        boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
      }}>
        View Profile
      </Button>
    </Link>
  )
}
