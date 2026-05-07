import { useMemo } from 'react'

const BADGE_DEFS = [
  { id: 'major_required', label: '전공필수 완료', category: '전필', emoji: '🏅' },
  { id: 'liberal_required', label: '공통교양 완료', category: '교필', emoji: '🏅' },
  { id: 'liberal_balance', label: '균형교양 완료', category: '교선', emoji: '🏅' },
  { id: 'major_elective', label: '전공선택 완료', category: '전선', emoji: '🏅' },
  { id: 'graduation', label: '졸업요건 전체 충족', category: null, emoji: '🎓' },
]

export function useBadge({ statusByCategory, isGraduatable }) {
  return useMemo(() => {
    return BADGE_DEFS.map(def => {
      let earned
      if (def.category === null) {
        earned = isGraduatable
      } else {
        earned = statusByCategory[def.category]?.isSatisfied ?? false
      }
      return { ...def, earned }
    })
  }, [statusByCategory, isGraduatable])
}
