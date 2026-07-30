import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { unlocked, lock, openPasskeyModal } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
      <div className="h-1 w-full bg-gradient-to-r from-brand-green via-brand-blue to-brand-orange" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Client logo"
            className="h-11 w-11 rounded-xl object-cover shadow-md ring-2 ring-white sm:h-12 sm:w-12"
          />
          <div>
            <h1 className="brand-gradient-text text-lg font-extrabold tracking-tight sm:text-xl">
              Video Tracker
            </h1>
            <p className="hidden text-xs text-gray-500 sm:block">Thumbnails, Drive links &amp; payment status</p>
          </div>
        </div>

        {unlocked ? (
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-200 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Unlocked
            </span>
            <button
              onClick={lock}
              className="rounded-full border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 active:scale-95"
            >
              Lock
            </button>
          </div>
        ) : (
          <button
            onClick={openPasskeyModal}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-light px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path strokeLinecap="round" d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
            Unlock to edit
          </button>
        )}
      </div>
    </header>
  );
}
