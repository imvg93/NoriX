import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    
    console.log('Fetching job details for ID:', jobId);
    console.log('API URL:', `${API_BASE_URL}/jobs/${jobId}`);
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Call the specific job endpoint directly
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Backend error response:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }
      
      // Handle validation errors (like application deadline issues) by fetching from jobs list
      if (response.status === 400) {
        console.log('Backend validation error, trying to fetch from jobs list...');
        try {
          const jobsResponse = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            const jobs = jobsData.jobs || [];
            const job = jobs.find((j: any) => j._id === jobId);
            
            if (job) {
              console.log('Found job in jobs list, mapping data...');
              const jobData = {
                _id: job._id,
                title: job.jobTitle || job.title,
                description: job.description,
                company: job.companyName || job.company,
                location: job.location,
                salary: job.salaryRange || job.salary,
                type: job.workType || job.type,
                requirements: job.skillsRequired || job.requirements || [],
                createdAt: job.createdAt,
                employer: job.employerId?._id || job.employer,
                highlighted: job.highlighted || false,
                status: job.status,
                applicationDeadline: job.applicationDeadline,
                employerDetails: job.employerId
              };
              return NextResponse.json(jobData);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
        }
      }
      
      // If we get here, return a proper error response instead of throwing
      return NextResponse.json(
        { error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const job = await response.json();
    console.log('Backend job data:', job);
    
    // Handle the backend response format
    if (job.success === false) {
      return NextResponse.json(
        { error: job.message || 'Failed to fetch job details' },
        { status: 500 }
      );
    }
    
    // Map the job data to match frontend expectations
    const jobData = {
      _id: job._id,
      title: job.jobTitle || job.title,
      description: job.description,
      company: job.companyName || job.company,
      location: job.location,
      salary: job.salaryRange || job.salary,
      type: job.workType || job.type,
      requirements: job.skillsRequired || job.requirements || [],
      createdAt: job.createdAt,
      employer: job.employerId?._id || job.employer,
      highlighted: job.highlighted || false,
      status: job.status,
      applicationDeadline: job.applicationDeadline,
      employerDetails: job.employerId
    };
    
    return NextResponse.json(jobData);
    
  } catch (error) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}
