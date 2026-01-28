import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PointsDisplay from '../../rewards/PointsDisplay/PointsDisplay';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800 safe-area-inset-top">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-semibold text-dark-100">Metacognizer</span>
        </Link>

        <div className="flex items-center gap-3">
          <PointsDisplay compact />
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
