function compareByPortPath(a: ProcessInfo, b: ProcessInfo): number {
  const aHasPorts = a.ports.length > 0
  const bHasPorts = b.ports.length > 0
  const aHasPath = a.path.length > 0
  const bHasPath = b.path.length > 0

  if (aHasPorts && aHasPath && !(bHasPorts && bHasPath)) return -1
  if (bHasPorts && bHasPath && !(aHasPorts && aHasPath)) return 1
  if (aHasPorts && !bHasPorts) return -1
  if (bHasPorts && !aHasPorts) return 1
  if (aHasPath && !bHasPath) return -1
  if (bHasPath && !aHasPath) return 1

  return 0
}

export function searchProcesses(keyword: string, processes: ProcessInfo[]): ProcessInfo[] {
  const kw = keyword.trim()

  if (!kw) {
    // 无搜索词：仅按端口/路径排序
    return [...processes].sort(compareByPortPath)
  }

  const isNumeric = /^\d+$/.test(kw)
  const hasPathSep = /[/\\]/.test(kw)
  const isExe = /\.exe$/i.test(kw)
  const multiNums = kw.match(/\d+/g)

  if (isNumeric) {
    const num = parseInt(kw, 10)
    return processes
      .filter(p => p.pid === num || p.ports.includes(num))
      .sort(compareByPortPath)
  }

  if (multiNums && multiNums.length > 1) {
    const nums = multiNums.map(Number)
    return processes
      .filter(p => nums.includes(p.pid) || p.ports.some(port => nums.includes(port)))
      .sort(compareByPortPath)
  }

  // 文本搜索：匹配度为主排序，端口/路径为 tie-breaker
  const lower = kw.toLowerCase()

  return processes
    .map(p => {
      let score = -1
      const nameLower = p.name.toLowerCase()
      const pathLower = p.path.toLowerCase()

      if (isExe || hasPathSep) {
        if (nameLower === lower) score = 100
        else if (nameLower.startsWith(lower)) score = 80
        else if (pathLower.includes(lower)) score = 70
        else if (nameLower.includes(lower)) score = 50
      } else {
        if (nameLower === lower) score = 100
        else if (nameLower.startsWith(lower)) score = 80
        else if (nameLower.includes(lower)) score = 50
        else if (pathLower.includes(lower)) score = 40
      }

      return { process: p, score }
    })
    .filter(s => s.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return compareByPortPath(a.process, b.process)
    })
    .map(s => s.process)
}
