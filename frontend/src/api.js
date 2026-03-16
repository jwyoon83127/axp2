const BASE = '/api'

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`)
  return res.json()
}

// Teams
export const getTeams       = ()           => req('GET',   '/teams')
export const updateTeam     = (id, body)   => req('PATCH', `/teams/${id}`, body)

// Timeline
export const getTimeline    = ()                         => req('GET',    '/timeline')
export const addWeek        = (body)                     => req('POST',   '/timeline/weeks', body)
export const updateWeek     = (wid, body)                => req('PATCH',  `/timeline/weeks/${wid}`, body)
export const deleteWeek     = (wid)                      => req('DELETE', `/timeline/weeks/${wid}`)
export const addDay         = (wid, body)                => req('POST',   `/timeline/weeks/${wid}/days`, body)
export const deleteDay      = (wid, did)                 => req('DELETE', `/timeline/weeks/${wid}/days/${did}`)
export const addTimelineTask     = (wid, did, body)      => req('POST',   `/timeline/weeks/${wid}/days/${did}/tasks`, body)
export const updateTimelineTask  = (wid, did, tid, body) => req('PATCH',  `/timeline/weeks/${wid}/days/${did}/tasks/${tid}`, body)
export const deleteTimelineTask  = (wid, did, tid)       => req('DELETE', `/timeline/weeks/${wid}/days/${did}/tasks/${tid}`)

// Daily checks
export const getDailyChecks    = ()       => req('GET',    '/daily-checks')
export const createDailyCheck  = (body)   => req('POST',   '/daily-checks', body)
export const deleteDailyCheck  = (id)     => req('DELETE', `/daily-checks/${id}`)

// Auto tasks
export const getAutoTasks    = ()         => req('GET',    '/auto-tasks')
export const createAutoTask  = (body)     => req('POST',   '/auto-tasks', body)
export const updateAutoTask  = (id, body) => req('PATCH',  `/auto-tasks/${id}`, body)
export const deleteAutoTask  = (id)       => req('DELETE', `/auto-tasks/${id}`)
