import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { requireSupabase } from '../../services/supabase';
import { save, remove, upload } from '../../services/content';
import { useContent } from '../../hooks/useContent';
import { SEO, State } from '../../components/common';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { defaults, productCategories } from '../../data/defaults';
import { safeUrl, safeDestination, slugify } from '../../utils/urls';
import { editors, sections, type Field } from './fields';
import type { Row, TableName } from '../../types';
export default function Admin() {
  const loc = useLocation();
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const toast = useToast();
  const route = loc.pathname.replace(/^\/admin\/?/, '');
  const aliases: Record<string, string> = {
    portfolio: 'portfolio_items',
    blog: 'blog_posts',
    collaborations: 'collaboration_inquiries',
    settings: 'creator_settings',
  };
  const section = aliases[route] || route;
  const title = sections.find(([k]) => k === section)?.[1] || 'Not found';
  return (
    <div className="admin-shell">
      <SEO title={`${title} — Creator Admin`} noindex />
      <aside className="admin-sidebar">
        <Link to="/" className="wordmark">
          Karishma’s studio
        </Link>
        <nav aria-label="Admin navigation">
          {sections.map(([key, name]) => (
            <NavLink end key={key} to={`/admin${key ? '/' + key : ''}`}>
              {name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <h1>{title}</h1>
          <div className="admin-actions">
            <Link className="button secondary" to="/">
              View website
            </Link>
            <button
              className="button"
              onClick={async () => {
                try {
                  await auth.signOut();
                  navigate('/admin/login', { replace: true });
                } catch {
                  toast('Sign-out failed. Please try again.');
                }
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        {section === '' ? (
          <Dashboard />
        ) : section === 'analytics' ? (
          <Analytics />
        ) : section in editors ? (
          <Manager key={section} table={section as TableName} />
        ) : (
          <p>This admin section does not exist.</p>
        )}
      </div>
    </div>
  );
}
function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const inquiries = useContent('collaboration_inquiries');
  const posts = useContent('portfolio_items');
  const messages = useContent('contact_messages');
  useEffect(() => {
    let alive = true;
    void Promise.all(
      [
        'products',
        'portfolio_items',
        'blog_posts',
        'collaboration_inquiries',
        'contact_messages',
        'affiliate_clicks',
      ].map(async (table) => {
        let q = requireSupabase().from(table).select('id', { count: 'exact', head: true });
        if (table === 'products') q = q.eq('active', true);
        const { count, error } = await q;
        if (error) throw error;
        return [table, count ?? 0] as const;
      }),
    )
      .then((rows) => {
        if (alive) setCounts(Object.fromEntries(rows));
      })
      .catch(() => {
        if (alive) setError('Could not load dashboard totals.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <>
      <State loading={loading} error={error} retry={() => location.reload()} />
      <div className="dashboard-stats">
        {Object.entries(counts).map(([key, v]) => (
          <div key={key}>
            <strong>{v}</strong>
            <span>{key === 'products' ? 'Active products' : key.replaceAll('_', ' ')}</span>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: 40 }}>Recent enquiries</h2>
      <State
        {...inquiries}
        empty={!inquiries.data.length ? 'No brand enquiries yet.' : undefined}
        retry={inquiries.reload}
      />
      {inquiries.data.slice(0, 5).map((x) => (
        <p key={x.id}>
          <Link to="/admin/collaboration_inquiries">
            {x.brand_name} · {x.campaign_type} · {x.status}
          </Link>
        </p>
      ))}
      <h2 style={{ marginTop: 35 }}>Recent contact messages</h2>
      <State
        {...messages}
        retry={messages.reload}
        empty={!messages.data.length ? 'No contact messages yet.' : undefined}
      />
      {messages.data.slice(0, 5).map((x) => (
        <p key={x.id}>
          <Link to="/admin/contact_messages">
            {x.name} - {x.subject} - {x.status}
          </Link>
        </p>
      ))}
      <h2 style={{ marginTop: 35 }}>Recent content</h2>
      {posts.data.slice(0, 5).map((x) => (
        <p key={x.id}>
          {x.title} · {x.published ? 'Published' : 'Draft'}
        </p>
      ))}
      <Analytics compact />
    </>
  );
}
function Analytics({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<Record<string, { label: string; count: number }[]>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    requireSupabase()
      .rpc('admin_analytics')
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError('Analytics could not be loaded.');
        else setData(data ?? {});
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section style={{ marginTop: 35 }}>
      <h2>{compact ? 'Top product clicks' : 'Website analytics'}</h2>
      <p>Website events only. These are not Instagram analytics or confirmed sales.</p>
      <State loading={loading} error={error} retry={() => location.reload()} />
      {Object.entries(data)
        .filter(([k]) => !compact || k === 'product_clicks')
        .map(([key, rows]) => (
          <div key={key}>
            <h3 style={{ marginTop: 25 }}>{key.replaceAll('_', ' ')}</h3>
            {!rows.length ? (
              <p>No recorded events yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Label</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.label || 'Direct / unknown'}</td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
function Manager({ table }: { table: TableName }) {
  const result = useContent(table);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const inbox = ['collaboration_inquiries', 'contact_messages'].includes(table);
  const settings = table === 'creator_settings';
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const catalog = table === 'products' || table === 'looks';
  const visibleRows = result.data.filter(
    (row) =>
      (!catalog || category === 'All' || row.category === category) &&
      (!search ||
        `${row.name || row.title || row.brand_name || ''} ${row.email || ''} ${row.subject || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  useEffect(() => {
    if (!inbox) return;
    const timer = window.setInterval(result.reload, 30000);
    return () => window.clearInterval(timer);
  }, [inbox, result.reload]);
  async function del() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove(table, deleting);
      toast('Record deleted');
      setDeleting(null);
      if (editing?.id === deleting) setEditing(null);
      result.reload();
    } catch {
      toast('Could not delete this record. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  const newRow = () => {
    const record: Record<string, unknown> = {};
    for (const field of editors[table] ?? []) {
      record[field.key] =
        field.type === 'checkbox'
          ? false
          : field.type === 'select'
            ? (field.options?.[0] ?? '')
            : field.type === 'products' || field.type === 'portfolio'
              ? []
              : '';
    }
    if (table === 'products')
      Object.assign(record, { active: true, is_demo: false, currency: 'INR', sort_order: 0 });
    if (table === 'products' || table === 'looks') record.category = '';
    if (table === 'blog_posts') record.author = defaults.name;
    return record;
  };
  return (
    <>
      {inbox && (
        <div className="actions">
          <p>{result.data.length} messages - Updates every 30 seconds</p>
          <button type="button" className="button secondary" onClick={result.reload}>
            Refresh inbox
          </button>
        </div>
      )}
      {!inbox && (
        <button
          className="button"
          disabled={!!editing || result.loading || !!result.error}
          onClick={() => setEditing(settings ? { ...(result.data[0] ?? defaults) } : newRow())}
        >
          {settings ? 'Edit settings' : 'Add new'}
        </button>
      )}
      <State
        {...result}
        retry={result.reload}
        empty={
          !result.data.length && !editing
            ? `No ${sections.find(([k]) => k === table)?.[1].toLowerCase()} yet.`
            : undefined
        }
      />
      {editing && !inbox && (
        <Editor
          key={String(editing.id || 'new')}
          table={table}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            result.reload();
          }}
        />
      )}
      {editing && inbox && (
        <section className="admin-editor">
          <h2>Message details</h2>
          <dl>
            {Object.entries(editing)
              .filter(([key]) => !['id', 'request_id', 'consent', 'status'].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <dt className="eyebrow">{key.replaceAll('_', ' ')}</dt>
                  <dd
                    style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '0 0 20px' }}
                  >
                    {String(value ?? '')}
                  </dd>
                </div>
              ))}
          </dl>
          <button type="button" className="button secondary" onClick={() => setEditing(null)}>
            Close details
          </button>
        </section>
      )}
      {(catalog || inbox) && result.data.length > 0 && (!editing || inbox) && (
        <div className="actions">
          <label className="field">
            Search records
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={inbox ? 'Name, email or subject' : 'Product or look name'}
            />
          </label>
          {catalog && (
            <label className="field">
              Filter by category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Array.from(
                  new Set([
                    ...productCategories,
                    ...result.data.map((r) => String(r.category || '')).filter(Boolean),
                  ]),
                ).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      {result.data.length > 0 && (!editing || inbox) && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{inbox ? 'Enquiry' : 'Name / title'}</th>
                <th>{inbox ? 'Subject / campaign' : 'Status / category'}</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!visibleRows.length && !result.loading && (
                <tr>
                  <td colSpan={4}>No matching records.</td>
                </tr>
              )}
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {String(row.name || row.title || row.brand_name || row.keyword || row.id)}
                    {inbox && (
                      <>
                        <br />
                        {String(row.email)}
                      </>
                    )}
                  </td>
                  <td>
                    {String(
                      (inbox ? row.subject || row.campaign_type : undefined) ??
                        row.status ??
                        row.category ??
                        (row.published ? 'Published' : row.active ? 'Active' : ''),
                    )}
                  </td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <button onClick={() => setEditing({ ...row })}>
                      {inbox ? 'View message' : 'Edit'}
                    </button>
                    {!settings && (
                      <button style={{ marginLeft: 15 }} onClick={() => setDeleting(row.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleting && <Confirm busy={busy} onCancel={() => setDeleting(null)} onConfirm={del} />}
    </>
  );
}
function Confirm({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    dialog.current?.querySelector('button')?.focus();
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
      if (e.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll('button');
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', fn);
    return () => {
      document.removeEventListener('keydown', fn);
      before?.focus();
    };
  }, [busy, onCancel]);
  return (
    <div className="dialog-backdrop">
      <div
        ref={dialog}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title">Delete this record?</h2>
        <p>This removes the record permanently. Related look assignments may also be removed.</p>
        <div className="actions">
          <button className="button secondary" disabled={busy} onClick={onCancel}>
            Keep it
          </button>
          <button className="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'Deleting…' : 'Delete record'}
          </button>
        </div>
      </div>
    </div>
  );
}
function Editor({
  table,
  initial,
  onClose,
  onSaved,
}: {
  table: TableName;
  initial: Record<string, unknown>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState(0);
  const toast = useToast();
  const fields = editors[table] ?? [];
  const inbox = ['collaboration_inquiries', 'contact_messages'].includes(table);
  const update = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || uploads > 0) return;
    setError('');
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {};
      if (values.id) payload.id = values.id;
      if (table === 'products' || table === 'looks') {
        payload.slug =
          values.slug ||
          `${
            slugify(String(values.name || values.title || 'item'))
              .slice(0, 90)
              .replace(/-$/, '') || 'item'
          }-${crypto.randomUUID().slice(0, 8)}`;
      }
      for (const field of fields) {
        let v = values[field.key];
        if (field.required && (v === undefined || String(v).trim() === ''))
          throw new Error(`${field.label} is required.`);
        if (field.type === 'number') {
          v =
            v === '' || v === null
              ? ['price', 'views', 'likes'].includes(field.key)
                ? null
                : 0
              : Number(v);
          if (v !== null && (!Number.isFinite(v) || Number(v) < 0))
            throw new Error(`${field.label} must be a non-negative number.`);
        }
        if (field.type === 'checkbox') v = !!v;
        if (['url', 'image', 'pdf'].includes(field.type ?? '') && v && !safeUrl(v))
          throw new Error(`${field.label} needs a valid http(s) URL.`);
        if (field.type === 'date' || field.type === 'datetime-local')
          v = v ? (field.type === 'datetime-local' ? new Date(String(v)).toISOString() : v) : null;
        if (field.key === 'slug' && v !== slugify(String(v)))
          throw new Error('Use a lowercase URL slug with letters, numbers and hyphens.');
        if (field.key === 'destination_url' && !safeDestination(String(v)))
          throw new Error('Use a safe relative path or http(s) URL.');
        if (field.key === 'keyword' && !/^[a-zA-Z0-9-]+$/.test(String(v)))
          throw new Error('Keywords can contain letters, numbers and hyphens.');
        if (field.key === 'currency' && !/^[A-Z]{3}$/.test(String(v)))
          throw new Error('Currency must be a three-letter code, such as INR.');
        payload[field.key] = v === undefined ? '' : v;
      }
      if (table === 'blog_posts' && payload.status === 'published' && !payload.published_at)
        payload.published_at = new Date().toISOString();
      await save(table, payload as Partial<Row>);
      toast('Saved successfully');
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Check your fields and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-editor" onSubmit={submit}>
      <h2>{inbox ? 'Enquiry details' : values.id ? 'Edit record' : 'Create record'}</h2>
      {inbox && (
        <dl>
          {Object.entries(initial)
            .filter(([key]) => !['id', 'request_id', 'status'].includes(key))
            .map(([key, v]) => (
              <div key={key}>
                <dt className="eyebrow" style={{ marginBottom: 0 }}>
                  {key.replaceAll('_', ' ')}
                </dt>
                <dd
                  style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: '0 0 20px' }}
                >
                  {String(v ?? '')}
                </dd>
              </div>
            ))}
        </dl>
      )}
      <fieldset
        className="form-grid"
        disabled={busy}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
      >
        {fields.map((field) => (
          <EditorField
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => update(field.key, v)}
            onUpload={(delta) => setUploads((n) => n + delta)}
          />
        ))}
      </fieldset>
      {table === 'looks' && !!values.id && <LookAssignments lookId={String(values.id)} />}{' '}
      {table === 'looks' && !values.id && (
        <p>Save the look first, then edit it to assign products.</p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="button" disabled={busy || uploads > 0}>
          {busy ? 'Saving…' : uploads ? 'Uploading…' : 'Save changes'}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={busy || uploads > 0}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
function EditorField({
  field,
  value,
  onChange,
  onUpload,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  onUpload: (d: number) => void;
}) {
  const [uploadError, setUploadError] = useState('');
  const id = `field-${field.key}`;
  async function send(file?: File) {
    if (!file) return;
    onUpload(1);
    setUploadError('');
    try {
      onChange(await upload(file, field.bucket || 'creator-images'));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      onUpload(-1);
    }
  }
  if (field.type === 'products' || field.type === 'portfolio')
    return <RelatedSelect field={field} value={value} onChange={onChange} />;
  return (
    <div className={`field ${field.type === 'textarea' ? 'full' : ''}`}>
      <label htmlFor={id}>{field.label}</label>
      {field.type === 'checkbox' ? (
        <input
          id={id}
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 22, height: 22, minHeight: 22 }}
        />
      ) : field.type === 'textarea' ? (
        <textarea
          id={id}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          rows={field.key === 'content' ? 16 : 4}
        />
      ) : field.type === 'select' ? (
        <select
          id={id}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Choose a category or option</option>
          {!!value && !field.options?.includes(String(value)) && <option>{String(value)}</option>}
          {field.options?.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type === 'image' || field.type === 'pdf' ? 'url' : field.type || 'text'}
          required={field.required}
          min={field.type === 'number' ? 0 : undefined}
          step={field.key === 'price' ? '0.01' : field.type === 'number' ? '1' : undefined}
          value={
            field.type === 'datetime-local' ? String(value ?? '').slice(0, 16) : String(value ?? '')
          }
          onChange={(e) => onChange(e.target.value)}
        />
      )}{' '}
      {field.bucket && (
        <div className="upload-row">
          <input
            aria-label={`Upload ${field.label}`}
            type="file"
            accept={
              field.type === 'pdf'
                ? 'application/pdf'
                : 'image/jpeg,image/png,image/webp,image/avif'
            }
            onChange={(e) => void send(e.target.files?.[0])}
          />
          {safeUrl(value) && field.type === 'image' && (
            <img src={String(value)} alt="Upload preview" style={{ height: 120, width: 120 }} />
          )}
          {uploadError && <small role="alert">{uploadError}</small>}
        </div>
      )}
      {field.help && <span className="muted">{field.help}</span>}
    </div>
  );
}
function RelatedSelect({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const result = useContent(field.type === 'products' ? 'products' : 'portfolio_items');
  const selected = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div className="field">
      <label htmlFor={`related-${field.key}`}>{field.label}</label>
      <select
        id={`related-${field.key}`}
        multiple
        value={selected}
        onChange={(e) => onChange(Array.from(e.target.selectedOptions, (x) => x.value))}
      >
        {result.data.map((x) => (
          <option key={x.id} value={x.id}>
            {String(x.name || x.title)}
          </option>
        ))}
      </select>
      <span className="muted">Hold Ctrl / Cmd to select multiple.</span>
      <State error={result.error} retry={result.reload} />
    </div>
  );
}
function LookAssignments({ lookId }: { lookId: string }) {
  const products = useContent('products');
  const links = useContent('look_products');
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const assigned = links.data
    .filter((x) => x.look_id === lookId)
    .sort((a, b) => a.sort_order - b.sort_order);
  async function add() {
    if (!selected) return;
    setBusy(true);
    try {
      await save('look_products', {
        look_id: lookId,
        product_id: selected,
        sort_order: assigned.length,
      });
      links.reload();
      setSelected('');
    } catch {
      toast('Could not assign product.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section style={{ marginTop: 30 }}>
      <h3>Products in this look</h3>
      <State
        loading={links.loading || products.loading}
        error={links.error || products.error}
        retry={() => {
          links.reload();
          products.reload();
        }}
      />
      {assigned.map((x, i) => (
        <div key={x.id} className="toolbar">
          <span>
            {String(products.data.find((p) => p.id === x.product_id)?.name || x.product_id)}
          </span>
          <label>
            Order{' '}
            <input
              aria-label={`Order for product ${i + 1}`}
              type="number"
              min="0"
              defaultValue={x.sort_order}
              style={{ width: 85 }}
              onBlur={(e) => {
                const order = Number(e.target.value);
                if (Number.isInteger(order) && order >= 0)
                  void save('look_products', { id: x.id, sort_order: order })
                    .then(links.reload)
                    .catch(() => toast('Could not change order.'));
              }}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              void remove('look_products', x.id)
                .then(links.reload)
                .catch(() => toast('Could not remove product.'))
            }
          >
            Remove from look
          </button>
        </div>
      ))}
      <div className="toolbar">
        <select
          aria-label="Product to add to look"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Choose a product</option>
          {products.data
            .filter((p) => !assigned.some((x) => x.product_id === p.id))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
        <button
          className="button secondary"
          type="button"
          disabled={!selected || busy}
          onClick={add}
        >
          Add product
        </button>
      </div>
    </section>
  );
}
