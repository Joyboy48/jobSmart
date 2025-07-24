import axios from 'axios';

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

export interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
  tags: string[];
}

export interface RemotiveQuery {
  search?: string; // job title or keywords
  location?: string;
  job_type?: string; // e.g., 'full_time', 'part_time', 'contract', etc.
}

export async function fetchRemotiveJobs(query: RemotiveQuery = {}): Promise<RemotiveJob[]> {
  const params: any = {};
  if (query.search) params.search = query.search;
  if (query.location) params.location = query.location;
  if (query.job_type) params.job_type = query.job_type;

  const response = await axios.get(REMOTIVE_API_URL, { params });
  if (response.data && Array.isArray(response.data.jobs)) {
    return response.data.jobs;
  }
  return [];
} 