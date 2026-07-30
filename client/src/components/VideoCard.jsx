import { useAuth } from "../context/AuthContext";

export default function VideoCard({ video, onEdit, onDelete, onTogglePaid }) {
  const { unlocked, openPasskeyModal } = useAuth();

  const guard = (action) => () => {
    if (!unlocked) {
      openPasskeyModal();
      return;
    }
    action();
  };

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border-4 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl ${
        video.paid
          ? "border-brand-green shadow-green-500/10 hover:shadow-green-500/20"
          : "border-gray-200 hover:border-gray-300 hover:shadow-blue-500/10"
      }`}
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-100">
        <img
          src={video.thumbnailUrl}
          alt="Video thumbnail"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        {video.paid && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-green px-2.5 py-1 text-xs font-semibold text-white shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Paid
          </span>
        )}

        {Number.isFinite(video.videoNumber) && (
          <span className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-light px-2.5 py-1 text-xs font-bold text-white shadow">
            #{video.videoNumber}
          </span>
        )}

        {unlocked && (
          <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
            <button
              onClick={() => onEdit(video)}
              aria-label="Edit video"
              className="rounded-full bg-white/90 p-2 text-brand-blue shadow hover:bg-white active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.06 2.06 0 1 1 2.915 2.914L8.5 18.677l-4 1 1-4L16.862 4.487Z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(video)}
              aria-label="Delete video"
              className="rounded-full bg-white/90 p-2 text-red-600 shadow hover:bg-white active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2m-8 0 .6 12.1a2 2 0 0 0 2 1.9h5.8a2 2 0 0 0 2-1.9L18.5 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        <a
          href={video.driveLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-sm font-medium text-brand-blue transition hover:border-blue-200 hover:bg-blue-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5 17 3l4 4-3.5 3.5M8.5 17.5 5 21l-4-4 3.5-3.5M14.5 9.5 9.5 14.5m-5-11 5.5 5.5m9 9-5.5-5.5" />
          </svg>
          Open in Drive
        </a>

        <button
          onClick={guard(() => onTogglePaid(video))}
          className={`flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 ${
            video.paid
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-brand-orange"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-4-9.5c0-1.38 1.79-2.5 4-2.5s4 1.12 4 2.5-1.79 2.5-4 2.5-4 1.12-4 2.5 1.79 2.5 4 2.5 4-1.12 4-2.5" />
          </svg>
          {video.paid ? "Marked as paid" : "Mark as paid"}
        </button>
      </div>
    </div>
  );
}
