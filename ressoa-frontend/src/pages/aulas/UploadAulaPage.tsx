import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadAudioTab } from './components/UploadAudioTab';
import { UploadTranscriptionTab } from './components/UploadTranscriptionTab';
import { ManualEntryTab } from './components/ManualEntryTab';

export default function UploadAulaPage() {
  return (
    <div className="min-h-screen bg-ghost-white">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-deep-navy mb-6">Nova Aula</h1>

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 gap-2">
          <TabsTrigger value="audio">🎵 Upload de Áudio</TabsTrigger>
          <TabsTrigger value="transcription">📝 Colar Transcrição</TabsTrigger>
          <TabsTrigger value="manual">✍️ Resumo Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="mt-6">
          <UploadAudioTab />
        </TabsContent>

        <TabsContent value="transcription" className="mt-6">
          <UploadTranscriptionTab />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <ManualEntryTab />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
