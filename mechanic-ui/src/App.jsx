import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["pending", "in-progress", "done"];
const API_BASE_URL = import.meta.env.VITE_JOBS_API_URL;

function App() {
  const [jobs, setJobs] = useState([]);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [updatingJobId, setUpdatingJobId] = useState(null);

  async function loadJobs() {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
      setServiceUnavailable(false);
    } catch (error) {
      setServiceUnavailable(true);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleStatusChange(jobId, nextStatus) {
    setUpdatingJobId(jobId);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await loadJobs();
    } catch (error) {
      setServiceUnavailable(true);
    } finally {
      setUpdatingJobId(null);
    }
  }

  return (
    <div className="page">
      <header>
        <h1>ShopFloor — Mechanic View</h1>
      </header>

      <main>
        {serviceUnavailable ? (
          <p className="error">Service unavailable</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.status}</td>
                  <td>
                    <select
                      value={job.status}
                      onChange={(event) =>
                        handleStatusChange(job.id, event.target.value)
                      }
                      disabled={updatingJobId === job.id}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      <footer>mechanic.shopfloor.local</footer>
    </div>
  );
}

export default App;
