/**
 * @param {string[]} completedCourses - list of course IDs
 * @param {Object} requirements - requirements for admission year
 * @param {Object} allCourses - full course catalog
 * @returns {Object} statusByCategory
 */
export function calculateGraduation(completedCourses, requirements, allCourses) {
  const categories = ['전필', '전선', '교필', '교선', '자선']
  const status = {}

  for (const cat of categories) {
    const req = requirements[cat]
    if (!req) continue

    const completedInCat = completedCourses.filter(
      id => allCourses[id]?.type === cat
    )
    const completedCredits = completedInCat.reduce(
      (sum, id) => sum + (allCourses[id]?.credits || 0), 0
    )

    status[cat] = {
      completed: completedCredits,
      required: req.required,
      courses: completedInCat,
      isSatisfied: completedCredits >= req.required,
    }
  }

  // 다른 영역의 초과 이수 학점은 자선으로 산입 (실제 졸업 요건 규칙)
  if (status['자선']) {
    const overflow = ['전필', '전선', '교필', '교선'].reduce((sum, cat) => {
      if (!status[cat]) return sum
      return sum + Math.max(0, status[cat].completed - status[cat].required)
    }, 0)
    const effective = status['자선'].completed + overflow
    status['자선'].completed = effective
    status['자선'].isSatisfied = effective >= status['자선'].required
  }

  return status
}
