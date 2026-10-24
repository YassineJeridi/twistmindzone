import { useEffect, useState } from "react";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import PasskeyModal from "./components/PasskeyModal";
import VideoGrid from "./components/VideoGrid";
import VideoFormModal from "./components/VideoFormModal";
import PdfGrid from "./components/PdfGrid";
import PdfFormModal from "./components/PdfFormModal";
import ConfirmDialog from "./components/ConfirmDialog";

// Cards without a video number (e.g. added before this field existed) sort last.
function byVideoNumberDesc(a, b) {
  const an = Number.isFinite(a.videoNumber) ? a.videoNumber : -Infinity;
  const bn = Number.isFinite(b.videoNumber) ? b.videoNumber : -Infinity;
  return bn - an;
}

function AppContent() {
  const { lock, openPasskeyModal } = useAuth();
  const [page, setPage] = useState("videos"); // 'videos' | 'pdfs'

  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState("");
  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', video? }
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [pdfs, setPdfs] = useState([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);
  const [pdfsError, setPdfsError] = useState("");
  const [pdfFormModal, setPdfFormModal] = useState(null); // { mode: 'create' | 'edit', pdf? }
  const [pdfDeleteTarget, setPdfDeleteTarget] = useState(null);

  useEffect(() => {
    loadVideos();
    loadPdfs();
  }, []);

  async function loadVideos() {
    setVideosLoading(true);
    setVideosError("");
    try {
      const data = await api.getVideos();
      setVideos(data);
    } catch (err) {
      setVideosError(err.message || "Could not load videos.");
    } finally {
      setVideosLoading(false);
    }
  }

  async function loadPdfs() {
    setPdfsLoading(true);
    setPdfsError("");
    try {
      const data = await api.getPdfs();
      setPdfs(data);
    } catch (err) {
      setPdfsError(err.message || "Could not load PDFs.");
    } finally {
      setPdfsLoading(false);
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

  async function handlePdfFormSubmit(formData) {
    try {
      if (pdfFormModal.mode === "edit") {
        const updated = await api.updatePdf(pdfFormModal.pdf._id, formData);
        setPdfs((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      } else {
        const created = await api.createPdf(formData);
        setPdfs((prev) => [created, ...prev]);
      }
      setPdfFormModal(null);
    } catch (err) {
      handleAuthExpiry(err);
    }
  }

  async function handleTogglePdfPaid(pdf) {
    const previous = pdfs;
    setPdfs((prev) => prev.map((p) => (p._id === pdf._id ? { ...p, paid: !p.paid } : p)));
    try {
      const updated = await api.togglePdfPaid(pdf._id, !pdf.paid);
      setPdfs((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      setPdfs(previous);
      try {
        handleAuthExpiry(err);
      } catch {
        // already surfaced via passkey modal
      }
    }
  }

  async function handlePdfDelete() {
    try {
      await api.deletePdf(pdfDeleteTarget._id);
      setPdfs((prev) => prev.filter((p) => p._id !== pdfDeleteTarget._id));
      setPdfDeleteTarget(null);
    } catch (err) {
      handleAuthExpiry(err);
    }
  }

  return (
    <div className="min-h-screen">
      <Header page={page} onPageChange={setPage} />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {page === "videos" && (
          <>
            {videosLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-blue" />
                <p className="text-sm text-gray-500">Loading videos...</p>
              </div>
            )}

            {!videosLoading && videosError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {videosError}
              </div>
            )}

            {!videosLoading && !videosError && (
              <VideoGrid
                videos={videos}
                onAdd={() => setFormModal({ mode: "create" })}
                onEdit={(video) => setFormModal({ mode: "edit", video })}
                onDelete={(video) => setDeleteTarget(video)}
                onTogglePaid={handleTogglePaid}
              />
            )}
          </>
        )}

        {page === "pdfs" && (
          <>
            {pdfsLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-blue" />
                <p className="text-sm text-gray-500">Loading PDFs...</p>
              </div>
            )}

            {!pdfsLoading && pdfsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {pdfsError}
              </div>
            )}

            {!pdfsLoading && !pdfsError && (
              <PdfGrid
                pdfs={pdfs}
                onAdd={() => setPdfFormModal({ mode: "create" })}
                onEdit={(pdf) => setPdfFormModal({ mode: "edit", pdf })}
                onDelete={(pdf) => setPdfDeleteTarget(pdf)}
                onTogglePaid={handleTogglePdfPaid}
              />
            )}
          </>
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

      {pdfFormModal && (
        <PdfFormModal
          pdf={pdfFormModal.pdf}
          onClose={() => setPdfFormModal(null)}
          onSubmit={handlePdfFormSubmit}
        />
      )}

      {pdfDeleteTarget && (
        <ConfirmDialog
          title="Delete PDF"
          message="Remove this PDF and its image? This can't be undone."
          onConfirm={handlePdfDelete}
          onClose={() => setPdfDeleteTarget(null)}
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
