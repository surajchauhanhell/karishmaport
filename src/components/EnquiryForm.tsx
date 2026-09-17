import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { requireSupabase, supabase } from '../services/supabase';
import { useCreator } from '../contexts/CreatorContext';
import { useToast } from '../contexts/ToastContext';
import { track } from '../services/analytics';
const text = z
  .string()
  .trim()
  .min(2, 'Please enter at least 2 characters.')
  .max(3000, 'Please keep this under 3,000 characters.');
const base = z.object({
  name: text.max(120),
  email: z.string().trim().email('Please enter a valid email.').max(254),
  subject: text.max(200),
  message: text,
  consent: z.literal(true, { errorMap: () => ({ message: 'Please agree before sending.' }) }),
  website_trap: z.string().max(0),
});
const collab = base.omit({ name: true, subject: true }).extend({
  brand_name: text.max(150),
  contact_name: text.max(120),
  phone: z.string().max(40),
  website: z.union([
    z.literal(''),
    z
      .string()
      .url()
      .refine((v) => /^https?:\/\//.test(v), 'Use an https URL.'),
  ]),
  campaign_type: text.max(100),
  product: text.max(200),
  budget_range: z.string().max(100),
  deliverables: text,
  target_date: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Choose a date.'),
});
type Values = Record<string, string | boolean>;
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}
export default function EnquiryForm({ collaboration = false }: { collaboration?: boolean }) {
  const c = useCreator();
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [token, setToken] = useState('');
  const captcha = useRef<HTMLDivElement>(null);
  const widget = useRef('');
  const started = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(collaboration ? collab : base),
    defaultValues: {
      consent: false,
      website_trap: '',
      phone: '',
      website: '',
      budget_range: '',
      target_date: '',
    },
  });
  useEffect(() => {
    if (!siteKey) return;
    let dead = false;
    const render = () => {
      if (!dead && captcha.current && window.turnstile)
        widget.current = window.turnstile.render(captcha.current, {
          sitekey: siteKey,
          callback: setToken,
          'expired-callback': () => setToken(''),
        });
    };
    const existing = document.getElementById('turnstile-script');
    if (window.turnstile) render();
    else if (existing) existing.addEventListener('load', render, { once: true });
    else {
      const s = document.createElement('script');
      s.id = 'turnstile-script';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.addEventListener('load', render, { once: true });
      document.head.appendChild(s);
    }
    return () => {
      dead = true;
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, [siteKey]);
  const fields = collaboration
    ? [
        ['brand_name', 'Brand name'],
        ['contact_name', 'Contact person'],
        ['email', 'Email', 'email'],
        ['phone', 'Phone (optional)', 'tel'],
        ['website', 'Website (optional)', 'url'],
        ['campaign_type', 'Campaign type'],
        ['product', 'Product / service'],
        ['budget_range', 'Budget range (optional)'],
        ['deliverables', 'Expected deliverables'],
        ['target_date', 'Target date (optional)', 'date'],
        ['message', 'Tell me about your idea', 'textarea'],
      ]
    : [
        ['name', 'Your name'],
        ['email', 'Email', 'email'],
        ['subject', 'Subject'],
        ['message', 'Your message', 'textarea'],
      ];
  async function submit(values: Values) {
    setServerError('');
    try {
      const { data, error } = await requireSupabase().functions.invoke('public-api', {
        body: {
          action: collaboration ? 'collaboration' : 'contact',
          values,
          token,
          request_id: requestId.current,
        },
      });
      if (error || data?.error)
        throw new Error(
          data?.error || 'Your message could not be sent. Please try again or email Karishma.',
        );
      toast('Message sent. Thank you for reaching out!');
      if (collaboration) track('brand_inquiry_submit');
      reset();
      requestId.current = crypto.randomUUID();
      setToken('');
      if (widget.current) window.turnstile?.reset(widget.current);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'Please try again.');
      if (widget.current) window.turnstile?.reset(widget.current);
      setToken('');
    }
  }
  return (
    <form
      className="form-card"
      onSubmit={handleSubmit(submit)}
      onFocus={() => {
        if (collaboration && !started.current) {
          track('brand_inquiry_start');
          started.current = true;
        }
      }}
      noValidate
    >
      <h2>{collaboration ? 'Tell me your idea.' : 'Leave a little note.'}</h2>
      {!supabase && (
        <p>
          The enquiry service is being connected. You can reach me directly at{' '}
          <a className="text-link" href={`mailto:${c.email}`}>
            {c.email}
          </a>
          .
        </p>
      )}
      <div className="form-grid">
        {fields.map(([name, label, type]) => (
          <label className={`field ${type === 'textarea' ? 'full' : ''}`} key={name}>
            {label}
            {type === 'textarea' ? (
              <textarea
                {...register(name)}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
              />
            ) : (
              <input
                type={type || 'text'}
                {...register(name)}
                aria-invalid={!!errors[name]}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
              />
            )}{' '}
            {errors[name] && <small id={`${name}-error`}>{String(errors[name]?.message)}</small>}
          </label>
        ))}
        <label className="honeypot" aria-hidden="true">
          Leave this empty
          <input tabIndex={-1} autoComplete="off" {...register('website_trap')} />
        </label>
        <div className="field full">
          <label className="checkbox">
            <input type="checkbox" {...register('consent')} />
            <span>
              I agree to have these details used to respond to my enquiry, as described in the{' '}
              <Link className="underline" to="/privacy">
                privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.consent && <small>{String(errors.consent.message)}</small>}
        </div>
      </div>
      {siteKey && <div ref={captcha} />}{' '}
      {serverError && (
        <p role="alert" className="form-error">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        className="button"
        disabled={isSubmitting || !supabase || (!!siteKey && !token)}
      >
        {isSubmitting ? 'Sending…' : collaboration ? 'Send collaboration enquiry' : 'Send message'}
      </button>
    </form>
  );
}
