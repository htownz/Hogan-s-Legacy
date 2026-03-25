import { CollaborativeAmendmentPlayground } from "@/components/CollaborativeAmendmentPlayground";

export default function AmendmentPlaygroundPage() {
  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
    }}>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/50 to-blue-900/50"></div>
        <div className="relative container mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Amendment Playground
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Collaborate with the community to improve Texas legislation through intelligent amendment suggestions, 
            real-time collaboration, and AI-powered insights.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <CollaborativeAmendmentPlayground />
      </div>
    </div>
  );
}