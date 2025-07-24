import { User } from "../models/user.models.js";
import { fetchRemotiveJobs } from "../utils/remotive.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// Helper: score a job for a user
function scoreJob(job, userSkills, jobPreferences, userLocation) {
    let score = 0;
    // Title match
    if (jobPreferences.some(pref => job.title.toLowerCase().includes(pref.toLowerCase())))
        score += 30;
    // Skill match (tags or description)
    const jobText = (job.tags.join(" ") + " " + job.description).toLowerCase();
    const skillMatches = userSkills.filter(skill => jobText.includes(skill.toLowerCase()));
    score += Math.min(skillMatches.length * 10, 30); // up to 30 points for skills
    // Location match
    if (userLocation && job.candidate_required_location && job.candidate_required_location.toLowerCase().includes(userLocation.toLowerCase()))
        score += 20;
    // Remote jobs get a bonus if user has no location
    if (!userLocation && job.candidate_required_location.toLowerCase().includes("anywhere"))
        score += 10;
    // Job type match (future: if user provides)
    return score;
}
export const getJobRecommendations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user)
        throw new apiError(404, "User not found");
    // Accept skills, jobPreferences, location from query (GET) or body (POST)
    const inputSkills = req.body.skills || req.query.skills;
    const inputJobPreferences = req.body.jobPreferences || req.query.jobPreferences;
    const inputLocation = req.body.location || req.query.location;
    // Normalize input (handle string or array)
    const userSkills = Array.isArray(inputSkills)
        ? inputSkills
        : (typeof inputSkills === 'string' ? inputSkills.split(',').map(s => s.trim()).filter(Boolean) : user.skills || []);
    const jobPreferences = Array.isArray(inputJobPreferences)
        ? inputJobPreferences
        : (typeof inputJobPreferences === 'string' ? inputJobPreferences.split(',').map(s => s.trim()).filter(Boolean) : user.jobPreferences || []);
    const userLocation = inputLocation || user.location || undefined;
    // Fetch jobs for all jobPreferences, merge and deduplicate
    let allJobs = [];
    const seenJobIds = new Set();
    for (const pref of jobPreferences.length ? jobPreferences : [""]) {
        const remotiveQuery = {};
        if (pref)
            remotiveQuery.search = pref;
        if (userLocation)
            remotiveQuery.location = userLocation;
        const jobs = await fetchRemotiveJobs(remotiveQuery);
        for (const job of jobs) {
            if (!seenJobIds.has(job.id)) {
                allJobs.push(job);
                seenJobIds.add(job.id);
            }
        }
    }
    // Stricter filtering: only include jobs that match location and at least one skill (if provided)
    allJobs = allJobs.filter(job => {
        // Location filter
        const locationMatch = !userLocation || (job.candidate_required_location && job.candidate_required_location.toLowerCase().includes(userLocation.toLowerCase()));
        // Skill filter
        const skillMatch = !userSkills.length || userSkills.some(skill => {
            const jobText = (job.tags.join(" ") + " " + job.description).toLowerCase();
            return jobText.includes(skill.toLowerCase());
        });
        return locationMatch && skillMatch;
    });
    // Score and sort jobs
    const scoredJobs = allJobs.map(job => ({ job, score: scoreJob(job, userSkills, jobPreferences, userLocation) }));
    scoredJobs.sort((a, b) => b.score - a.score);
    // Return top 20 jobs
    res.status(200).json(new apiResponse(200, scoredJobs.slice(0, 20).map(j => j.job), "Job recommendations fetched"));
});
