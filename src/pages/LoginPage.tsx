import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in with email:', userCredential.user);
      navigate('/');
    } catch (err: any) {
      console.error('Email login failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('User signed in with Google:', user);
      navigate('/');
    } catch (err: any) {
      console.error('Google login failed:', err);
      setError(err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const loading = isLoading || isGoogleLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary font-sans">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-xl">
        <div className="flex justify-center mb-6">
          <img src="/windfleet logo.png" alt="WindFleet Logo" className="w-36 h-36" />
        </div>
        <h3 className="text-2xl font-bold text-center text-neutral-dark mb-8">Login to your account</h3>
        <form onSubmit={handleEmailLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark" htmlFor="email">Email Address</label>
              <input type="email"
                     placeholder="you@example.com"
                     id="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading}
                     className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark" htmlFor="password">Password</label>
              <input type="password"
                     placeholder="Enter your password"
                     id="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading}
                     className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100" />
            </div>
            {error && <p className="text-sm text-accent-coral">{error}</p>}
            <div>
              <button type="submit" disabled={loading}
                      className="w-full flex justify-center px-6 py-3 mt-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-md hover:bg-teal-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-neutral-dark/75">Or continue with</span>
          </div>
        </div>

        <div>
          <button onClick={handleGoogleLogin} disabled={loading}
                  className="w-full flex justify-center items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-neutral-dark bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed">
            <svg className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
            {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-neutral-dark/75">Don't have an account?</span>
          <Link to="/signup" className="font-medium text-primary hover:text-teal-light ml-1">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 