const adjectives = [
  '빠른', '조용한', '활발한', '신중한', '용감한', '영리한', '성실한', '창의적인',
  '따뜻한', '날카로운', '유쾌한', '진지한', '강인한', '차분한', '열정적인', '밝은',
  '느긋한', '단호한', '섬세한', '호기심많은',
]

const nouns = [
  '여우', '독수리', '고양이', '늑대', '펭귄', '코알라', '판다', '호랑이',
  '사자', '토끼', '곰', '돌고래', '부엉이', '매', '여우원숭이', '기린',
  '치타', '재규어', '너구리', '담비',
]

export function generateNickname() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 900) + 100
  return `${adj}${noun}${num}`
}
