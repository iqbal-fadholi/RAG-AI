import { IngestionDashboard } from "@/components/ingestion/IngestionDashboard";

export default function IngestPage() {
  return (
    <main className="flex-grow p-md md:p-margin-desktop flex flex-col items-center gap-12 w-full max-w-max-width-content mx-auto my-8">
      <header className="w-full text-center mb-4">
        <h1 className="font-headline-lg text-headline-lg mb-2 text-white">Document Ingestion</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Upload and review documents before adding them to your knowledge base.</p>
      </header>
      <IngestionDashboard />
    </main>
  );
}
