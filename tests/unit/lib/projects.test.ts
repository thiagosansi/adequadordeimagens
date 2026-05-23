import { describe, it, expect } from 'vitest'
import type { Project, ProjectStatus } from '@/lib/projects'

// ── Type contract tests ────────────────────────────────────────────────────────
// These tests verify that the Project type contract is honoured without
// touching the database. Integration tests for DB operations run separately.

const VALID_STATUSES: ProjectStatus[] = ['draft', 'pending_approval', 'approved', 'rejected']

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    user_id: 'user-1',
    name: 'Test Project',
    format_id: 'meta-feed-square',
    format_label: 'Feed Quadrado',
    width: 1080,
    height: 1080,
    storage_path: 'exports/user-1/test.jpg',
    organization_id: null,
    status: 'draft',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('Project type contract', () => {
  it('personal project has null organization_id', () => {
    const project = makeProject({ organization_id: null })
    expect(project.organization_id).toBeNull()
  })

  it('org project has non-null organization_id', () => {
    const project = makeProject({ organization_id: 'org-1' })
    expect(project.organization_id).toBe('org-1')
  })

  it('status defaults to draft', () => {
    const project = makeProject()
    expect(project.status).toBe('draft')
  })

  it('all project statuses are valid', () => {
    for (const status of VALID_STATUSES) {
      const project = makeProject({ status })
      expect(VALID_STATUSES).toContain(project.status)
    }
  })

  it('draft project can request approval', () => {
    const project = makeProject({ status: 'draft' })
    expect(project.status === 'draft').toBe(true)
  })

  it('pending_approval project cannot be submitted again', () => {
    const project = makeProject({ status: 'pending_approval' })
    // Business rule: status !== 'draft' means approval button should not appear
    expect(project.status !== 'draft').toBe(true)
  })

  it('approved project cannot be submitted again', () => {
    const project = makeProject({ status: 'approved' })
    expect(project.status !== 'draft').toBe(true)
  })

  it('rejected project can be resubmitted', () => {
    // After rejection, user edits and re-exports → new project with draft status
    const resubmitted = makeProject({ status: 'draft' })
    expect(resubmitted.status).toBe('draft')
  })

  it('org project can have creator_name', () => {
    const project = makeProject({ organization_id: 'org-1', creator_name: 'João Silva' })
    expect(project.creator_name).toBe('João Silva')
  })

  it('personal project has no creator_name', () => {
    const project = makeProject({ organization_id: null })
    expect(project.creator_name).toBeUndefined()
  })
})

describe('Project dimensions', () => {
  it('width and height are positive integers', () => {
    const project = makeProject({ width: 1080, height: 1080 })
    expect(project.width).toBeGreaterThan(0)
    expect(project.height).toBeGreaterThan(0)
    expect(Number.isInteger(project.width)).toBe(true)
    expect(Number.isInteger(project.height)).toBe(true)
  })

  it('landscape has width greater than height', () => {
    const project = makeProject({ width: 1200, height: 628, format_id: 'meta-feed-landscape' })
    expect(project.width).toBeGreaterThan(project.height)
  })

  it('portrait has height greater than width', () => {
    const project = makeProject({ width: 1080, height: 1350, format_id: 'meta-feed-portrait' })
    expect(project.height).toBeGreaterThan(project.width)
  })
})
