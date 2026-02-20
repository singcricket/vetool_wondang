import MsFooter from '@/components/hospital/monitoring/footer/ms-footer'
import MsSidebar from '@/components/hospital/monitoring/sidebar/ms-sidebar';
import { fetchMsLayoutData } from '@/lib/services/monitoring/monitoring-layout';
// import ChecklistSidebar from '@/components/hospital/checklist/sidebar/checklist-sidebar'
import { MonitoringHosDataProvider } from '@/providers/monitoring-hos-data-context-provider'

export default async function MonitoringPageLayout(props: {
  children: React.ReactNode
  params: Promise<{ target_date: string; hos_id: string }>
}) {
  const { hos_id, target_date } = await props.params

  const {
    basicHosSettings: {
      group_list,
      icu_memo_names,
      is_in_charge_system,
      order_color,
      order_font_size,
      plan,
      show_orderer,
      show_tx_user,
      time_guidelines,
      vital_ref_range,
    },
    vetList,
  } = await fetchMsLayoutData(hos_id, target_date)

  const postGroupList = group_list.filter((group) => group !== '응급') ? ['응급', ...group_list] : group_list

//   const hosGroupList = ['외과', '호텔링', 'ICU', '내과', '영상', '응급']
//   const vetList = [
//     {
//       user_id: '419c8cbf-2928-4663-8f83-f4b7578b1395',
//       name: '김방창',
//       avatar_url:
//         'https://lh3.googleusercontent.com/a/ACg8ocL-5Eyk6_wJr8q4YeIFZNQ4WtRtyJiu1Yub6EOZ999Emni8i8c=s96-c',
//       position: '벳툴왕',
//       rank: 1,
//     }
//   ]


  return (
    <MonitoringHosDataProvider
      // TODO : 실제 데이터 fetching
      clContextData={{
        groupListData: postGroupList,
        plan: plan,
        vetsListData: vetList,
      }}
    >
      <div className="flex h-desktop">
        <MsSidebar 
        hosId={hos_id} 
        targetDate={target_date} 
        hosGroupList={postGroupList}
        vetList={vetList}
        />

        <div className="ml-0 w-screen flex-1 2xl:ml-96 2xl:w-auto">
          {props.children}
        </div>
      </div>

      <MsFooter hosId={hos_id} targetDate={target_date} />
    </MonitoringHosDataProvider>
  )
}
