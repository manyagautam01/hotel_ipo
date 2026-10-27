import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { errorMessage } from '../services/api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (form.password.length < 8) e.password = 'Use at least 8 characters.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const u = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(`Account created. Welcome, ${u.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const Field = ({ id, label, type = 'text', auto }) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={auto} value={form[id]} onChange={set(id)} aria-invalid={!!errors[id]} />
      {errors[id] && <span className="field-error">{errors[id]}</span>}
    </div>
  );

  return (
    <section className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">It takes less than a minute.</p>
        {Field({ id: 'name', label: 'Full name', auto: 'name' })}
        {Field({ id: 'email', label: 'Email', type: 'email', auto: 'email' })}
        {Field({ id: 'password', label: 'Password', type: 'password', auto: 'new-password' })}
        {Field({ id: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password' })}
        {serverError && <p className="form-error" role="alert">{serverError}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="auth-alt">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
