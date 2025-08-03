import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <h1>Página Principal</h1>
      <nav>
        <Link href="/signup">Cadastro</Link> | <Link href="/login">Login</Link>
      </nav>
      <p>Área de upload (será protegida)</p>
    </main>
  );
}
