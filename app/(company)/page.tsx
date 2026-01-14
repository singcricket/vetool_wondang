import FaqsSection from '@/components/company/main/faqs/faqs-section'
import FeatureSection from '@/components/company/main/feature/feature-section'
import HeroSection from '@/components/company/main/hero/hero-section'
import StatsSection from '@/components/company/main/stats/stats-section'
import TestinomialSection from '@/components/company/main/testimonial/testimonial-section'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClaims } from '@/types'
import { redirect } from 'next/navigation'

export default async function CompanyHomePage() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()

  // data가 있다는 것은 supabase 로그인 한 경우
  if (data) {
    const supabaseUser = data.claims as SupabaseClaims

    // 벳툴 users 테이블에서 해당 사용자 조회
    const { data: vetoolUser, error: vetoolUserError } = await supabase
      .from('users')
      .select('hos_id, user_id')
      .eq('user_id', supabaseUser.sub)
      .maybeSingle()

    // 조회 과정에서 에러 발생시 login 페이지 이동
    if (vetoolUserError) {
      console.error(vetoolUserError)
      redirect('/login')
    }

    if (vetoolUser) {
      if (vetoolUser.hos_id) {
        // 벳툴 users 테이블에서 있고 병원에 등록되어있는 경우 : 99% 케이스
        redirect(`/hospital/${vetoolUser.hos_id}`)
      } else {
        // 벳툴 users 테이블에서 있으나 병원에 등록되지 않은 경우
        // 첫 로그인 후 병원 등록을 하지 않은 경우 or 아직 승인이 되지 않은 경우
        // 따라서 user_approvals 테이블을 조회해야함
        const { data: userApprovalData, error: userApprovalDataError } =
          await supabase
            .from('user_approvals')
            .select()
            .eq('user_id', vetoolUser.user_id)
            .maybeSingle()

        if (userApprovalDataError) {
          console.error(userApprovalDataError)
          redirect('/login')
        }

        if (userApprovalData) {
          // 승인요청 데이터가 있는 경우 : 승인 대기 페이지로 이동
          redirect('/on-boarding/approval-waiting')
        } else {
          // 승인요청 데이터가 없는 경우 : on-boarding 페이지로 이동
          redirect('/on-boarding')
        }
      }
    } else {
      // 벳툴 users 테이블에서 없는 경우 : 첫 구글 로그인
      // users 테이블에 user_id, name, email, avatar_url 추가 후
      // on-boarding 페이지 이동
      const { error: insertUserError } = await supabase.from('users').insert({
        user_id: supabaseUser.sub,
        name: supabaseUser.user_metadata.name,
        email: supabaseUser.user_metadata.email,
        avatar_url: supabaseUser.user_metadata.avatar_url,
      })

      if (insertUserError) {
        console.error(insertUserError)
        redirect('/login')
      }

      redirect('/on-boarding')
    }
  }

  // 로그인 안한 경우 홈 내용을 표시함
  return (
    <div className="flex flex-col">
      <HeroSection />

      <StatsSection />

      <TestinomialSection />

      <FeatureSection />

      <FaqsSection />

      {/* <PricingSection /> */}
    </div>
  )
}
