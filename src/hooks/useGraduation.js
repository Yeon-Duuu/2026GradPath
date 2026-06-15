import { useMemo } from 'react'
import { useGraduationContext } from '@/context/GraduationContext'
import { useRequirements } from './useRequirements'
import { calculateGraduation } from '@/utils/calculateGraduation'
import { checkWarnings } from '@/utils/checkWarnings'
import coursesData from '@/data/courses.json'

export function useGraduation() {
  const { state, dispatch } = useGraduationContext()
  const { completedCourses, admissionYear } = state
  const requirements = useRequirements(admissionYear)

  const statusByCategory = useMemo(
    () => calculateGraduation(completedCourses, requirements, coursesData),
    [completedCourses, requirements]
  )

  // statusByCategory가 아닌 실제 이수 과목 학점의 합 (자선 산입 로직으로 인한 이중 계산 방지)
  const totalCompleted = useMemo(
    () => completedCourses.reduce((sum, id) => sum + (coursesData[id]?.credits || 0), 0),
    [completedCourses]
  )

  const totalRequired = requirements.totalRequired

  const warnings = useMemo(
    () => checkWarnings(statusByCategory, completedCourses, requirements, coursesData),
    [statusByCategory, completedCourses, requirements]
  )

  const isGraduatable = useMemo(
    () =>
      totalCompleted >= totalRequired &&
      Object.values(statusByCategory).every(s => s.isSatisfied) &&
      warnings.every(w => !w.includes('필수 과목 미이수')),
    [totalCompleted, totalRequired, statusByCategory, warnings]
  )

  return {
    state,
    dispatch,
    statusByCategory,
    totalCompleted,
    totalRequired,
    isGraduatable,
    warnings,
    allCourses: coursesData,
  }
}
