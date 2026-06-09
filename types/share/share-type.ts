export type ShareTargetType = 'public' | 'hospital' | 'user'
export type ShareResourceType = 'note' | 'icu' | 'monitoring' | 'collection' | 'dental' | 'oncology_owner' | 'checkup'
export type SharePermissionLevel = 'read' | 'comment' | 'edit'

// ── 공유 권한 테이블 제어 타입 ──
export interface ResourceShare {
  id: string                    // 공유 토큰 (UUID)
  owner_hos_id: string          // 원본 소유 병원 ID
  owner_user_id?: string | null // 작성자/소유자 수의사 ID
  
  resource_type: ShareResourceType // 어떤 데이터를 공유하는가
  resource_id: string              // 해당 데이터의 원본 고유 ID
  
  share_target_type: ShareTargetType // 누구에게 공유하는가 (전체, 특정 병원, 특정 유저)
  target_id?: string | null          // share_target_type이 hospital이나 user일 때 값 세팅
  
  permission_level: SharePermissionLevel // 조회, 댓글, 수정 등 권한
  restricted_data?: Record<string, any> | null // 가림표시 설정 ex: { hide_internal: true }
  
  valid_from?: string | null    // 공유 유효 시작 시간 (ISO 8601)
  valid_until?: string | null   // 공유 만료 시간 (ISO 8601)
  
  created_at: string
}

// ── 컬렉션 (폴더) 타입 ──
export interface CollectionItem {
  type: ShareResourceType // note, icu, monitoring 등
  id: string              // 해당 데이터의 원본 고유 ID
}

export interface Collection {
  id: string
  title: string                     // 예: "뽀삐 타병원 이관 진료기록 모음"
  description?: string | null       // 상세 설명
  items: CollectionItem[]           // 배열로 여러 문서를 보관
  owner_hos_id: string              // 컬렉션 소유 병원
  created_by?: string | null        // 컬렉션 생성 유저 ID
  created_at: string
}
