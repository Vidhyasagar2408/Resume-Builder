import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'

const storageKey = 'resumeBuilderData'
const templateStorageKey = 'resumeBuilderTemplate'
const accentColorStorageKey = 'resumeBuilderAccentColor'
const templateOptions = ['Classic', 'Modern', 'Minimal']
const accentOptions = [
  { name: 'Teal', value: 'hsl(168, 60%, 40%)' },
  { name: 'Navy', value: 'hsl(220, 60%, 35%)' },
  { name: 'Burgundy', value: 'hsl(345, 60%, 35%)' },
  { name: 'Forest', value: 'hsl(150, 50%, 30%)' },
  { name: 'Charcoal', value: 'hsl(0, 0%, 25%)' },
]
const actionVerbs = ['Built', 'Developed', 'Designed', 'Implemented', 'Led', 'Improved', 'Created', 'Optimized', 'Automated']

const createBlankEntry = () => ({ title: '', subtitle: '', dateRange: '', details: '' })
const createBlankProject = () => ({
  title: '',
  description: '',
  techStack: [],
  liveUrl: '',
  githubUrl: '',
})

const initialBuilderState = {
  personal: { name: '', email: '', phone: '', location: '' },
  summary: '',
  education: [createBlankEntry()],
  experience: [createBlankEntry()],
  projects: [createBlankProject()],
  skills: {
    technical: [],
    soft: [],
    tools: [],
  },
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
    'Frontend engineer building premium and accessible product interfaces. Increased form completion by 32% and reduced bounce rate by 18% through content hierarchy, design tokens, and performance-driven React architecture across multiple product surfaces.',
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
      details: 'Shipped 14 production features and improved Lighthouse performance from 72 to 94.',
    },
  ],
  projects: [
    {
      title: 'AI Resume Builder',
      description: 'Built guided resume authoring flow used by 1.2k+ learners.',
      techStack: ['React', 'Vite'],
      liveUrl: 'https://example.com/resume-builder',
      githubUrl: 'https://github.com/alexcarter/resume-builder',
    },
    {
      title: 'Portfolio CMS',
      description: 'Reduced content publishing time by 45% with reusable templates.',
      techStack: ['Node.js', 'React'],
      liveUrl: '',
      githubUrl: 'https://github.com/alexcarter/portfolio-cms',
    },
  ],
  skills: {
    technical: ['React', 'JavaScript', 'TypeScript', 'GraphQL', 'PostgreSQL'],
    soft: ['Problem Solving', 'Team Leadership'],
    tools: ['Git', 'Docker', 'AWS'],
  },
  links: { github: 'github.com/alexcarter', linkedin: 'linkedin.com/in/alexcarter' },
}

const trimValue = (value) => (value || '').trim()

