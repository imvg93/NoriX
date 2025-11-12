import React from 'react';

interface Step {
  title: string;
  subtitle?: string;
  completed?: boolean;
  current?: boolean;
}

export interface VerificationStepperProps {
  steps: Step[];
}

export default function VerificationStepper({ steps }: VerificationStepperProps) {
  const total = steps.length;
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / total) * 100);

  return (
    <div className="w-full">
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          role="progressbar"
        />
      </div>
      <ol className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className={`p-3 rounded-lg ${
              step.current ? 'bg-indigo-50' : step.completed ? 'bg-green-50' : 'bg-gray-50'
            }`}
            aria-current={step.current ? 'step' : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    step.completed ? 'bg-green-600 text-white' : step.current ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-gray-900">{step.title}</span>
              </div>
              {step.completed && <span className="text-xs text-green-700">Done</span>}
            </div>
            {step.subtitle && <p className="mt-1 text-xs text-gray-600">{step.subtitle}</p>}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-gray-600">Progress: {progress}%</p>
    </div>
  );
}


