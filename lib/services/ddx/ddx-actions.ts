'use server'

import { createClient } from '@/lib/supabase/server'
import { generateErrorId } from '@/lib/utils/error-id'
import type { DdxItem, DdxMessage, DdxSession } from '@/types/ddx'
import { redirect } from 'next/navigation'

export const createDdxSession = async (hosId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ddx_sessions')
    .insert({
      hos_id: hosId,
      title: '새 감별진단',
      ddx_list: [],
      is_pinned: false,
      is_deleted: false,
    })
    .select()
    .single()

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }

  return data as DdxSession
}

export const getDdxSessions = async (hosId: string) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ddx_sessions')
    .select('*')
    .eq('hos_id', hosId)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getDdxSessions error:', error)
    return []
  }

  return (data ?? []) as DdxSession[]
}

export const getDdxSession = async (sessionId: string) => {
  const supabase = await createClient()

  const { data: session, error: sessionError } = await supabase
    .from('ddx_sessions')
    .select('*')
    .eq('ddx_session_id', sessionId)
    .eq('is_deleted', false)
    .single()

  if (sessionError) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, sessionError)
    redirect(`/error?errorId=${errorId}`)
  }

  const { data: messages, error: messagesError } = await supabase
    .from('ddx_messages')
    .select('*')
    .eq('ddx_session_id', sessionId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, messagesError)
    redirect(`/error?errorId=${errorId}`)
  }

  return {
    session: session as DdxSession,
    messages: (messages ?? []) as DdxMessage[],
  }
}

export const updateDdxSessionTitle = async (
  sessionId: string,
  title: string,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ddx_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('ddx_session_id', sessionId)

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }
}

export const toggleDdxSessionPin = async (
  sessionId: string,
  isPinned: boolean,
) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ddx_sessions')
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq('ddx_session_id', sessionId)

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }
}

export const updateDdxList = async (sessionId: string, ddxList: DdxItem[]) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ddx_sessions')
    .update({
      ddx_list: ddxList,
      updated_at: new Date().toISOString(),
    })
    .eq('ddx_session_id', sessionId)

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }
}

export const deleteDdxSession = async (sessionId: string) => {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ddx_sessions')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('ddx_session_id', sessionId)

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }
}

export const insertDdxMessage = async (
  message: Omit<DdxMessage, 'ddx_message_id' | 'created_at'>,
) => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ddx_messages')
    .insert({
      ddx_session_id: message.ddx_session_id,
      role: message.role,
      content: message.content,
      ddx_actions: message.ddx_actions ?? [],
    })
    .select()
    .single()

  if (error) {
    const errorId = generateErrorId()
    console.error(`[${errorId}]`, error)
    redirect(`/error?errorId=${errorId}`)
  }

  return data as DdxMessage
}
