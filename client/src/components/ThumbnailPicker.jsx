import { useRef, useState } from "react";

export default function ThumbnailPicker({ previewUrl, onFileSelected }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    onFileSelected(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        handleFile(item.getAsFile());
        e.preventDefault();
        return;
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex justify-center">
      <div
        role="button"
        tabIndex={0}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex aspect-[9/16] w-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          isDragging ? "border-brand-blue bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
        ) : (
          <div className="px-4 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-600">Click to paste or upload a thumbnail</p>
            <p className="mt-1 text-xs text-gray-400">Copy an image, click here, then press Ctrl/Cmd+V</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
