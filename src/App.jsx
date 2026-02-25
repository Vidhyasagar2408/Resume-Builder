import { useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'

const storageKey = 'resumeBuilderData'
const templateStorageKey = 'resumeBuilderTemplate'
const templateOptions = ['Classic', 'Modern', 'Minimal']
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

const getWordCount = (text) => trimValue(text).split(/\s+/).filter(Boolean).length

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

const isCompleteEntry = (entry) =>
  [entry.title, entry.subtitle, entry.dateRange, entry.details].every((value) => trimValue(value))

const getFilledEntries = (entries = []) => entries.filter(isFilledEntry)
const isFilledProject = (project) =>
  [project.title, project.description, project.liveUrl, project.githubUrl].some((value) => trimValue(value)) ||
  normalizeTagList(project.techStack).length > 0

const getFilledProjects = (projects = []) => projects.filter(isFilledProject)

const hasImpactNumbers = (entries) => {
  const numberPattern = /\b\d+(?:\.\d+)?\s*(?:%|x|k)?\b/i
  return entries.some((entry) =>
    numberPattern.test([entry.title, entry.subtitle, entry.details, entry.description, ...(entry.techStack || [])].join(' ')),
  )
}

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

const getAtsAssessment = (data) => {
  let score = 0
  const suggestions = []

  const summaryWords = getWordCount(data.summary)
  const projects = getFilledProjects(data.projects)
  const experience = getFilledEntries(data.experience)
  const education = getFilledEntries(data.education)
  const skills = getAllSkills(data.skills)
  const hasLink = Boolean(trimValue(data.links.github) || trimValue(data.links.linkedin))
  const impactPresent = hasImpactNumbers([...experience, ...projects])
  const completeEducation = education.some(isCompleteEntry)

  if (summaryWords >= 40 && summaryWords <= 120) score += 15
  else suggestions.push('Write a stronger summary (40-120 words).')

  if (projects.length >= 2) score += 10
  else suggestions.push('Add at least 2 projects.')

  if (experience.length >= 1) score += 10
  else suggestions.push('Add at least 1 experience entry.')

  if (skills.length >= 8) score += 10
  else suggestions.push('Add more skills (target 8+).')

  if (hasLink) score += 10
  else suggestions.push('Add a GitHub or LinkedIn link.')

  if (impactPresent) score += 15
  else suggestions.push('Add measurable impact (numbers) in bullets.')

  if (completeEducation) score += 10
  else suggestions.push('Complete education fields (title, institute, date range, details).')

  return { score: Math.min(score, 100), suggestions: suggestions.slice(0, 3) }
}

const getTopImprovements = (data) => {
  const improvements = []
  const projects = getFilledProjects(data.projects)
  const experience = getFilledEntries(data.experience)
  const summaryWords = getWordCount(data.summary)
  const skills = getAllSkills(data.skills)
  const impactPresent = hasImpactNumbers([...experience, ...projects])

  if (projects.length < 2) improvements.push('Add at least 2 projects.')
  if (!impactPresent) improvements.push('Add measurable impact (numbers) in bullets.')
  if (summaryWords < 40) improvements.push('Expand your summary to at least 40 words.')
  if (skills.length < 8) improvements.push('Add more skills (target 8+).')
  if (!experience.length) improvements.push('Add experience, internship, or project work.')

  return improvements.slice(0, 3)
}

const getStoredTemplate = () => {
  const value = localStorage.getItem(templateStorageKey)
  return templateOptions.includes(value) ? value : 'Classic'
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

function TemplateTabs({ selectedTemplate, onChangeTemplate }) {
  return (
    <div className="template-tabs" role="tablist" aria-label="Resume template selector">
      {templateOptions.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={selectedTemplate === option}
          className={`template-tab ${selectedTemplate === option ? 'active' : ''}`}
          onClick={() => onChangeTemplate(option)}
        >
          {option}
        </button>
      ))}
    </div>
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

function RenderResumeSections({ data, mode = 'builder' }) {
  const summary = trimValue(data.summary)
  const education = getFilledEntries(data.education)
  const experience = getFilledEntries(data.experience)
  const projects = getFilledProjects(data.projects)
  const skills = getSkillGroups(data.skills)
  const github = trimValue(data.links.github)
  const linkedin = trimValue(data.links.linkedin)

  const sectionClass = mode === 'preview' ? 'mono-section' : 'preview-block'
  const headingClass = mode === 'preview' ? 'mono-section-title' : ''

  return (
    <>
      {summary ? (
        <section className={sectionClass}>
          <h4 className={headingClass}>Summary</h4>
          <p>{summary}</p>
        </section>
      ) : null}

      {education.length ? (
        <section className={sectionClass}>
          <h4 className={headingClass}>Education</h4>
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
        <section className={sectionClass}>
          <h4 className={headingClass}>Experience</h4>
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
        <section className={sectionClass}>
          <h4 className={headingClass}>Projects</h4>
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
                    {"</>"} GitHub
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {[...skills.technical, ...skills.soft, ...skills.tools].length ? (
        <section className={sectionClass}>
          <h4 className={headingClass}>Skills</h4>
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

      {github || linkedin ? (
        <section className={sectionClass}>
          <h4 className={headingClass}>Links</h4>
          {github ? <p>GitHub: {github}</p> : null}
          {linkedin ? <p>LinkedIn: {linkedin}</p> : null}
        </section>
      ) : null}
    </>
  )
}

function PreviewShell({ data, template }) {
  const templateClass = `template-${template.toLowerCase()}`

  return (
    <section className={`resume-preview-shell ${templateClass}`}>
      <div className="preview-head">
        <h2>{trimValue(data.personal.name) || 'Your Name'}</h2>
        <p>
          {trimValue(data.personal.email) || 'email@example.com'} | {trimValue(data.personal.phone) || '+1 000 000 0000'}
          {' | '}
          {trimValue(data.personal.location) || 'Location'}
        </p>
      </div>
      <RenderResumeSections data={data} mode="builder" />
    </section>
  )
}

function BuilderPage() {
  const [formData, setFormData] = useState(() => hydrateData(localStorage.getItem(storageKey)))
  const [selectedTemplate, setSelectedTemplate] = useState(() => getStoredTemplate())

  const saveDraft = (nextValue) => {
    setFormData(nextValue)
    localStorage.setItem(storageKey, JSON.stringify(nextValue))
  }

  const changeTemplate = (template) => {
    setSelectedTemplate(template)
    localStorage.setItem(templateStorageKey, template)
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

  const ats = useMemo(() => getAtsAssessment(formData), [formData])
  const topImprovements = useMemo(() => getTopImprovements(formData), [formData])

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
          <TemplateTabs selectedTemplate={selectedTemplate} onChangeTemplate={changeTemplate} />
          <section className="ats-card">
            <div className="ats-head">
              <h3>ATS Readiness Score</h3>
              <span>{ats.score}/100</span>
            </div>
            <div className="meter-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ats.score}>
              <div className="meter-fill" style={{ width: `${ats.score}%` }} />
            </div>
            {ats.suggestions.length ? (
              <ul className="ats-suggestions">
                {ats.suggestions.map((suggestion) => (
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
          <PreviewShell data={formData} template={selectedTemplate} />
        </aside>
      </div>
    </AppFrame>
  )
}

function PreviewPage() {
  const data = useMemo(() => hydrateData(localStorage.getItem(storageKey)), [])
  const [selectedTemplate, setSelectedTemplate] = useState(() => getStoredTemplate())
  const [exportWarning, setExportWarning] = useState('')

  const changeTemplate = (template) => {
    setSelectedTemplate(template)
    localStorage.setItem(templateStorageKey, template)
  }
  const monoTemplateClass = `template-${selectedTemplate.toLowerCase()}`

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

  return (
    <AppFrame>
      <TemplateTabs selectedTemplate={selectedTemplate} onChangeTemplate={changeTemplate} />
      <section className="preview-tools">
        <div className="tool-row">
          <button type="button" onClick={handlePrint}>
            Print / Save as PDF
          </button>
          <button type="button" onClick={handleCopyText}>
            Copy Resume as Text
          </button>
        </div>
        {exportWarning ? <p className="export-warning">{exportWarning}</p> : null}
      </section>
      <section className={`mono-preview ${monoTemplateClass}`}>
        <header>
          <h1>{trimValue(data.personal.name) || 'Your Name'}</h1>
          <p>
            {trimValue(data.personal.email) || 'email@example.com'} | {trimValue(data.personal.phone) || 'Phone'} |{' '}
            {trimValue(data.personal.location) || 'Location'}
          </p>
        </header>
        <RenderResumeSections data={data} mode="preview" />
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
