import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_JOBS_API_URL;
const NOTIFY_API_BASE_URL = import.meta.env.VITE_NOTIFY_API_URL;

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);

  const jobsEndpoint = useMemo(() => {
    if (!API_BASE_URL) {
      return null;
    }
    return `${API_BASE_URL.replace(/\/$/, "")}/jobs`;
  }, []);

  const notifyEndpoint = useMemo(() => {
    if (!NOTIFY_API_BASE_URL) {
      return null;
    }
    const normalizedBase = NOTIFY_API_BASE_URL.replace(/\/$/, "");
    return normalizedBase.endsWith("/notify")
      ? normalizedBase
      : `${normalizedBase}/notify`;
  }, []);

  const loadJobs = async () => {
    if (!jobsEndpoint) {
      setServiceUnavailable(true);
      setLoading(false);
      return;
    }

    try {
      setServiceUnavailable(false);
      setLoading(true);
      const response = await fetch(jobsEndpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      setServiceUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async (event) => {
    event.preventDefault();
    if (!jobsEndpoint) {
      setServiceUnavailable(true);
      return;
    }

    try {
      setServiceUnavailable(false);
      setIsSubmitting(true);
      const response = await fetch(jobsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const createdJob = await response.json();
      if (notifyEndpoint) {
        const notifyResponse = await fetch(notifyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `New job created: ${createdJob.title}`,
            job_id: createdJob.id,
          }),
        });
        if (!notifyResponse.ok) {
          throw new Error("Failed to send notification");
        }
      }

      setTitle("");
      setDescription("");
      await loadJobs();
    } catch (error) {
      setServiceUnavailable(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!jobsEndpoint) {
      setServiceUnavailable(true);
      return;
    }

    try {
      setServiceUnavailable(false);
      setDeletingJobId(jobId);
      const response = await fetch(`${jobsEndpoint}/${jobId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete job");
      }
      await loadJobs();
    } catch (error) {
      setServiceUnavailable(true);
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>ShopFloor — Admin Dashboard</h1>
      </header>

      {serviceUnavailable && <p className="error">Service unavailable</p>}

      <main>
        <section>
          <h2>Create New Job</h2>
          <form onSubmit={handleCreateJob}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Job"}
            </button>
          </form>
        </section>

        <section>
          <h2>Jobs</h2>
          {loading ? (
            <p>Loading jobs...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="4">No jobs available</td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.title}</td>
                      <td>{job.description}</td>
                      <td>{job.status}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={deletingJobId === job.id}
                        >
                          {deletingJobId === job.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>

      <footer>
        <p>admin.shopfloor.local</p>
      </footer>
    </div>
  );
}

export default App;
