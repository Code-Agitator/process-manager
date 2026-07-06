export function searchProcesses(keyword: string, processes: ProcessInfo[]): ProcessInfo[] {
  const kw = keyword.trim()
  if (!kw) return processes

  const isNumeric = /^\d+$/.test(kw)
  const hasPathSep = /[/\\]/.test(kw)
  const isExe = /\.exe$/i.test(kw)
  const multiNums = kw.match(/\d+/g)

  if (isNumeric) {
    const num = parseInt(kw, 10)
    return processes.filter(p => p.pid === num || p.ports.includes(num))
  }

  if (multiNums && multiNums.length > 1) {
    const nums = multiNums.map(Number)
    return processes.filter(p =>
      nums.includes(p.pid) || p.ports.some(port => nums.includes(port))
    )
  }

  const lower = kw.toLowerCase()

  const scored = processes.map(p => {
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

  return scored
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.process)
}
