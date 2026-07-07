import { useState, useRef, useEffect, useCallback } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import './index.css'
import { searchProcesses } from './search'
import { useProcessData } from './useProcessData'

const CACHE_TTL = 5000

interface Props {
  keyword: string
}

export default function ProcessManager({ keyword }: Props) {
  const { processes, loading, refresh, lastUpdated } = useProcessData()
  const [toast, setToast] = useState('')
  const [killPid, setKillPid] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const startRef = useRef(0)
  const rafRef = useRef(0)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const fill = barRef.current
    if (!fill) return
    const tick = () => {
      const pct = Math.min((Date.now() - startRef.current) / CACHE_TTL * 100, 100)
      fill.style.width = pct + '%'
      rafRef.current = requestAnimationFrame(tick)
    }
    startRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    startRef.current = Date.now()
  }, [lastUpdated])

  const showToast = useCallback((msg: string, isError = false) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), isError ? 3000 : 1500)
  }, [])

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast('已复制: ' + text))
  }, [showToast])

  const executeKill = useCallback(async (pid: number, name: string) => {
    setKillPid(pid)
    const result = await window.services.killProcess(pid)
    setKillPid(null)

    if (result.success) {
      showToast(`已 Kill ${name} (PID: ${pid})`)
      refresh()
    } else {
      showToast(`Kill 失败: ${result.error}`, true)
    }
  }, [showToast, refresh])

  const handleContextMenu = useCallback((e: React.MouseEvent, pid: number, name: string) => {
    e.preventDefault()
    executeKill(pid, name)
  }, [executeKill])

  const filtered = searchProcesses(keyword, processes)

  return (
    <div className="pm">
      <div className="pm-header">
        <div className="pm-hints">
          <span className="pm-hint pm-hint-name">进程名</span>
          <span className="pm-hint pm-hint-pid">PID</span>
          <span className="pm-hint pm-hint-port">端口号</span>
          <span className="pm-hint pm-hint-path">文件路径</span>
        </div>
        {toast && <div className="pm-notify">{toast}</div>}
      </div>

      <div className="pm-body">
        {loading && processes.length === 0 && (
          <div className="pm-empty">正在获取进程列表...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="pm-empty">
            {keyword ? '没有匹配的进程' : '暂无进程数据，请刷新'}
          </div>
        )}

        {filtered.map(p => (
          <div
            className="pm-item"
            key={p.pid}
            onContextMenu={(e) => handleContextMenu(e, p.pid, p.name)}
          >
            <div className="pm-item-top">
              <div className="pm-item-info">
                <div className="pm-item-row1">
                  <span className="pm-tag pm-tag-name" onClick={() => copy(p.name)}>{p.name}</span>
                  <span className="pm-tag pm-tag-pid" onClick={() => copy(String(p.pid))}>{p.pid}</span>
                  <span className="pm-path" onClick={() => copy(p.path)} title={p.path}>{p.path}</span>
                </div>
                <div className="pm-tags">
                  {p.ports.length > 0
                    ? p.ports.map(port => (
                        <span key={port} className="pm-tag pm-tag-port" onClick={() => copy(String(port))}>{port}</span>
                      ))
                    : <span className="pm-tag pm-tag-none">无端口占用</span>
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pm-footer">
        <span>共 {filtered.length} 个结果</span>
        <span className="pm-footer-right">
          <span className="pm-updated">{lastUpdated || '--:--:--'}</span>
          <span className="pm-progress-tag"><span className="pm-progress-fill" ref={barRef} /></span>
          <button className="pm-refresh" onClick={refresh}>
            <FiRefreshCw size={13} />
          </button>
        </span>
      </div>
    </div>
  )
}
