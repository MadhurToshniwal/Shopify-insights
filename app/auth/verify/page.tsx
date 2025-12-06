import { Mail } from 'lucide-react';

export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
        <p className="text-gray-600">
          A sign in link has been sent to your email address. Click the link to sign in.
        </p>
        <p className="text-sm text-gray-500 mt-6">
          The link will expire in 24 hours.
        </p>
      </div>
    </div>
  );
}
