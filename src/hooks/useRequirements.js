import { useMemo } from 'react'
import requirementsData from '@/data/requirements.json'

/**
 * @param {string} admissionYear
 * @returns {Object} graduation requirements
 */
export function useRequirements(admissionYear) {
  return useMemo(() => {
    return requirementsData[admissionYear] || requirementsData['2024']
  }, [admissionYear])
}
