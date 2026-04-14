import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [jobs, setJobs] = useState([])
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const jobsApiBaseUrl = import.meta.env.VITE_JOBS_API_URL

    const fetchJobs = async () => {
      try {
        const response = await fetch(`${jobsApiBaseUrl}/jobs`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }

        const payload = await response.json()
        const jobsData = Array.isArray(payload) ? payload : []
        setJobs(jobsData)
        setIsError(false)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setIsError(true)
        }
      }
    }

    fetchJobs()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="app">
      <header>
        <h1>ShopFloor — Customer Portal</h1>
      </header>

      <main>
        {isError ? (
          <p>Service unavailable</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={job.id ?? `${job.title ?? 'job'}-${index}`}>
                  <td>{job.title ?? '-'}</td>
                  <td>{job.description ?? '-'}</td>
                  <td>{job.status ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer>customer.shopfloor.local</footer>
    </div>
  )
}

export default App
