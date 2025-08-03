'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type LlmInteraction = {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
};

type DocumentDetails = {
  id: string;
  fileName: string;
  status: string;
  extractedText: string | null;
  llmInteractions: LlmInteraction[];
};

export default function DocumentDetailPage() {
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const fetchDocumentDetails = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !id) return;

    try {
      const res = await fetch(`http://localhost:3000/documents/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch document details');
      const data = await res.json();
      setDocument(data);
    } catch (error) {
      console.error(error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentDetails();
  }, [id]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const token = localStorage.getItem('access_token');
    setIsQuerying(true);

    try {
      await fetch(`http://localhost:3000/documents/${id}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      setPrompt('');
      fetchDocumentDetails();
    } catch (error) {
      console.error('Failed to submit query', error);
    } finally {
      setIsQuerying(false);
    }
  };

  if (isLoading) return <div>Carregando...</div>;
  if (!document) return <div>Documento não encontrado.</div>;

  return (
    <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <Link href="/dashboard" className="text-blue-600 hover:underline">&larr; Voltar para o Dashboard</Link>
      <h1 className="text-2xl font-bold">{document.fileName}</h1>

      <div>
        <h2 className="text-xl font-semibold">Texto Extraído</h2>
        <pre className="mt-2 p-4 bg-gray-50 border rounded-md whitespace-pre-wrap font-sans text-sm">
          {document.extractedText || 'Ainda processando ou não foi possível extrair o texto.'}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Interagir com IA</h2>
        <form onSubmit={handleQuerySubmit} className="mt-2 space-y-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Faça uma pergunta sobre o documento..."
            className="w-full p-2 border rounded-md"
            rows={3}
          />
          <button
            type="submit"
            disabled={isQuerying}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isQuerying ? 'Pensando...' : 'Enviar Pergunta'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Histórico de Interações</h2>
        <div className="mt-2 space-y-4">
          {document.llmInteractions.map(interaction => (
            <div key={interaction.id}>
              <p className="font-semibold text-gray-700">Você:</p>
              <p className="p-2 bg-gray-100 rounded-md">{interaction.prompt}</p>
              <p className="mt-2 font-semibold text-blue-700">IA:</p>
              <pre className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded-md whitespace-pre-wrap font-sans">
                {interaction.response}
              </pre>
            </div>
          ))}
          {document.llmInteractions.length === 0 && <p className="text-gray-500">Nenhuma pergunta foi feita ainda.</p>}
        </div>
      </div>
    </div>
  );
}
