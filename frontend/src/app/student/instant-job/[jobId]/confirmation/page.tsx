"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader } from "lucide-react";

const JobConfirmationPage = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.jobId as string;

  useEffect(() => {
    if (jobId) {
      router.replace(`/student/instant-job/${jobId}/manage`);
    } else {
      router.replace("/student/instant-job");
    }
  }, [jobId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-2">
        <Loader className="w-6 h-6 text-[#2A8A8C] animate-spin mx-auto" />
        <p className="text-gray-700 text-sm">Redirecting to your instant job…</p>
        {jobId && <p className="text-xs text-gray-400">Job ID: {jobId}</p>}
      </div>
    </div>
  );
};

export default JobConfirmationPage;



