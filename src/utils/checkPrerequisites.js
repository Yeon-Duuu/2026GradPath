/**
 * @param {string} courseId
 * @param {string[]} completedCourses
 * @param {Object} allCourses
 * @returns {{ passed: boolean, missing: string[] }}
 */
export function checkPrerequisites(courseId, completedCourses, allCourses) {
  const course = allCourses[courseId]
  if (!course) return { passed: false, missing: [] }

  const prerequisites = course.prerequisites || []
  const missing = prerequisites.filter(pre => !completedCourses.includes(pre))

  return {
    passed: missing.length === 0,
    missing: missing.map(id => allCourses[id]?.name || id),
  }
}
