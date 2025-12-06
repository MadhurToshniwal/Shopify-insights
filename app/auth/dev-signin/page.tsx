'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DevSignIn() {
  const [email, setEmail] = useState('test@example.com');
  const router = useRouter();

  const handleDevSignIn = async () => {
    // In development, we'll create a session directly
    await signIn('email', { 
      email, 
      callbackUrl: '/dashboard',
      redirect: true
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dev Sign In</h1>
        <p className="text-sm text-red-600 mb-4">⚠️ Development Only - No Email Required</p>
        
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4"
          placeholder="Enter any email"
        />
        
        <button
          onClick={handleDevSignIn}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Sign In (Dev Mode)
        </button>

        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-xs text-gray-600">
            This bypasses email verification for development. 
            Access: <a href="/auth/dev-signin" className="text-blue-600">/auth/dev-signin</a>
          </p>
        </div>
      </div>
    </div>
  );
}
