import axios from 'axios';
const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
export async function fetchRemotiveJobs(query = {}) {
    const params = {};
    if (query.search)
        params.search = query.search;
    if (query.location)
        params.location = query.location;
    if (query.job_type)
        params.job_type = query.job_type;
    const response = await axios.get(REMOTIVE_API_URL, { params });
    if (response.data && Array.isArray(response.data.jobs)) {
        return response.data.jobs;
    }
    return [];
}
