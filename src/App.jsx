import { useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'

const previewStorageKey = 'ai_resume_builder_draft'

const createBlankEntry = () => ({ title: '', subtitle: '', dateRange: '', details: '' })

const initialBuilderState = {
  personal: { name: '', email: '', phone: '', location: '' },
  summary: '',
  education: [createBlankEntry()],
  experience: [createBlankEntry()],
  projects: [createBlankEntry()],
  skills: '',
  links: { github: '', linkedin: '' },
}

const sampleBuilderState = {
  personal: {
    name: 'Alex Carter',
    email: 'alex.carter@email.com',
    phone: '+1 (555) 231-0098',
    location: 'San Francisco, CA',
  },
  summary:
    'Product-focused frontend engineer building clean, accessible React applications with thoughtful UX and strong delivery ownership.',
  education: [
    {
      title: 'B.Tech in Computer Science',
      subtitle: 'KodNest Institute',
      dateRange: '2019 - 2023',
      details: 'Focused on software engineering, systems design, and frontend architecture.',
    },
  ],
  experience: [
    {
      title: 'Frontend Developer',
      subtitle: 'Nova Labs',
      dateRange: '2023 - Present',
      details: 'Built reusable UI systems and shipped customer-facing features across SaaS dashboards.',
    },
  ],
  projects: [
    {
      title: 'AI Resume Builder',
      subtitle: 'React, Vite',
      dateRange: '2026',
      details: 'Developing a premium resume workflow app with guided editing and polished previews.',
    },
  ],
  skills: 'React, JavaScript, TypeScript, CSS, API Integration, Git',
  links: { github: 'github.com/alexcarter', linkedin: 'linkedin.com/in/alexcarter' },
}

function AppFrame({ children }) {
  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="brand">AI Resume Builder</div>
        <nav className="nav-links">
          <NavLink to="/builder">Builder</NavLink>
          <NavLink to="/preview">Preview</NavLink>
          <NavLink to="/proof">Proof</NavLink>
        </nav>
      </header>
      <main className="page-wrap">{children}</main>
    </div>
  )
}

function HomePage() {
  return (
    <AppFrame>
      <section className="hero-card">
        <p className="eyebrow">KodNest Premium</p>
        <h1>Build a Resume That Gets Read.</h1>
        <Link className="primary-btn" to="/builder">
          Start Building
        </Link>
      </section>
    </AppFrame>
  )
}

function DynamicSection({ title, items, onChange, onAdd }) {
  return (
    <section className="form-section">
      <h3>{title}</h3>
      {items.map((item, index) => (
        <div key={`${title}-${index}`} className="entry-group">
          <input
            value={item.title}
            onChange={(event) => onChange(index, 'title', event.target.value)}
            placeholder="Title"
          />
          <input
            value={item.subtitle}
            onChange={(event) => onChange(index, 'subtitle', event.target.value)}
            placeholder="Subtitle"
          />
          <input
            value={item.dateRange}
            onChange={(event) => onChange(index, 'dateRange', event.target.value)}
            placeholder="Date range"
          />
          <textarea
            value={item.details}
            onChange={(event) => onChange(index, 'details', event.target.value)}
            placeholder="Details"
          />
        </div>
      ))}
      <button type="button" className="ghost-btn" onClick={onAdd}>
        Add {title} Entry
      </button>
    </section>
  )
}

function PreviewShell({ data }) {
  return (
    <section className="resume-preview-shell">
      <div className="preview-head">
        <h2>{data.personal.name || 'Your Name'}</h2>
        <p>
          {data.personal.email || 'email@example.com'} | {data.personal.phone || '+1 000 000 0000'} |{' '}
          {data.personal.location || 'Location'}
        </p>
      </div>
      <div className="preview-block">
        <h4>Summary</h4>
        <p>{data.summary || 'Summary appears here as you type in the form.'}</p>
      </div>
      <div className="preview-block">
        <h4>Education</h4>
        <p>Structured education entries will appear here.</p>
      </div>
      <div className="preview-block">
        <h4>Experience</h4>
        <p>Structured experience entries will appear here.</p>
      </div>
      <div className="preview-block">
        <h4>Projects</h4>
        <p>Structured project entries will appear here.</p>
      </div>
      <div className="preview-block">
        <h4>Skills</h4>
        <p>{data.skills || 'Comma-separated skills will appear here.'}</p>
      </div>
    </section>
  )
}

