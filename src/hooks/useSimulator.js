import { useMemo, useCallback } from 'react'
import { useGraduation } from './useGraduation'
import { useRequirements } from './useRequirements'
import { calculateGraduation } from '@/utils/calculateGraduation'
import { checkPrerequisites } from '@/utils/checkPrerequisites'
import { checkWarnings } from '@/utils/checkWarnings'

export function useSimulator() {
  const graduation = useGraduation()
  const { state, dispatch, allCourses } = graduation
  const { completedCourses, simulatedCourses, admissionYear } = state

  const req = useRequirements(admissionYear)

  const allEffectiveCourses = useMemo(
    () => [...new Set([...completedCourses, ...simulatedCourses])],
    [completedCourses, simulatedCourses]
  )

  const projectedStatus = useMemo(
    () => calculateGraduation(allEffectiveCourses, req, allCourses),
    [allEffectiveCourses, req, allCourses]
  )

  const projectedTotal = useMemo(
    () => allEffectiveCourses.reduce((sum, id) => sum + (allCourses[id]?.credits || 0), 0),
    [allEffectiveCourses, allCourses]
  )

  const projectedWarnings = useMemo(
    () => checkWarnings(projectedStatus, allEffectiveCourses, req, allCourses),
    [projectedStatus, allEffectiveCourses, req, allCourses]
  )

  const isProjectedGraduatable = useMemo(
    () =>
      projectedTotal >= req.totalRequired &&
      Object.values(projectedStatus).every(s => s.isSatisfied) &&
      projectedWarnings.every(w => !w.includes('필수 과목 미이수')),
    [projectedTotal, req, projectedStatus, projectedWarnings]
  )

  const addToSimulation = useCallback(
    (courseId) => {
      const prereq = checkPrerequisites(courseId, allEffectiveCourses, allCourses)
      if (!prereq.passed) {
        return { success: false, missing: prereq.missing }
      }
      dispatch({ type: 'SIMULATE_ADD', payload: courseId })
      return { success: true, missing: [] }
    },
    [dispatch, allEffectiveCourses, allCourses]
  )

  const removeFromSimulation = useCallback(
    (courseId) => dispatch({ type: 'SIMULATE_REMOVE', payload: courseId }),
    [dispatch]
  )

  const resetSimulation = useCallback(
    () => dispatch({ type: 'SIMULATE_RESET' }),
    [dispatch]
  )

  return {
    ...graduation,
    simulatedCourses,
    projectedStatus,
    projectedTotal,
    projectedWarnings,
    isProjectedGraduatable,
    addToSimulation,
    removeFromSimulation,
    resetSimulation,
    requirements: req,
  }
}
