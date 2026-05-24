import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-100 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 text-base font-bold tracking-tight text-neutral-950 dark:text-white group">
              <span className="w-5 h-5 rounded-full bg-red-600 text-neutral-900 dark:text-neutral-950 flex items-center justify-center text-[8px] font-extrabold tracking-widest shadow-sm">
                M
              </span>
              <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Mind<span className="text-red-800 font-normal">Orbit</span>
              </span>
            </Link>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Modern mental health consultation and psychiatrist discovery platform. Secure, private, and professional.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Discovery</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link href="/psychiatrists" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Find Psychiatrists
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <Link href="/contact" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <a href="mailto:support@mindorbit.com" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  support@mindorbit.com
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>
                <a href="#" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">GDPR Compliance</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-8 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          <p>© {new Date().getFullYear()} MindOrbit. All rights reserved. Developed with premium medical care standards.</p>
        </div>
      </div>
    </footer>
  );
}
