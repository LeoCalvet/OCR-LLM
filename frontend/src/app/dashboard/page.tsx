'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Document = {
  id: string;
  fileName: string;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const router = useRouter();

  // Corrigido: Envolvido em useCallback para estabilizar a função
  const fetchDocuments = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Authentication failed');
      }

      const data = await res.json();
      setDocuments(data);
    } catch { // Corrigido: Removido 'error' não utilizado
      localStorage.removeItem('access_token');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]); // Corrigido: Adicionada a dependência 'fetchDocuments'

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage('Por favor, selecione um arquivo.');
      return;
    }

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Upload bem-sucedido! ID: ${data.documentId}`);
        fetchDocuments();
        setSelectedFile(null);
        (event.target as HTMLFormElement).reset();
      } else {
        throw new Error(data.message || 'Falha no upload');
      }
    } catch (error: unknown) { // Corrigido: 'any' trocado por 'unknown'
      if (error instanceof Error) {
        setMessage(`Erro: ${error.message}`);
      } else {
        setMessage('Ocorreu um erro desconhecido.');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl p-8 space-y-8 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
      <hr />
      <div>
        <h2 className="text-2xl font-semibold text-gray-700">Upload de Documento</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            type="submit"
            className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            disabled={!selectedFile}
          >
            Enviar
          </button>
        </form>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      </div>
      <hr />
      <div>
        <h2 className="text-2xl font-semibold text-gray-700">Meus Documentos</h2>
        <div className="mt-4 space-y-3">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <Link href={`/documents/${doc.id}`} key={doc.id}>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">Criado em: {new Date(doc.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      doc.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      doc.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">Você ainda não enviou nenhum documento.</p>
          )}
        </div>
      </div>
    </div>
  );
}
