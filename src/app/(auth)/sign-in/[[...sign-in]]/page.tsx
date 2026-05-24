import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-neutral-900 tracking-tight">
            <span className="bg-red-600 text-neutral-900 dark:text-neutral-950 px-3 py-1 rounded-md text-xl font-extrabold uppercase">Mind</span>
            <span className="text-red-800">Orbit</span>
          </Link>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Securely access your mental health platform
          </p>
        </div>
        
        <div className="w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-neutral-100 p-2 flex justify-center">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 'bg-red-600 hover:bg-red-700 text-white transition-colors text-sm normal-case',
                card: 'shadow-none border-0',
                headerTitle: 'text-neutral-900 font-bold',
                headerSubtitle: 'text-neutral-600',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
