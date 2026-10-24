import { useAuth } from "../context/AuthContext";
import PdfCard from "./PdfCard";

export default function PdfGrid({ pdfs, onAdd, onEdit, onDelete, onTogglePaid }) {
  const { unlocked, openPasskeyModal } = useAuth();

  const handleAddClick = () => {
    if (!unlocked) {
      openPasskeyModal();
      return;
    }
    onAdd();
  };

  if (pdfs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/70 px-6 py-20 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green via-brand-blue to-brand-orange shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold text-gray-800">No PDFs yet</p>
        <p className="mt-1 text-sm text-gray-500">
          {unlocked ? "Add your first PDF to get started." : "Unlock with the passkey to add your first PDF."}
        </p>
        <button
          onClick={handleAddClick}
          className="mt-5 rounded-full bg-gradient-to-r from-brand-orange to-brand-orange-light px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition hover:shadow-lg hover:shadow-orange-500/30 active:scale-95"
        >
          + Add PDF
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <button
        onClick={handleAddClick}
        className="group flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 text-brand-orange transition hover:border-brand-orange hover:bg-orange-50 active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-2xl font-light leading-none shadow-sm transition group-hover:scale-110 group-hover:shadow-md">
          +
        </span>
        <span className="text-sm font-semibold">Add PDF</span>
      </button>

      {pdfs.map((pdf) => (
        <PdfCard
          key={pdf._id}
          pdf={pdf}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePaid={onTogglePaid}
        />
      ))}
    </div>
  );
}
