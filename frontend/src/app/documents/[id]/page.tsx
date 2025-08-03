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
  const [docDetails, setDocDetails] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const fetchDocumentDetails = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !id) {
        router.push('/login');
        return;
    };

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch document details');
      const data = await res.json();
      setDocDetails(data);
    } catch (error) {
      console.error(error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
        fetchDocumentDetails();
    }
  }, [id]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const token = localStorage.getItem('access_token');
    setIsQuerying(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/documents/${id}/query`, {
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

  const handleDownload = async () => {
    const token = localStorage.getItem('access_token');
    if (!token || !id) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/${id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao baixar o arquivo.');
      }

      const disposition = res.headers.get('Content-Disposition');
      let fileName = 'documento_analise.txt'; // Nome padrão
      if (disposition?.includes('attachment')) {
        const filenameMatch = disposition.match(/filename="(.+)"/);
        if (filenameMatch?.[1]) {
          fileName = filenameMatch[1];
        }
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        const a = window.document.createElement('a');
        a.href = url;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Não foi possível baixar o arquivo.');
    }
  };

  if (isLoading) return <div className="text-center">Carregando...</div>;
  if (!docDetails) return <div className="text-center">Documento não encontrado.</div>;

  return (
    <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center">
        <Link href="/dashboard" className="text-blue-600 hover:underline">&larr; Voltar para o Dashboard</Link>
        <button
          onClick={handleDownload}
          className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          Download Análise
        </button>
      </div>
      <h1 className="text-2xl font-bold">{docDetails.fileName}</h1>

      <div>
        <h2 className="text-xl font-semibold">Texto Extraído</h2>
        <pre className="mt-2 p-4 bg-gray-50 border rounded-md whitespace-pre-wrap font-sans text-sm max-h-60 overflow-y-auto">
          {docDetails.extractedText || 'Ainda processando ou não foi possível extrair o texto.'}
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
        <div className="mt-2 space-y-4 max-h-80 overflow-y-auto">
          {docDetails.llmInteractions.map(interaction => (
            <div key={interaction.id}>
              <p className="font-semibold text-gray-700">Você:</p>
              <p className="p-2 bg-gray-100 rounded-md">{interaction.prompt}</p>
              <p className="mt-2 font-semibold text-blue-700">IA:</p>
              <pre className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded-md whitespace-pre-wrap font-sans">
                {interaction.response}
              </pre>
            </div>
          ))}
          {docDetails.llmInteractions.length === 0 && <p className="text-gray-500">Nenhuma pergunta foi feita ainda.</p>}
        </div>
      </div>
    </div>
  );
}
