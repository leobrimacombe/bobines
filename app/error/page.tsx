import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h1 className="text-4xl mb-4">Oups 😕</h1>
        <p className="text-gray-600 mb-6">
          Une erreur s'est produite lors de la connexion.
          <br/>
          Soit le mot de passe est faux, soit le compte existe déjà.
        </p>
        
        <Link 
          href="/login" 
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Réessayer
        </Link>
      </div>
    </div>
  )
}