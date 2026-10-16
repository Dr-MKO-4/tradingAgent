import { useState } from 'react';
import useAuth from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    await login(email, pass);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={pass} onChange={e => setPass(e.target.value)} />
      <button type="submit">Se connecter</button>
    </form>
  );
}
