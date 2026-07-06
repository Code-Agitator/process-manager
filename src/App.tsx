import { useEffect, useState } from 'react'
import ProcessManager from './ProcessManager'

export default function App() {
  const [route, setRoute] = useState('')

  useEffect(() => {
    window.ztools.onPluginEnter((action) => {
      setRoute(action.code)
    })
    window.ztools.onPluginOut(() => {
      setRoute('')
    })
  }, [])

  if (route === 'process') return <ProcessManager />

  return null
}