const normalizeTagList = (value) =>
  Array.isArray(value)
    ? value.map((item) => trimValue(item)).filter(Boolean)
    : trimValue(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

const getSkillGroups = (skillsValue) => {
  if (typeof skillsValue === 'string') {
    const parsed = normalizeTagList(skillsValue)
    return {
      technical: parsed,
      soft: [],
      tools: [],
    }
  }

  const value = skillsValue || {}
  return {
    technical: normalizeTagList(value.technical),
    soft: normalizeTagList(value.soft),
    tools: normalizeTagList(value.tools),
  }
}

const getAllSkills = (skillsValue) => {
  const groups = getSkillGroups(skillsValue)
  return [...groups.technical, ...groups.soft, ...groups.tools]
}

const isFilledEntry = (entry) =>
  [entry.title, entry.subtitle, entry.dateRange, entry.details].some((value) => trimValue(value))

const getFilledEntries = (entries = []) => entries.filter(isFilledEntry)
const isFilledProject = (project) =>
  [project.title, project.description, project.liveUrl, project.githubUrl].some((value) => trimValue(value)) ||
  normalizeTagList(project.techStack).length > 0

const getFilledProjects = (projects = []) => projects.filter(isFilledProject)

const hasNumberInText = (text) => /\b\d+(?:\.\d+)?\s*(?:%|x|k)?\b/i.test(text)

const startsWithActionVerb = (text) => {
  const firstWord = trimValue(text).split(/\s+/)[0] || ''
  return actionVerbs.some((verb) => verb.toLowerCase() === firstWord.toLowerCase())
}

const hydrateData = (rawValue) => {
  if (!rawValue) return initialBuilderState

  try {
    const parsed = JSON.parse(rawValue)
    return {
      personal: { ...initialBuilderState.personal, ...(parsed.personal || {}) },
      summary: parsed.summary || '',
      education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : [createBlankEntry()],
      experience: Array.isArray(parsed.experience) && parsed.experience.length ? parsed.experience : [createBlankEntry()],
      projects:
        Array.isArray(parsed.projects) && parsed.projects.length
          ? parsed.projects.map((item) => ({
              title: item.title || '',
              description: item.description || item.details || '',
              techStack: normalizeTagList(item.techStack || item.subtitle || ''),
              liveUrl: item.liveUrl || '',
              githubUrl: item.githubUrl || '',
            }))
          : [createBlankProject()],
      skills: getSkillGroups(parsed.skills),
      links: { ...initialBuilderState.links, ...(parsed.links || {}) },
    }
  } catch {
    return initialBuilderState
  }
}

const calculateAtsScore = (data) => {
  let score = 0
  const suggestions = []
  const summary = trimValue(data.summary)
  const summaryHasActionVerb = /\b(built|led|designed|improved|implemented|created|optimized|automated|developed)\b/i.test(summary)
  const hasExperienceWithBullets = getFilledEntries(data.experience).some(
    (entry) => trimValue(entry.details).split('\n').map((line) => line.trim()).filter(Boolean).length > 0,
  )
  const hasEducation = getFilledEntries(data.education).length > 0
  const hasSkills = getAllSkills(data.skills).length >= 5
  const hasProjects = getFilledProjects(data.projects).length > 0
  const hasName = Boolean(trimValue(data.personal.name))
  const hasEmail = Boolean(trimValue(data.personal.email))
  const hasPhone = Boolean(trimValue(data.personal.phone))
  const hasLinkedIn = Boolean(trimValue(data.links.linkedin))
  const hasGitHub = Boolean(trimValue(data.links.github))

  if (hasName) score += 10
  else suggestions.push('Add your name (+10 points).')

  if (hasEmail) score += 10
  else suggestions.push('Add your email (+10 points).')

  if (summary.length > 50) score += 10
  else suggestions.push('Add a professional summary (+10 points).')

  if (hasExperienceWithBullets) score += 15
  else suggestions.push('Add experience with bullet points (+15 points).')

  if (hasEducation) score += 10
  else suggestions.push('Add at least one education entry (+10 points).')

  if (hasSkills) score += 10
  else suggestions.push('Add at least 5 skills (+10 points).')

  if (hasProjects) score += 10
  else suggestions.push('Add at least one project (+10 points).')

  if (hasPhone) score += 5
  else suggestions.push('Add your phone number (+5 points).')

  if (hasLinkedIn) score += 5
  else suggestions.push('Add your LinkedIn URL (+5 points).')

  if (hasGitHub) score += 5
  else suggestions.push('Add your GitHub URL (+5 points).')

  if (summaryHasActionVerb) score += 10
  else suggestions.push('Use action verbs in summary (+10 points).')

  let label = 'Strong Resume'
  let band = 'strong'
  if (score <= 40) {
    label = 'Needs Work'
    band = 'needs-work'
  } else if (score <= 70) {
    label = 'Getting There'
    band = 'getting-there'
  }

  return { score: Math.min(score, 100), label, band, suggestions }
}

const getStoredTemplate = () => {
  const value = localStorage.getItem(templateStorageKey)
  return templateOptions.includes(value) ? value : 'Classic'
}

const getStoredAccentColor = () => {
  const value = localStorage.getItem(accentColorStorageKey)
  const fallback = accentOptions[0].value
  return accentOptions.some((item) => item.value === value) ? value : fallback
}

const hasMinimumExportData = (data) => {
  const hasName = Boolean(trimValue(data.personal.name))
  const hasExperience = getFilledEntries(data.experience).length > 0
  const hasProjects = getFilledProjects(data.projects).length > 0
  return hasName && (hasExperience || hasProjects)
}

const buildPlainTextResume = (data) => {
  const sections = []
  const education = getFilledEntries(data.education)
  const experience = getFilledEntries(data.experience)
  const projects = getFilledProjects(data.projects)
  const skillGroups = getSkillGroups(data.skills)
  const github = trimValue(data.links.github)
  const linkedin = trimValue(data.links.linkedin)

  sections.push('Name')
  sections.push(trimValue(data.personal.name) || 'Not provided')

  sections.push('')
  sections.push('Contact')
  sections.push(
    [trimValue(data.personal.email), trimValue(data.personal.phone), trimValue(data.personal.location)]
      .filter(Boolean)
      .join(' | ') || 'Not provided',
  )

  sections.push('')
  sections.push('Summary')
  sections.push(trimValue(data.summary) || 'Not provided')

  sections.push('')
  sections.push('Education')
  sections.push(
    education.length
      ? education
          .map((item) => [item.title, item.subtitle, item.dateRange, item.details].filter((value) => trimValue(value)).join(' | '))
          .join('\n')
      : 'Not provided',
  )

  sections.push('')
  sections.push('Experience')
  sections.push(
    experience.length
      ? experience
          .map((item) => [item.title, item.subtitle, item.dateRange, item.details].filter((value) => trimValue(value)).join(' | '))
          .join('\n')
      : 'Not provided',
  )

  sections.push('')
  sections.push('Projects')
  sections.push(
    projects.length
      ? projects
          .map((item) =>
            [
              item.title,
              item.description,
              normalizeTagList(item.techStack).length ? `Tech: ${normalizeTagList(item.techStack).join(', ')}` : '',
              item.liveUrl ? `Live: ${item.liveUrl}` : '',
              item.githubUrl ? `GitHub: ${item.githubUrl}` : '',
            ]
              .filter((value) => trimValue(value))
              .join(' | '),
          )
          .join('\n')
      : 'Not provided',
  )

  sections.push('')
  sections.push('Skills')
  sections.push(
    [...skillGroups.technical, ...skillGroups.soft, ...skillGroups.tools].length
      ? [`Technical Skills: ${skillGroups.technical.join(', ') || 'None'}`, `Soft Skills: ${skillGroups.soft.join(', ') || 'None'}`, `Tools & Technologies: ${skillGroups.tools.join(', ') || 'None'}`].join('\n')
      : 'Not provided',
  )

  sections.push('')
  sections.push('Links')
  sections.push([github ? `GitHub: ${github}` : '', linkedin ? `LinkedIn: ${linkedin}` : ''].filter(Boolean).join('\n') || 'Not provided')

  return sections.join('\n')
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

function TemplatePicker({ selectedTemplate, onChangeTemplate }) {
  return (
    <div className="template-picker" role="tablist" aria-label="Resume template selector">
      {templateOptions.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={selectedTemplate === option}
          className={`template-thumb ${selectedTemplate === option ? 'active' : ''}`}
          onClick={() => onChangeTemplate(option)}
        >
          <div className={`thumb-sketch thumb-${option.toLowerCase()}`}>
            <div className="sketch-head" />
            <div className="sketch-line" />
            <div className="sketch-line short" />
          </div>
          <span className="thumb-label">{option}</span>
          {selectedTemplate === option ? <span className="thumb-check">✓</span> : null}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({ selectedColor, onChangeColor }) {
  return (
    <div className="color-picker">
      {accentOptions.map((color) => (
        <button
          key={color.value}
          type="button"
          className={`color-swatch ${selectedColor === color.value ? 'active' : ''}`}
          style={{ backgroundColor: color.value }}
          onClick={() => onChangeColor(color.value)}
          aria-label={color.name}
          title={color.name}
        />
      ))}
    </div>
  )
}

function AtsScoreCircle({ result }) {
  const radius = 48
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const progress = (result.score / 100) * circumference

  return (
    <section className="ats-ring-card">
      <div className={`score-ring-wrap ${result.band}`}>
        <svg className="score-ring" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="ATS score">
          <circle cx="60" cy="60" r={radius} className="ring-track" strokeWidth={strokeWidth} fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="ring-progress"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>
        <div className="ring-score">{result.score}</div>
      </div>
      <div className="score-meta">
        <h3>ATS Resume Score</h3>
        <span className={`score-badge ${result.band}`}>{result.label}</span>
      </div>
      {result.suggestions.length ? (
        <ul className="ats-suggestions">
          {result.suggestions.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function DynamicSection({ title, items, onChange, onAdd, enableBulletGuidance = false }) {
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
          {enableBulletGuidance
            ? item.details
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, lineIndex) => {
                  const needsVerbSuggestion = !startsWithActionVerb(line)
                  const needsNumberSuggestion = !hasNumberInText(line)
                  if (!needsVerbSuggestion && !needsNumberSuggestion) return null

                  return (
                    <div key={`${title}-${index}-${lineIndex}`} className="inline-guidance">
                      {needsVerbSuggestion ? <p>Start with a strong action verb.</p> : null}
                      {needsNumberSuggestion ? <p>Add measurable impact (numbers).</p> : null}
                    </div>
                  )
                })
            : null}
        </div>
      ))}
      <button type="button" className="ghost-btn" onClick={onAdd}>
        Add {title} Entry
      </button>
    </section>
  )
}

function TagInput({ value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (rawTag) => {
    const tag = trimValue(rawTag)
    if (!tag) return
    if (value.some((item) => item.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
    setInputValue('')
  }

  return (
    <div className="tag-input-wrap">
      <div className="tag-list">
        {value.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
            <button type="button" className="chip-remove" onClick={() => onChange(value.filter((item) => item !== tag))}>
              x
            </button>
          </span>
        ))}
      </div>
      <input
        value={inputValue}
        placeholder={placeholder}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          addTag(inputValue)
        }}
      />
    </div>
  )
}

function SkillsAccordion({ skills, onChangeSkills }) {
  const [isSuggesting, setIsSuggesting] = useState(false)

  const updateCategory = (key, tags) => {
    onChangeSkills({ ...skills, [key]: tags })
  }

  const suggestSkills = async () => {
    setIsSuggesting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const addUnique = (existing, incoming) => {
      const lower = new Set(existing.map((item) => item.toLowerCase()))
      return [...existing, ...incoming.filter((item) => !lower.has(item.toLowerCase()))]
    }

    onChangeSkills({
      technical: addUnique(skills.technical, ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL']),
      soft: addUnique(skills.soft, ['Team Leadership', 'Problem Solving']),
      tools: addUnique(skills.tools, ['Git', 'Docker', 'AWS']),
    })

    setIsSuggesting(false)
  }

  return (
    <section className="form-section">
      <details open className="accordion-panel">
        <summary>Skills</summary>
        <div className="accordion-body">
          <div className="skill-group">
            <label>Technical Skills ({skills.technical.length})</label>
            <TagInput
              value={skills.technical}
              onChange={(tags) => updateCategory('technical', tags)}
              placeholder="Add technical skill and press Enter"
            />
          </div>
          <div className="skill-group">
            <label>Soft Skills ({skills.soft.length})</label>
            <TagInput value={skills.soft} onChange={(tags) => updateCategory('soft', tags)} placeholder="Add soft skill and press Enter" />
          </div>
          <div className="skill-group">
            <label>Tools & Technologies ({skills.tools.length})</label>
            <TagInput
              value={skills.tools}
              onChange={(tags) => updateCategory('tools', tags)}
              placeholder="Add tool and press Enter"
            />
          </div>
          <button type="button" className="ghost-btn" onClick={suggestSkills} disabled={isSuggesting}>
            {isSuggesting ? 'Suggesting...' : '✨ Suggest Skills'}
          </button>
        </div>
      </details>
    </section>
  )
}

function ProjectsAccordion({ projects, onAddProject, onDeleteProject, onUpdateProject }) {
  const [tagDrafts, setTagDrafts] = useState({})

  const setTagDraft = (index, value) => {
    setTagDrafts((prev) => ({ ...prev, [index]: value }))
  }

  const addTechTag = (index) => {
    const nextTag = trimValue(tagDrafts[index])
    if (!nextTag) return
    const existing = normalizeTagList(projects[index].techStack)
    if (existing.some((item) => item.toLowerCase() === nextTag.toLowerCase())) return
    onUpdateProject(index, 'techStack', [...existing, nextTag])
    setTagDraft(index, '')
  }

  return (
    <section className="form-section">
      <div className="accordion-head">
        <h3>Projects</h3>
        <button type="button" onClick={onAddProject}>
          Add Project
        </button>
      </div>
      {projects.map((project, index) => (
        <details key={`project-${index}`} open className="accordion-panel">
          <summary>{trimValue(project.title) || `Project ${index + 1}`}</summary>
          <div className="accordion-body">
            <input
              value={project.title}
              onChange={(event) => onUpdateProject(index, 'title', event.target.value)}
              placeholder="Project Title"
            />
            <textarea
              value={project.description}
              maxLength={200}
              onChange={(event) => onUpdateProject(index, 'description', event.target.value)}
              placeholder="Description (max 200 chars)"
            />
            <div className="text-counter">{project.description.length}/200</div>
            {project.description
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, lineIndex) => {
                const needsVerbSuggestion = !startsWithActionVerb(line)
                const needsNumberSuggestion = !hasNumberInText(line)
                if (!needsVerbSuggestion && !needsNumberSuggestion) return null

                return (
                  <div key={`project-guidance-${index}-${lineIndex}`} className="inline-guidance">
                    {needsVerbSuggestion ? <p>Start with a strong action verb.</p> : null}
                    {needsNumberSuggestion ? <p>Add measurable impact (numbers).</p> : null}
                  </div>
                )
              })}
            <label className="inline-label">Tech Stack</label>
            <div className="tag-input-wrap">
              <div className="tag-list">
                {normalizeTagList(project.techStack).map((tag) => (
                  <span key={`${index}-${tag}`} className="tag-chip">
                    {tag}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={() => onUpdateProject(index, 'techStack', normalizeTagList(project.techStack).filter((item) => item !== tag))}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagDrafts[index] || ''}
                placeholder="Add tech and press Enter"
                onChange={(event) => setTagDraft(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  addTechTag(index)
                }}
              />
            </div>
            <input
              value={project.liveUrl}
              onChange={(event) => onUpdateProject(index, 'liveUrl', event.target.value)}
              placeholder="Live URL (optional)"
            />
            <input
              value={project.githubUrl}
              onChange={(event) => onUpdateProject(index, 'githubUrl', event.target.value)}
              placeholder="GitHub URL (optional)"
            />
            <button type="button" className="danger-btn" onClick={() => onDeleteProject(index)}>
              Delete
            </button>
          </div>
        </details>
      ))}
    </section>
  )
}

function ResumeSections({ data, compact = false }) {
  const summary = trimValue(data.summary)
  const education = getFilledEntries(data.education)
  const experience = getFilledEntries(data.experience)
  const projects = getFilledProjects(data.projects)
  const skills = getSkillGroups(data.skills)
  const github = trimValue(data.links.github)
  const linkedin = trimValue(data.links.linkedin)

  return (
    <>
      {summary ? (
        <section className="resume-section-block">
          <h4>Summary</h4>
          <p>{summary}</p>
        </section>
      ) : null}

      {education.length ? (
        <section className="resume-section-block">
          <h4>Education</h4>
          {education.map((item, index) => (
            <article key={`edu-${index}`} className="resume-item">
              <h5>{item.title}</h5>
              <p>{item.subtitle}</p>
              <p>{item.dateRange}</p>
              <p>{item.details}</p>
            </article>
          ))}
        </section>
      ) : null}

      {experience.length ? (
        <section className="resume-section-block">
          <h4>Experience</h4>
          {experience.map((item, index) => (
            <article key={`exp-${index}`} className="resume-item">
              <h5>{item.title}</h5>
              <p>{item.subtitle}</p>
              <p>{item.dateRange}</p>
              <p>{item.details}</p>
            </article>
          ))}
        </section>
      ) : null}

      {projects.length ? (
        <section className="resume-section-block">
          <h4>Projects</h4>
          {projects.map((item, index) => (
            <article key={`pro-${index}`} className="resume-item project-card">
              <h5>{item.title}</h5>
              {trimValue(item.description) ? <p>{item.description}</p> : null}
              {normalizeTagList(item.techStack).length ? (
                <div className="tag-list preview-tags">
                  {normalizeTagList(item.techStack).map((tag) => (
                    <span key={`${item.title}-${tag}`} className="tag-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="project-links">
                {trimValue(item.liveUrl) ? (
                  <a href={item.liveUrl} target="_blank" rel="noreferrer">
                    ↗ Live
                  </a>
                ) : null}
                {trimValue(item.githubUrl) ? (
                  <a href={item.githubUrl} target="_blank" rel="noreferrer">
                    {'</>'} GitHub
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {[...skills.technical, ...skills.soft, ...skills.tools].length ? (
        <section className="resume-section-block">
          <h4>Skills</h4>
          {skills.technical.length ? (
            <div className="skills-group-preview">
              <h5>Technical Skills</h5>
              <div className="tag-list preview-tags">
                {skills.technical.map((tag) => (
                  <span key={`tech-${tag}`} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {skills.soft.length ? (
            <div className="skills-group-preview">
              <h5>Soft Skills</h5>
              <div className="tag-list preview-tags">
                {skills.soft.map((tag) => (
                  <span key={`soft-${tag}`} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {skills.tools.length ? (
            <div className="skills-group-preview">
              <h5>Tools & Technologies</h5>
              <div className="tag-list preview-tags">
                {skills.tools.map((tag) => (
                  <span key={`tool-${tag}`} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {!compact && (github || linkedin) ? (
        <section className="resume-section-block">
          <h4>Links</h4>
          {github ? <p>GitHub: {github}</p> : null}
          {linkedin ? <p>LinkedIn: {linkedin}</p> : null}
        </section>
      ) : null}
    </>
  )
}

function ResumePreview({ data, template, accentColor, view = 'builder' }) {
  const templateClass = `template-${template.toLowerCase()}`
  const containerClass = view === 'preview' ? 'mono-preview' : 'resume-preview-shell'
  const skills = getSkillGroups(data.skills)
  const github = trimValue(data.links.github)
  const linkedin = trimValue(data.links.linkedin)

  if (template === 'Modern') {
    return (
      <section className={`${containerClass} ${templateClass} resume-modern`} style={{ '--accent-color': accentColor }}>
        <aside className="modern-sidebar">
          <h2>{trimValue(data.personal.name) || 'Your Name'}</h2>
          <div className="modern-contact">
            <p>{trimValue(data.personal.email) || 'email@example.com'}</p>
            <p>{trimValue(data.personal.phone) || 'Phone'}</p>
            <p>{trimValue(data.personal.location) || 'Location'}</p>
          </div>
          {[...skills.technical, ...skills.soft, ...skills.tools].length ? (
            <section className="resume-section-block">
              <h4>Skills</h4>
              <div className="tag-list preview-tags">
                {[...skills.technical, ...skills.soft, ...skills.tools].map((tag) => (
                  <span key={`modern-${tag}`} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
          {github || linkedin ? (
            <section className="resume-section-block">
              <h4>Links</h4>
              {github ? <p>GitHub: {github}</p> : null}
              {linkedin ? <p>LinkedIn: {linkedin}</p> : null}
            </section>
          ) : null}
        </aside>
        <div className="modern-main">
          <ResumeSections data={data} compact />
        </div>
      </section>
    )
  }

  return (
    <section className={`${containerClass} ${templateClass}`} style={{ '--accent-color': accentColor }}>
      <header className="preview-head">
        <h2>{trimValue(data.personal.name) || 'Your Name'}</h2>
        <p>
          {trimValue(data.personal.email) || 'email@example.com'} | {trimValue(data.personal.phone) || '+1 000 000 0000'} |{' '}
          {trimValue(data.personal.location) || 'Location'}
        </p>
      </header>
      <ResumeSections data={data} />
    </section>
  )
}

function BuilderPage() {
  const [formData, setFormData] = useState(() => hydrateData(localStorage.getItem(storageKey)))
  const [selectedTemplate, setSelectedTemplate] = useState(() => getStoredTemplate())
  const [selectedAccentColor, setSelectedAccentColor] = useState(() => getStoredAccentColor())

  const saveDraft = (nextValue) => {
    setFormData(nextValue)
    localStorage.setItem(storageKey, JSON.stringify(nextValue))
  }

  const changeTemplate = (template) => {
    setSelectedTemplate(template)
    localStorage.setItem(templateStorageKey, template)
  }

  const changeAccentColor = (colorValue) => {
    setSelectedAccentColor(colorValue)
    localStorage.setItem(accentColorStorageKey, colorValue)
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

  const updateSkills = (nextSkills) => {
    saveDraft({ ...formData, skills: nextSkills })
  }

  const addProject = () => {
    saveDraft({ ...formData, projects: [...formData.projects, createBlankProject()] })
  }

  const deleteProject = (projectIndex) => {
    const nextProjects = formData.projects.filter((_, index) => index !== projectIndex)
    saveDraft({ ...formData, projects: nextProjects.length ? nextProjects : [createBlankProject()] })
  }

  const updateProject = (projectIndex, field, value) => {
    const nextProjects = [...formData.projects]
    nextProjects[projectIndex] = { ...nextProjects[projectIndex], [field]: value }
    saveDraft({ ...formData, projects: nextProjects })
  }

  const atsResult = useMemo(() => calculateAtsScore(formData), [formData])
  const topImprovements = useMemo(() => atsResult.suggestions.slice(0, 3), [atsResult])

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
            enableBulletGuidance
          />
          <ProjectsAccordion
            projects={formData.projects}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
            onUpdateProject={updateProject}
          />

          <SkillsAccordion skills={getSkillGroups(formData.skills)} onChangeSkills={updateSkills} />

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
          <TemplatePicker selectedTemplate={selectedTemplate} onChangeTemplate={changeTemplate} />
          <ColorPicker selectedColor={selectedAccentColor} onChangeColor={changeAccentColor} />
          <section className="ats-card">
            <div className="ats-head">
              <h3>ATS Readiness Score</h3>
              <span>{atsResult.score}/100</span>
            </div>
            <div className="meter-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={atsResult.score}>
              <div className="meter-fill" style={{ width: `${atsResult.score}%` }} />
            </div>
            {atsResult.suggestions.length ? (
              <ul className="ats-suggestions">
                {atsResult.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : (
              <p className="ats-good">Strong ATS baseline for v1.</p>
            )}
            <div className="improvements-panel">
              <h4>Top 3 Improvements</h4>
              {topImprovements.length ? (
                <ul className="ats-suggestions">
                  {topImprovements.map((improvement) => (
                    <li key={improvement}>{improvement}</li>
                  ))}
                </ul>
              ) : (
                <p className="ats-good">No critical improvements detected.</p>
              )}
            </div>
          </section>
          <ResumePreview data={formData} template={selectedTemplate} accentColor={selectedAccentColor} view="builder" />
        </aside>
      </div>
    </AppFrame>
  )
}

function PreviewPage() {
  const [dataRaw, setDataRaw] = useState(() => localStorage.getItem(storageKey) || '')
  const data = useMemo(() => hydrateData(dataRaw), [dataRaw])
  const [selectedTemplate, setSelectedTemplate] = useState(() => getStoredTemplate())
  const [selectedAccentColor, setSelectedAccentColor] = useState(() => getStoredAccentColor())
  const [exportWarning, setExportWarning] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const atsResult = useMemo(() => calculateAtsScore(data), [data])

  useEffect(() => {
    const syncData = () => {
      const latest = localStorage.getItem(storageKey) || ''
      setDataRaw((previous) => (previous === latest ? previous : latest))
    }

    window.addEventListener('storage', syncData)
    const intervalId = setInterval(syncData, 600)

    return () => {
      window.removeEventListener('storage', syncData)
      clearInterval(intervalId)
    }
  }, [])

  const changeTemplate = (template) => {
    setSelectedTemplate(template)
    localStorage.setItem(templateStorageKey, template)
  }
  const changeAccentColor = (colorValue) => {
    setSelectedAccentColor(colorValue)
    localStorage.setItem(accentColorStorageKey, colorValue)
  }

  const evaluateExportWarning = () => {
    if (hasMinimumExportData(data)) {
      setExportWarning('')
      return false
    }

    setExportWarning('Your resume may look incomplete.')
    return true
  }

  const handlePrint = () => {
    evaluateExportWarning()
    window.print()
  }

  const handleCopyText = async () => {
    evaluateExportWarning()
    const plainText = buildPlainTextResume(data)
    await navigator.clipboard.writeText(plainText)
  }

  const handleDownloadPdf = () => {
    evaluateExportWarning()
    setToastMessage('PDF export ready! Check your downloads.')
    setTimeout(() => setToastMessage(''), 2200)
  }

  return (
    <AppFrame>
      <TemplatePicker selectedTemplate={selectedTemplate} onChangeTemplate={changeTemplate} />
      <ColorPicker selectedColor={selectedAccentColor} onChangeColor={changeAccentColor} />
      <section className="preview-tools">
        <div className="tool-row">
          <button type="button" onClick={handlePrint}>
            Print / Save as PDF
          </button>
          <button type="button" onClick={handleDownloadPdf}>
            Download PDF
          </button>
          <button type="button" onClick={handleCopyText}>
            Copy Resume as Text
          </button>
        </div>
        {exportWarning ? <p className="export-warning">{exportWarning}</p> : null}
        {toastMessage ? <p className="toast-msg">{toastMessage}</p> : null}
      </section>
      <AtsScoreCircle result={atsResult} />
      <ResumePreview data={data} template={selectedTemplate} accentColor={selectedAccentColor} view="preview" />
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