function BuilderPage() {
  const [formData, setFormData] = useState(() => {
    const fromStorage = localStorage.getItem(previewStorageKey)
    if (fromStorage) {
      try {
        return JSON.parse(fromStorage)
      } catch {
        return initialBuilderState
      }
    }
    return initialBuilderState
  })

  const saveDraft = (nextValue) => {
    setFormData(nextValue)
    localStorage.setItem(previewStorageKey, JSON.stringify(nextValue))
  }

  const updatePersonal = (field, value) => {
    saveDraft({ ...formData, personal: { ...formData.personal, [field]: value } })
  }

  const updateLinks = (field, value) => {
    saveDraft({ ...formData, links: { ...formData.links, [field]: value } })
  }

  const updateDynamic = (section, index, field, value) => {
    const nextSection = [...formData[section]]
    nextSection[index] = { ...nextSection[index], [field]: value }
    saveDraft({ ...formData, [section]: nextSection })
  }

  const addDynamic = (section) => {
    saveDraft({ ...formData, [section]: [...formData[section], createBlankEntry()] })
  }

  return (
    <AppFrame>
      <div className="builder-grid">
        <section className="builder-form">
          <div className="form-head">
            <h2>Resume Builder</h2>
            <button type="button" onClick={() => saveDraft(sampleBuilderState)}>
              Load Sample Data
            </button>
          </div>

          <section className="form-section">
            <h3>Personal Info</h3>
            <input
              value={formData.personal.name}
              onChange={(event) => updatePersonal('name', event.target.value)}
              placeholder="Full name"
            />
            <input
              value={formData.personal.email}
              onChange={(event) => updatePersonal('email', event.target.value)}
              placeholder="Email"
            />
            <input
              value={formData.personal.phone}
              onChange={(event) => updatePersonal('phone', event.target.value)}
              placeholder="Phone"
            />
            <input
              value={formData.personal.location}
              onChange={(event) => updatePersonal('location', event.target.value)}
              placeholder="Location"
            />
          </section>

          <section className="form-section">
            <h3>Summary</h3>
            <textarea
              value={formData.summary}
              onChange={(event) => saveDraft({ ...formData, summary: event.target.value })}
              placeholder="Professional summary"
            />
          </section>

          <DynamicSection
            title="Education"
            items={formData.education}
            onChange={(index, field, value) => updateDynamic('education', index, field, value)}
            onAdd={() => addDynamic('education')}
          />
          <DynamicSection
            title="Experience"
            items={formData.experience}
            onChange={(index, field, value) => updateDynamic('experience', index, field, value)}
            onAdd={() => addDynamic('experience')}
          />
          <DynamicSection
            title="Projects"
            items={formData.projects}
            onChange={(index, field, value) => updateDynamic('projects', index, field, value)}
            onAdd={() => addDynamic('projects')}
          />

          <section className="form-section">
            <h3>Skills</h3>
            <input
              value={formData.skills}
              onChange={(event) => saveDraft({ ...formData, skills: event.target.value })}
              placeholder="JavaScript, React, CSS"
            />
          </section>

          <section className="form-section">
            <h3>Links</h3>
            <input
              value={formData.links.github}
              onChange={(event) => updateLinks('github', event.target.value)}
              placeholder="GitHub"
            />
            <input
              value={formData.links.linkedin}
              onChange={(event) => updateLinks('linkedin', event.target.value)}
              placeholder="LinkedIn"
            />
          </section>
        </section>

        <aside className="live-preview">
          <h2>Live Preview</h2>
          <PreviewShell data={formData} />
        </aside>
      </div>
    </AppFrame>
  )
}

function PreviewPage() {
  const data = useMemo(() => {
    const fromStorage = localStorage.getItem(previewStorageKey)
    if (!fromStorage) return initialBuilderState
    try {
      return JSON.parse(fromStorage)
    } catch {
      return initialBuilderState
    }
  }, [])

  return (
    <AppFrame>
      <section className="mono-preview">
        <header>
          <h1>{data.personal.name || 'Your Name'}</h1>
          <p>
            {data.personal.email || 'email@example.com'} | {data.personal.phone || 'Phone'} |{' '}
            {data.personal.location || 'Location'}
          </p>
        </header>
        <article>
          <h2>Summary</h2>
          <p>{data.summary || 'Your summary will appear here.'}</p>
        </article>
        <article>
          <h2>Education</h2>
          <p>Clean structured resume layout placeholder.</p>
        </article>
        <article>
          <h2>Experience</h2>
          <p>Clean structured resume layout placeholder.</p>
        </article>
        <article>
          <h2>Projects</h2>
          <p>Clean structured resume layout placeholder.</p>
        </article>
        <article>
          <h2>Skills</h2>
          <p>{data.skills || 'Skills will appear here.'}</p>
        </article>
      </section>
    </AppFrame>
  )
}

function ProofPage() {
  return (
    <AppFrame>
      <section className="proof-card">
        <h1>Proof</h1>
        <p>Placeholder for artifacts.</p>
      </section>
    </AppFrame>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/builder" element={<BuilderPage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="/proof" element={<ProofPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
