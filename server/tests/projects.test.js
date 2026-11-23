const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const { createApp } = require('../app');
const db = require('../db');
const authRoute = require('../routes/auth');

let server;
let baseUrl;
let state;

function createFakePool() {
  state = { projects: [], audit: [] };
  let idCounter = 1;
  function makeId() { return `00000000-0000-4000-8000-${String(idCounter++).padStart(12, '0')}`; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function parseJson(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return JSON.parse(value);
    return value;
  }

  const pool = {
    async query(sql, params = []) {
      const normalized = sql.replace(/\s+/g, ' ').trim();

      if (/^INSERT INTO projects/i.test(normalized)) {
        const project = {
          id: makeId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          title: params[0],
          slug: params[1],
          tagline: params[2],
          problem_solved: params[3],
          solution_summary: params[4],
          highlights: parseJson(params[5]) || [],
          tech_stack: parseJson(params[6]) || [],
          category: params[7],
          cover_image: params[8],
          gallery_images: parseJson(params[9]) || [],
          live_url: params[10],
          repo_url: params[11],
          github_repo_id: params[12],
          is_published: params[13],
          is_featured: params[14],
          display_order: params[15],
        };
        state.projects.push(project);
        return { rows: [clone(project)] };
      }

      if (/^SELECT \* FROM projects WHERE slug = \$1 AND is_published = TRUE/i.test(normalized)) {
        const project = state.projects.find((item) => item.slug === params[0] && item.is_published === true);
        return { rows: project ? [clone(project)] : [] };
      }

      if (/^SELECT \* FROM projects WHERE is_published = TRUE/i.test(normalized)) {
        const rows = state.projects
          .filter((item) => item.is_published === true)
          .sort((a, b) => a.display_order - b.display_order || String(b.created_at).localeCompare(String(a.created_at)));
        return { rows: rows.map(clone) };
      }

      if (/^SELECT \* FROM projects WHERE github_repo_id = \$1 OR repo_url = \$2/i.test(normalized)) {
        const project = state.projects.find((item) => item.github_repo_id === params[0] || item.repo_url === params[1]);
        return { rows: project ? [clone(project)] : [] };
      }

      if (/^SELECT \* FROM projects WHERE id = \$1$/i.test(normalized)) {
        const project = state.projects.find((item) => item.id === params[0]);
        return { rows: project ? [clone(project)] : [] };
      }

      if (/^SELECT \* FROM projects ORDER BY/i.test(normalized)) {
        const rows = [...state.projects].sort((a, b) => a.display_order - b.display_order || String(b.created_at).localeCompare(String(a.created_at)));
        return { rows: rows.map(clone) };
      }

      if (/^UPDATE projects SET/i.test(normalized)) {
        const project = state.projects.find((item) => item.id === params[0]);
        if (!project) return { rows: [] };
        const assignments = [...normalized.matchAll(/([a-z_]+) = \$(\d+)/gi)];
        for (const match of assignments) {
          const column = match[1];
          const value = params[Number(match[2]) - 1];
          if (column === 'highlights' || column === 'tech_stack' || column === 'gallery_images') {
            project[column] = value === null ? [] : JSON.parse(value);
          } else if (column === 'is_published' || column === 'is_featured') {
            project[column] = value === true;
          } else if (column === 'display_order') {
            project[column] = Number(value);
          } else if (column !== 'updated_at') {
            project[column] = value;
          }
        }
        project.updated_at = new Date().toISOString();
        return { rows: [clone(project)] };
      }

      if (/^DELETE FROM projects WHERE id = \$1/i.test(normalized)) {
        const index = state.projects.findIndex((item) => item.id === params[0]);
        if (index === -1) return { rows: [] };
        const [deleted] = state.projects.splice(index, 1);
        return { rows: [clone(deleted)] };
      }

      if (/^INSERT INTO admin_audit_log/i.test(normalized)) {
        state.audit.push({ params: [...params] });
        return { rows: [] };
      }

      return { rows: [] };
    },
  };

  return pool;
}

async function startServer() {
  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
    server.on('error', reject);
  });
}

async function stopServer() {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
  server = null;
}

function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function login() {
  const res = await request('/admin/login', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  });
  const body = await res.json();
  const cookie = res.headers.get('set-cookie').split(';')[0];
  return { cookie, csrfToken: body.csrfToken };
}

test.beforeEach(async () => {
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('test-password', 10);
  process.env.SESSION_SECRET = 'test-session-secret';
  process.env.GITHUB_TOKEN = 'test-github-token';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  const pool = createFakePool();
  db.getPool = () => pool;
  axios.create = () => ({
    get: async (url) => {
      if (url === '/user/repos') {
        return {
          data: [
            { id: 101, name: 'alpha', description: 'Alpha repo', html_url: 'https://github.com/pantane1/alpha', homepage: 'https://alpha.example', language: 'TypeScript', topics: ['react'], updated_at: '2026-01-01T00:00:00Z', fork: false, private: false },
            { id: 102, name: 'beta', description: 'Beta repo', html_url: 'https://github.com/pantane1/beta', homepage: '', language: 'JavaScript', topics: ['node'], updated_at: '2026-01-02T00:00:00Z', fork: true, private: false },
          ],
        };
      }
      if (url === '/repositories/101') {
        return {
          data: { id: 101, name: 'alpha', description: 'Alpha repo', html_url: 'https://github.com/pantane1/alpha', homepage: 'https://alpha.example', language: 'TypeScript', topics: ['react'], owner: { login: 'Pantane1' }, fork: false },
        };
      }
      if (url.startsWith('/repos/Pantane1/pantane-hub/contents/')) {
        const error = new Error('Not found');
        error.response = { status: 404 };
        throw error;
      }
      throw new Error(`Unexpected GitHub URL: ${url}`);
    },
    put: async () => ({ data: { content: { path: 'public/uploads/projects/alpha/cover.png' } } }),
  });
  authRoute.resetLoginRateLimit();
  await startServer();
});

