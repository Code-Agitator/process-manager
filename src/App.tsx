import { useEffect, useState } from 'react'
import ProcessManager from './ProcessManager'

export default function App() {
  const [route, setRoute] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    window.ztools.onPluginEnter((action) => {
      setRoute(action.code)
      if (action.code === 'process') {
        setKeyword('')
        window.ztools.setSubInput(
          (input) => setKeyword(input.text),
          '输入 PID / 端口 / 进程名 / 路径搜索...'
        )
      }
    })
    window.ztools.onPluginOut(() => {
      setRoute('')
      setKeyword('')
      window.ztools.removeSubInput()
    })
  }, [])

  if (route === 'process') return <ProcessManager keyword={keyword} />

  return null
}
