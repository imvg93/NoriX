export interface EmployerDashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingApplications: number;
  approvedJobs: number;
}

const ensureObject = (value: any) =>
  value && typeof value === 'object' ? { ...value } : value ? { _id: value } : {};

export const normalizeEmployerJob = (job: any) => {
  if (!job) return null;

  const jobWrapper = typeof job === 'object' ? { ...job } : { jobId: job };
  const nestedJob = ensureObject(jobWrapper.job) as Record<string, any>;
  const innerJobId = nestedJob?._id || nestedJob?.id;

  const jobId =
    innerJobId ||
    (typeof jobWrapper.jobId === 'string' ? jobWrapper.jobId : jobWrapper.jobId?._id) ||
    jobWrapper._id ||
    jobWrapper.id ||
    '';

  const jobTitle =
    nestedJob.jobTitle ||
    nestedJob.title ||
    jobWrapper.jobTitle ||
    jobWrapper.title ||
    'Untitled Role';

  const companyName =
    nestedJob.companyName ||
    jobWrapper.companyName ||
    nestedJob.company ||
    jobWrapper.company ||
    '';

  const location =
    nestedJob.location ||
    jobWrapper.location ||
    nestedJob.jobLocation ||
    jobWrapper.jobLocation ||
    '';

  const rawStatus = (jobWrapper.status || nestedJob.status || '').toString().toLowerCase();
  const rawApproval = (jobWrapper.approvalStatus || nestedJob.approvalStatus || '').toString().toLowerCase();

  const status = rawStatus || (rawApproval === 'approved' ? 'active' : rawApproval || 'pending');
  const approvalStatus = rawApproval || status;

  const applicantsArray =
    Array.isArray(jobWrapper.applicants)
      ? jobWrapper.applicants
      : Array.isArray(jobWrapper.applications)
      ? jobWrapper.applications
      : Array.isArray(nestedJob.applicants)
      ? nestedJob.applicants
      : [];

  const applicationsCount =
    typeof jobWrapper.applicationsCount === 'number'
      ? jobWrapper.applicationsCount
      : typeof nestedJob.applicationsCount === 'number'
      ? nestedJob.applicationsCount
      : applicantsArray.length;

  const salaryRange =
    nestedJob.salaryRange ||
    jobWrapper.salaryRange ||
    nestedJob.salary ||
    jobWrapper.salary ||
    nestedJob.payRange ||
    jobWrapper.payRange ||
    '';

  const salary = nestedJob.salary || jobWrapper.salary || salaryRange;

  const createdAt =
    jobWrapper.createdAt ||
    nestedJob.createdAt ||
    jobWrapper.postedAt ||
    nestedJob.postedAt ||
    new Date().toISOString();

  return {
    ...nestedJob,
    ...jobWrapper,
    _id: jobId,
    jobId,
    jobTitle,
    title: nestedJob.title || jobWrapper.title || jobTitle,
    companyName,
    company: companyName || jobWrapper.company || nestedJob.company || '',
    location,
    status,
    approvalStatus,
    applicationsCount,
    salaryRange,
    salary,
    createdAt,
    applicants: applicantsArray,
  };
};

export const normalizeEmployerApplication = (application: any) => {
  if (!application) return null;

  const wrapper = typeof application === 'object' ? { ...application } : { _id: application };
  const normalizedJob = normalizeEmployerJob(wrapper.job || wrapper.jobId) || ensureObject(wrapper.jobId);
  const student = ensureObject(wrapper.student || wrapper.studentId);

  const status = (wrapper.status || wrapper.applicationStatus || 'pending').toString().toLowerCase();
  const appliedAt =
    wrapper.appliedAt || wrapper.appliedDate || wrapper.createdAt || new Date().toISOString();

  return {
    ...wrapper,
    job: normalizedJob,
    jobId: normalizedJob?._id || normalizedJob?.jobId || wrapper.jobId || wrapper.job?._id || '',
    student,
    studentId: student,
    status,
    appliedAt,
  };
};

export const calculateEmployerDashboardStats = (
  jobsList: any[],
  applicationsList: any[],
): EmployerDashboardStats => {
  const safeJobs = Array.isArray(jobsList) ? jobsList : [];
  const safeApplications = Array.isArray(applicationsList) ? applicationsList : [];

  const totalJobs = safeJobs.length;
  const activeJobs = safeJobs.filter((job) => (job?.status || '').toLowerCase() === 'active').length;
  const approvedJobs = safeJobs.filter((job) => (job?.approvalStatus || '').toLowerCase() === 'approved').length;

  const totalApplications =
    safeApplications.length > 0
      ? safeApplications.length
      : safeJobs.reduce((sum: number, job: any) => sum + (Number(job?.applicationsCount) || 0), 0);

  const pendingApplications = safeApplications.filter((app) => {
    const status = (app?.status || '').toLowerCase();
    return status === 'applied' || status === 'pending';
  }).length;

  return {
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications,
    approvedJobs,
  };
};


