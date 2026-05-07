/**
 * @param {Object} statusByCategory
 * @param {string[]} completedCourses
 * @param {Object} requirements
 * @param {Object} allCourses
 * @returns {string[]} warnings in Korean
 */
export function checkWarnings(statusByCategory, completedCourses, requirements, allCourses) {
  const warnings = []

  for (const [cat, status] of Object.entries(statusByCategory)) {
    if (!status.isSatisfied) {
      const remaining = status.required - status.completed
      warnings.push(`[${cat}] 이수 학점 부족: ${remaining}학점 추가 이수 필요`)
    }

    const requiredCourses = requirements[cat]?.courses || []
    for (const courseId of requiredCourses) {
      if (!completedCourses.includes(courseId)) {
        const name = allCourses[courseId]?.name || courseId
        warnings.push(`[${cat}] 필수 과목 미이수: ${name} (${courseId})`)
      }
    }
  }

  // prerequisite warnings for completed courses
  for (const courseId of completedCourses) {
    const course = allCourses[courseId]
    if (!course) continue
    for (const pre of course.prerequisites || []) {
      if (!completedCourses.includes(pre)) {
        const preName = allCourses[pre]?.name || pre
        warnings.push(`[선수과목] ${course.name}의 선수과목 ${preName}을(를) 이수하지 않았습니다`)
      }
    }
  }

  // semester credit cap check
  const max = requirements.maxCreditsPerSemester
  if (max) {
    const semMap = {}
    for (const courseId of completedCourses) {
      const course = allCourses[courseId]
      if (!course || !course.year || !course.semester) continue
      const key = `${course.year}학년 ${course.semester}학기`
      semMap[key] = (semMap[key] || 0) + (course.credits || 0)
    }
    for (const [sem, credits] of Object.entries(semMap)) {
      if (credits > max) {
        warnings.push(`[학점초과] ${sem}: ${credits}학점 등록 (최대 ${max}학점)`)
      }
    }
  }

  return warnings
}
