import { useEffect, useState } from "react";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import PasskeyModal from "./components/PasskeyModal";
import VideoGrid from "./components/VideoGrid";
import VideoFormModal from "./components/VideoFormModal";
import ConfirmDialog from "./components/ConfirmDialog";

// Cards without a video number (e.g. added before this field existed) sort last.
function byVideoNumberDesc(a, b) {
  const an = Number.isFinite(a.videoNumber) ? a.videoNumber : -Infinity;
  const bn = Number.isFinite(b.videoNumber) ? b.videoNumber : -Infinity;
  return bn - an;
}

function AppContent() {
  const { lock, openPasskeyModal } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', video? }
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.getVideos();
      setVideos(data);
    } catch (err) {
      setLoadError(err.message || "Could not load videos.");
    } finally {
      setLoading(false);
    }
  }

  // If a protected action's session has expired, lock and prompt again.
  function handleAuthExpiry(err) {
    if (err.status === 401) {
      lock();
      openPasskeyModal();
    }
    throw err;
  }

  async function handleFormSubmit(formData) {
    try {
      if (formModal.mode === "edit") {
        const updated = await api.updateVideo(formModal.video._id, formData);
        setVideos((prev) =>
          prev.map((v) => (v._id === updated._id ? updated : v)).sort(byVideoNumberDesc)
        );
      } else {
        const created = await api.createVideo(formData);
        setVideos((prev) => [created, ...prev].sort(byVideoNumberDesc));
      }
      setFormModal(null);
    } catch (err) {
      handleAuthExpiry(err);
    }
  }

  async function handleDelete() {
    try {
      await api.deleteVideo(deleteTarget._id);
      setVideos((prev) => prev.filter((v) => v._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      handleAuthExpiry(err);
    }
  }

  async function handleTogglePaid(video) {
    const previous = videos;
    setVideos((prev) => prev.map((v) => (v._id === video._id ? { ...v, paid: !v.paid } : v)));
    try {
      const updated = await api.togglePaid(video._id, !video.paid);
      setVideos((prev) => prev.map((v) => (v._id === updated._id ? updated : v)));
    } catch (err) {
      setVideos(previous);
      try {
        handleAuthExpiry(err);
      } catch {
        // already surfaced via passkey modal
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-blue" />
            <p className="text-sm text-gray-500">Loading videos...</p>
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {!loading && !loadError && (
          <VideoGrid
            videos={videos}
            onAdd={() => setFormModal({ mode: "create" })}
            onEdit={(video) => setFormModal({ mode: "edit", video })}
            onDelete={(video) => setDeleteTarget(video)}
            onTogglePaid={handleTogglePaid}
          />
        )}
      </main>

      <PasskeyModal />

      {formModal && (
        <VideoFormModal
          video={formModal.video}
          suggestedNumber={
            formModal.mode === "create"
              ? Math.max(0, ...videos.map((v) => v.videoNumber).filter(Number.isFinite)) + 1
              : undefined
          }
          onClose={() => setFormModal(null)}
          onSubmit={handleFormSubmit}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete video"
          message="Remove this video and its thumbnail? This can't be undone."
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
