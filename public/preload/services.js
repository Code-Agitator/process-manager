const { exec } = require('node:child_process')

function execAsync(cmd, timeout) {
  return new Promise((resolve) => {
    exec(cmd, { encoding: 'utf-8', timeout }, (err, stdout) => {
      resolve(err ? '' : stdout)
    })
  })
}

function parseWmicCsv(output) {
  const lines = output.trim().split('\n')
  if (lines.length < 2) return []
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const nameIdx = header.indexOf('name')
  const pidIdx = header.indexOf('processid')
  const pathIdx = header.indexOf('executablepath')
  if (nameIdx === -1 || pidIdx === -1) return []

  return lines.slice(1).map(line => {
    const parts = line.startsWith('"')
      ? line.replace(/^"|"$/g, '').split('","')
      : line.split(',')
    return {
      name: (parts[nameIdx] || '').trim(),
      pid: parseInt(parts[pidIdx], 10) || 0,
      path: (parts[pathIdx] || '').trim()
    }
  }).filter(p => p && p.pid > 0)
}

function parseNetstat(output) {
  const lines = output.trim().split('\n')
  const ports = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 5) continue
    const addr = parts[1]
    const pid = parseInt(parts[4], 10)
    if (!addr || isNaN(pid)) continue
    const portMatch = addr.match(/:(\d+)$/)
    if (portMatch) {
      ports.push({ port: parseInt(portMatch[1], 10), pid, protocol: parts[0] })
    }
  }
  return ports
}

window.services = {
  async listProcesses() {
    let raw = await execAsync('wmic process get ProcessId,Name,ExecutablePath /FORMAT:CSV', 8000)
    if (raw) return parseWmicCsv(raw)
    raw = await execAsync('tasklist /FO CSV /NH', 5000)
    if (!raw) return []
    const lines = raw.trim().split('\n')
    return lines.map(line => {
      const parts = line.replace(/^"|"$/g, '').split('","')
      return { name: parts[0] || '', pid: parseInt(parts[1], 10) || 0, path: '' }
    }).filter(p => p.pid > 0)
  },

  async scanPorts() {
    const raw = await execAsync('netstat -ano', 5000)
    return raw ? parseNetstat(raw) : []
  },

  async killProcess(pid) {
    return new Promise((resolve) => {
      exec(`taskkill /PID ${pid} /F`, { encoding: 'utf-8', timeout: 3000 }, (err) => {
        if (err) {
          const msg = err.stderr || err.message || '未知错误'
          resolve({ success: false, error: msg.trim() })
        } else {
          resolve({ success: true })
        }
      })
    })
  }
}
