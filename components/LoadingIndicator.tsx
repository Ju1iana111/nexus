
import React from 'react';

export function LoadingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-4">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      <p className="text-amber-300 text-sm">Нексус ткёт нити вашей судьбы...</p>
    </div>
  );
}