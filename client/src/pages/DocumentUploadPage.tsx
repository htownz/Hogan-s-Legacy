import DocumentUpload from "@/components/document/DocumentUpload";

export default function DocumentUploadPage() {
  return (
    <div className="container max-w-6xl py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Upload Document</h1>
      <DocumentUpload />
    </div>
  );
}