test.afterEach(async () => {
  await stopServer();
  delete process.env.ADMIN_PASSWORD_HASH;
  delete process.env.SESSION_SECRET;
  delete process.env.GITHUB_TOKEN;
  delete process.env.DATABASE_URL;
});

test('public project list returns only published projects in display order', async () => {
  state.projects.push({
    id: '11111111-1111-4111-8111-111111111111',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'Draft Project',
    slug: 'draft-project',
    tagline: 'Draft',
    problem_solved: '',
    solution_summary: '',
    highlights: [],
    tech_stack: [],
    category: 'Software',
    cover_image: '',
    gallery_images: [],
    live_url: '',
    repo_url: '',
    github_repo_id: null,
    is_published: false,
    is_featured: false,
    display_order: 1,
  });
  state.projects.push({
    id: '22222222-2222-4222-8222-222222222222',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'Published Project',
    slug: 'published-project',
    tagline: 'Published',
    problem_solved: '',
    solution_summary: '',
    highlights: [],
    tech_stack: ['React'],
    category: 'Web',
    cover_image: 'https://example.com/cover.png',
    gallery_images: [],
    live_url: '',
    repo_url: '',
    github_repo_id: null,
    is_published: true,
    is_featured: true,
    display_order: 2,
  });

  const res = await request('/projects');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.projects.length, 1);
  assert.equal(body.projects[0].slug, 'published-project');
  assert.equal(body.projects[0].isPublished, true);
});

test('public project detail returns a published project', async () => {
  state.projects.push({
    id: '33333333-3333-4333-8333-333333333333',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: 'Detail Project',
    slug: 'detail-project',
    tagline: 'Detail',
    problem_solved: '',
    solution_summary: '',
    highlights: [],
    tech_stack: [],
    category: 'Software',
    cover_image: '',
    gallery_images: [],
    live_url: '',
    repo_url: '',
    github_repo_id: null,
    is_published: true,
    is_featured: false,
    display_order: 0,
  });

  const res = await request('/projects/detail-project');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.project.slug, 'detail-project');
});

test('admin can create, update and delete a project', async () => {
  const { cookie, csrfToken } = await login();

  const create = await request('/admin/projects', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ title: 'New Project', slug: 'new-project', tagline: 'Tagline', isPublished: false }),
  });
  assert.equal(create.status, 201);
  const created = await create.json();
  assert.equal(created.project.slug, 'new-project');

  const update = await request(`/admin/projects/${created.project.id}`, {
    method: 'PATCH',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ title: 'Updated Project', isPublished: true, coverImage: 'https://example.com/cover.png', tagline: 'Updated' }),
  });
  assert.equal(update.status, 200);
  const updated = await update.json();
  assert.equal(updated.project.title, 'Updated Project');
  assert.equal(updated.project.isPublished, true);

  const remove = await request(`/admin/projects/${created.project.id}`, {
    method: 'DELETE',
    headers: { 'Origin': 'http://me.localhost:5173',  Cookie: cookie, 'X-CSRF-Token': csrfToken },
  });
  assert.equal(remove.status, 200);
  assert.equal(state.projects.length, 0);
});

test('GitHub import creates a draft and prevents duplicates', async () => {
  const { cookie, csrfToken } = await login();

  const first = await request('/admin/projects/import/github', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ githubRepoId: 101 }),
  });
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.equal(firstBody.project.isPublished, false);
  assert.equal(firstBody.project.repoUrl, 'https://github.com/pantane1/alpha');

  const second = await request('/admin/projects/import/github', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ githubRepoId: 101 }),
  });
  assert.equal(second.status, 200);
  const secondBody = await second.json();
  assert.equal(secondBody.alreadyImported, true);
  assert.equal(state.projects.length, 1);
});

test('project image upload commits a GitHub asset and returns a public URL', async () => {
  const { cookie, csrfToken } = await login();

  const res = await request('/admin/projects/assets', {
    method: 'POST',
    headers: { 'Origin': 'http://me.localhost:5173',  'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ slug: 'alpha-project', filename: 'cover.png', contentType: 'image/png', data: Buffer.from('fake-image').toString('base64') }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.url, /^\/uploads\/projects\/alpha-project\/.+\.png$/);
});

test('unauthorized project administration is rejected', async () => {
  const res = await request('/admin/projects');
  assert.equal(res.status, 401);
});