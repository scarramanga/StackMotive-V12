import React from 'react';

const WelcomeStep: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px]">
    <div className="mb-6">
      <img src="/logo.svg" alt="StackMotive Logo" className="h-16 w-16 mx-auto mb-2" />
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Welcome to StackMotive</h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg">AI-augmented portfolio intelligence for the next generation.</p>
    </div>
    <button
      className="mt-8 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-lg shadow hover:bg-indigo-700 transition"
      onClick={onNext}
    >
      Let&apos;s Begin
    </button>
  </div>
);

export default WelcomeStep; 