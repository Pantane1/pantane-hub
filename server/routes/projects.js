const express = require('express');
const axios = require('axios');
const { requireAdmin, requireCsrf } = require('../middleware/adminAuth');
const db = require('../db');
const { recordAdminAction } = require('../lib/auditLog');

const publicRouter = express.Router();
const adminRouter = express.Router();

const GITHUB_OWNER = 'Pantane1';
const GITHUB_REPO = 'pantane-hub';
const GITHUB_BRANCH = 'main';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Project storage is not configured.' });
}

function githubApi() {
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    timeout: 15000,
  });
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function isSafeImageUrl(value) {
  if (typeof value !== 'string' || !value) return true;
  if (value.startsWith('/uploads/projects/')) return true;
  return isHttpUrl(value);
}

function toStringArray(value) {
  if (!Array.isArray(value)) return null;
  const result = value.map((item) => (typeof item === 'string' ? item.trim() : null));
  if (result.some((item) => item === null)) return null;
  return result.filter(Boolean);
}

function toGalleryArray(value) {
  if (!Array.isArray(value)) return null;
  const result = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    if (typeof item.url !== 'string' || !isSafeImageUrl(item.url)) return null;
    result.push({
      url: item.url,
      alt: typeof item.alt === 'string' ? item.alt.trim() : '',
    });
  }
  return result;
}

function validateProject(input, options = {}) {
  const existing = options.existing || {};
  const errors = {};
  const project = {};

  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      errors.title = 'Title is required.';
    } else {
      project.title = input.title.trim().slice(0, 200);
    }
  }

  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string' || !SLUG_RE.test(input.slug.trim())) {
      errors.slug = 'Slug must use lowercase letters, numbers, and hyphens.';
    } else {
      project.slug = input.slug.trim();
    }
  }

  if (input.tagline !== undefined) {
    if (typeof input.tagline !== 'string') errors.tagline = 'Tagline must be text.';
    else project.tagline = input.tagline.trim().slice(0, 300);
  }

  if (input.problemSolved !== undefined) {
    if (typeof input.problemSolved !== 'string') errors.problemSolved = 'Problem summary must be text.';
    else project.problem_solved = input.problemSolved.trim().slice(0, 5000);
  }

  if (input.solutionSummary !== undefined) {
    if (typeof input.solutionSummary !== 'string') errors.solutionSummary = 'Solution summary must be text.';
    else project.solution_summary = input.solutionSummary.trim().slice(0, 5000);
  }

  if (input.highlights !== undefined) {
    const highlights = toStringArray(input.highlights);
    if (!highlights) errors.highlights = 'Highlights must be an array of text.';
    else project.highlights = highlights.slice(0, 30);
  }

  if (input.techStack !== undefined) {
    const techStack = toStringArray(input.techStack);
    if (!techStack) errors.techStack = 'Tech stack must be an array of text.';
    else project.tech_stack = techStack.slice(0, 40);
  }

  if (input.category !== undefined) {
    if (typeof input.category !== 'string') errors.category = 'Category must be text.';
    else project.category = input.category.trim().slice(0, 100);
  }

  if (input.coverImage !== undefined) {
    if (typeof input.coverImage !== 'string' || !isSafeImageUrl(input.coverImage)) {
      errors.coverImage = 'Cover image must be a valid URL or uploaded project path.';
    } else {
      project.cover_image = input.coverImage.trim() || null;
    }
  }

  if (input.galleryImages !== undefined) {
    const galleryImages = toGalleryArray(input.galleryImages);
    if (!galleryImages) errors.galleryImages = 'Gallery images must be an array of valid image URLs.';
    else project.gallery_images = galleryImages.slice(0, 20);
  }

  if (input.liveUrl !== undefined) {
    if (!isHttpUrl(input.liveUrl)) errors.liveUrl = 'Live URL must be a valid http or https URL.';
    else project.live_url = input.liveUrl.trim() || null;
  }

  if (input.repoUrl !== undefined) {
    if (!isHttpUrl(input.repoUrl)) errors.repoUrl = 'Repository URL must be a valid http or https URL.';
    else project.repo_url = input.repoUrl.trim() || null;
  }

  if (input.githubRepoId !== undefined) {
    if (input.githubRepoId !== null && !Number.isInteger(input.githubRepoId)) {
      errors.githubRepoId = 'GitHub repository ID must be an integer.';
    } else {
      project.github_repo_id = input.githubRepoId;
    }
  }

  if (input.isPublished !== undefined) {
    if (typeof input.isPublished !== 'boolean') errors.isPublished = 'Published flag must be true or false.';
    else project.is_published = input.isPublished;
  }

  if (input.isFeatured !== undefined) {
    if (typeof input.isFeatured !== 'boolean') errors.isFeatured = 'Featured flag must be true or false.';
    else project.is_featured = input.isFeatured;
  }

  if (input.displayOrder !== undefined) {
    const displayOrder = Number(input.displayOrder);
    if (!Number.isInteger(displayOrder)) errors.displayOrder = 'Display order must be an integer.';
    else project.display_order = displayOrder;
  }

  const publishing = options.publishing || project.is_published === true;
  if (publishing) {
    const title = project.title || existing.title;
    const slug = project.slug || existing.slug;
    const coverImage = project.cover_image || (typeof input.coverImage === 'string' ? input.coverImage.trim() : existing.cover_image);
    const hasSummary = (project.tagline || (typeof input.tagline === 'string' ? input.tagline.trim() : existing.tagline)) ||
      (project.problem_solved || (typeof input.problemSolved === 'string' ? input.problemSolved.trim() : existing.problem_solved)) ||
      (project.solution_summary || (typeof input.solutionSummary === 'string' ? input.solutionSummary.trim() : existing.solution_summary));

    if (!title) errors.title = errors.title || 'Title is required.';
    if (!slug) errors.slug = errors.slug || 'Slug is required.';
    if (!coverImage) errors.coverImage = errors.coverImage || 'Cover image is required for published projects.';
    if (!hasSummary) errors.tagline = 'A tagline or project summary is required for published projects.';
  }

  return { errors, project };
}

function toProject(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    tagline: row.tagline || '',
    problemSolved: row.problem_solved || '',
    solutionSummary: row.solution_summary || '',
    highlights: row.highlights || [],
    techStack: row.tech_stack || [],
    category: row.category || '',
    coverImage: row.cover_image || '',
    galleryImages: row.gallery_images || [],
    liveUrl: row.live_url || '',
    repoUrl: row.repo_url || '',
    githubRepoId: row.github_repo_id,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function dbUnavailable(res) {
  return res.status(503).json({ error: 'Project storage is not configured.' });
}

// Public routes
publicRouter.get('/', async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const featured = req.query.featured === 'true';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const conditions = ['is_published = TRUE'];
  const params = [];

  if (featured) {
    conditions.push('is_featured = TRUE');
  }
  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM projects WHERE ${conditions.join(' AND ')} ORDER BY display_order ASC, created_at DESC`,
      params
    );
    return res.json({ projects: result.rows.map(toProject) });
  } catch (error) {
    console.error('Project list failed:', error.message);
    return res.status(500).json({ error: 'Failed to load projects.' });
  }
});

publicRouter.get('/:slug', async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const result = await pool.query('SELECT * FROM projects WHERE slug = $1 AND is_published = TRUE', [req.params.slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    return res.json({ project: toProject(result.rows[0]) });
  } catch (error) {
    console.error('Project detail failed:', error.message);
    return res.status(500).json({ error: 'Failed to load project.' });
  }
});

// Admin routes
adminRouter.get('/projects', requireAdmin, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY display_order ASC, created_at DESC');
    return res.json({ projects: result.rows.map(toProject) });
  } catch (error) {
    console.error('Admin project list failed:', error.message);
    return res.status(500).json({ error: 'Failed to load projects.' });
  }
});

adminRouter.get('/github/repos', requireAdmin, async (req, res) => {
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: 'GitHub integration is not configured.' });
  }

  const includeForks = req.query.includeForks === 'true';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  try {
    const repos = [];
    for (let page = 1; page <= 3; page += 1) {
      const { data } = await githubApi().get('/user/repos', {
        params: {
          per_page: 100,
          page,
          sort: 'updated',
          affiliation: 'owner',
        },
      });
      repos.push(...data);
      if (data.length < 100) break;
    }

    const filtered = repos
      .filter((repo) => includeForks || !repo.fork)
      .filter((repo) => {
        if (!search) return true;
        return [repo.name, repo.description, repo.language, ...(repo.topics || [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        htmlUrl: repo.html_url,
        homepage: repo.homepage || '',
        language: repo.language || '',
        topics: repo.topics || [],
        updatedAt: repo.updated_at,
        fork: Boolean(repo.fork),
        private: Boolean(repo.private),
      }));

    return res.json({ repositories: filtered });
  } catch (error) {
    console.error('GitHub repository import list failed:', error?.response?.data || error.message);
    return res.status(502).json({ error: 'Failed to load GitHub repositories.' });
  }
});

adminRouter.post('/projects/import/github', requireAdmin, requireCsrf, async (req, res) => {
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: 'GitHub integration is not configured.' });
  }

  const githubRepoId = Number(req.body?.githubRepoId);
  if (!Number.isInteger(githubRepoId) || githubRepoId <= 0) {
    return res.status(400).json({ error: 'A valid GitHub repository ID is required.' });
  }

  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  try {
    const { data: repo } = await githubApi().get(`/repositories/${githubRepoId}`);
    if (!repo || repo.owner?.login?.toLowerCase() !== GITHUB_OWNER.toLowerCase()) {
      return res.status(400).json({ error: 'Only repositories owned by Pantane1 can be imported.' });
    }

    const existing = await pool.query('SELECT * FROM projects WHERE github_repo_id = $1 OR repo_url = $2', [repo.id, repo.html_url]);
    if (existing.rows[0]) {
      return res.status(200).json({ project: toProject(existing.rows[0]), imported: true, alreadyImported: true });
    }

    const slug = slugify(repo.name);
    const techStack = [repo.language, ...(repo.topics || [])].filter(Boolean);
    const project = {
      title: repo.name,
      slug,
      tagline: repo.description || '',
      problemSolved: '',
      solutionSummary: repo.description || '',
      highlights: [],
      techStack,
      category: 'Software',
      coverImage: '',
      galleryImages: [],
      liveUrl: repo.homepage || '',
      repoUrl: repo.html_url,
      githubRepoId: repo.id,
      isPublished: false,
      isFeatured: false,
      displayOrder: 0,
    };

    const { errors, project: validated } = validateProject(project, { publishing: false });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Imported repository could not be converted to a project.', errors });
    }

    const result = await pool.query(
      `INSERT INTO projects
        (title, slug, tagline, problem_solved, solution_summary, highlights, tech_stack, category, cover_image, gallery_images, live_url, repo_url, github_repo_id, is_published, is_featured, display_order)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        validated.title,
        validated.slug,
        validated.tagline || null,
        validated.problem_solved || null,
        validated.solution_summary || null,
        JSON.stringify(validated.highlights || []),
        JSON.stringify(validated.tech_stack || []),
        validated.category || null,
        validated.cover_image || null,
        JSON.stringify(validated.gallery_images || []),
        validated.live_url || null,
        validated.repo_url || null,
        validated.github_repo_id,
        false,
        false,
        validated.display_order || 0,
      ]
    );

    await recordAdminAction({
      action: 'project.imported',
      targetType: 'project',
      targetId: result.rows[0].id,
      metadata: { githubRepoId: repo.id, slug: result.rows[0].slug },
      ipAddress: req.ip,
    });

    return res.status(201).json({ project: toProject(result.rows[0]), imported: true });
  } catch (error) {
    console.error('GitHub project import failed:', error?.response?.data || error.message);
    if (error?.response?.status === 404) {
      return res.status(404).json({ error: 'GitHub repository not found.' });
    }
    if (error?.response?.status === 409) {
      return res.status(409).json({ error: 'This repository has already been imported.' });
    }
    return res.status(502).json({ error: 'Failed to import GitHub repository.' });
  }
});

adminRouter.post('/projects/assets', requireAdmin, requireCsrf, async (req, res) => {
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: 'GitHub integration is not configured.' });
  }

  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const { slug, filename, contentType, data } = req.body || {};
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'A valid project slug is required before uploading images.' });
  }
  if (typeof data !== 'string' || !data) {
    return res.status(400).json({ error: 'Image data is required.' });
  }

  const allowedType = IMAGE_TYPES[contentType];
  let base64 = data;
  const dataUrlMatch = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    if (!IMAGE_TYPES[dataUrlMatch[1]]) {
      return res.status(400).json({ error: 'Only PNG, JPEG, and WebP images are supported.' });
    }
    base64 = dataUrlMatch[2];
  } else if (!allowedType) {
    return res.status(400).json({ error: 'Content type must be image/png, image/jpeg, or image/webp.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch (error) {
    return res.status(400).json({ error: 'Invalid image data.' });
  }
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: 'Image must be between 1 byte and 5 MB.' });
  }

  const extension = IMAGE_TYPES[dataUrlMatch ? dataUrlMatch[1] : contentType];
  const safeBase = typeof filename === 'string'
    ? filename.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 80)
    : 'image';
  const storedName = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeBase ? `-${safeBase}` : ''}.${extension}`;
  const filePath = `public/uploads/projects/${slug}/${storedName}`;
  const encodedPath = filePath.split('/').map((part) => encodeURIComponent(part)).join('/');

  try {
    let sha;
    try {
      const existing = await githubApi().get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${GITHUB_BRANCH}`);
      sha = existing.data.sha;
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
    }

    await githubApi().put(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`, {
      message: `Add project image: ${slug}/${storedName}`,
      content: buffer.toString('base64'),
      branch: GITHUB_BRANCH,
      sha,
    });

    const publicUrl = `/uploads/projects/${slug}/${storedName}`;
    return res.status(201).json({ url: publicUrl });
  } catch (error) {
    console.error('Project asset upload failed:', error?.response?.data || error.message);
    return res.status(502).json({ error: 'Failed to upload project image.' });
  }
});

adminRouter.post('/projects', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const { errors, project } = validateProject(req.body || {}, { publishing: req.body?.isPublished === true });
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Invalid project.', errors });
  }

  if (!project.title || !project.slug) {
    return res.status(400).json({ error: 'Title and slug are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO projects
        (title, slug, tagline, problem_solved, solution_summary, highlights, tech_stack, category, cover_image, gallery_images, live_url, repo_url, github_repo_id, is_published, is_featured, display_order)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        project.title,
        project.slug,
        project.tagline || null,
        project.problem_solved || null,
        project.solution_summary || null,
        JSON.stringify(project.highlights || []),
        JSON.stringify(project.tech_stack || []),
        project.category || null,
        project.cover_image || null,
        JSON.stringify(project.gallery_images || []),
        project.live_url || null,
        project.repo_url || null,
        project.github_repo_id || null,
        Boolean(project.is_published),
        Boolean(project.is_featured),
        project.display_order || 0,
      ]
    );

    await recordAdminAction({
      action: 'project.created',
      targetType: 'project',
      targetId: result.rows[0].id,
      metadata: { slug: result.rows[0].slug, published: result.rows[0].is_published },
      ipAddress: req.ip,
    });

    return res.status(201).json({ project: toProject(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A project with this slug or GitHub repository already exists.' });
    }
    console.error('Project creation failed:', error.message);
    return res.status(500).json({ error: 'Failed to create project.' });
  }
});

adminRouter.patch('/projects/:id', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project ID.' });
  }

  const existingResult = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
  if (existingResult.rows.length === 0) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { errors, project } = validateProject(req.body || {}, { publishing: req.body?.isPublished === true, existing: existingResult.rows[0] });
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Invalid project.', errors });
  }

  const updates = [];
  const params = [req.params.id];

  const addUpdate = (column, value) => {
    params.push(value);
    updates.push(`${column} = $${params.length}`);
  };

  if (project.title !== undefined) addUpdate('title', project.title);
  if (project.slug !== undefined) addUpdate('slug', project.slug);
  if (project.tagline !== undefined) addUpdate('tagline', project.tagline || null);
  if (project.problem_solved !== undefined) addUpdate('problem_solved', project.problem_solved || null);
  if (project.solution_summary !== undefined) addUpdate('solution_summary', project.solution_summary || null);
  if (project.highlights !== undefined) addUpdate('highlights', JSON.stringify(project.highlights));
  if (project.tech_stack !== undefined) addUpdate('tech_stack', JSON.stringify(project.tech_stack));
  if (project.category !== undefined) addUpdate('category', project.category || null);
  if (project.cover_image !== undefined) addUpdate('cover_image', project.cover_image || null);
  if (project.gallery_images !== undefined) addUpdate('gallery_images', JSON.stringify(project.gallery_images));
  if (project.live_url !== undefined) addUpdate('live_url', project.live_url || null);
  if (project.repo_url !== undefined) addUpdate('repo_url', project.repo_url || null);
  if (project.github_repo_id !== undefined) addUpdate('github_repo_id', project.github_repo_id);
  if (project.is_published !== undefined) addUpdate('is_published', project.is_published);
  if (project.is_featured !== undefined) addUpdate('is_featured', project.is_featured);
  if (project.display_order !== undefined) addUpdate('display_order', project.display_order);

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No project updates provided.' });
  }

  updates.push('updated_at = NOW()');

  try {
    const result = await pool.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    await recordAdminAction({
      action: 'project.updated',
      targetType: 'project',
      targetId: result.rows[0].id,
      metadata: { slug: result.rows[0].slug, published: result.rows[0].is_published, featured: result.rows[0].is_featured },
      ipAddress: req.ip,
    });

    return res.json({ project: toProject(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A project with this slug or GitHub repository already exists.' });
    }
    console.error('Project update failed:', error.message);
    return res.status(500).json({ error: 'Failed to update project.' });
  }
});

adminRouter.post('/projects/reorder', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  const projects = req.body?.projects;
  if (!Array.isArray(projects) || projects.length === 0) {
    return res.status(400).json({ error: 'A non-empty projects array is required.' });
  }

  try {
    for (const item of projects) {
      if (!item || !UUID_RE.test(item.id) || !Number.isInteger(item.displayOrder)) {
        return res.status(400).json({ error: 'Each reorder item requires a valid ID and integer displayOrder.' });
      }
      await pool.query('UPDATE projects SET display_order = $2, updated_at = NOW() WHERE id = $1', [item.id, item.displayOrder]);
    }

    await recordAdminAction({
      action: 'project.reordered',
      targetType: 'project',
      targetId: 'projects',
      metadata: { count: projects.length },
      ipAddress: req.ip,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Project reorder failed:', error.message);
    return res.status(500).json({ error: 'Failed to reorder projects.' });
  }
});

adminRouter.delete('/projects/:id', requireAdmin, requireCsrf, async (req, res) => {
  const pool = db.getPool();
  if (!pool) return dbUnavailable(res);

  if (!UUID_RE.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid project ID.' });
  }

  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    await recordAdminAction({
      action: 'project.deleted',
      targetType: 'project',
      targetId: result.rows[0].id,
      metadata: { slug: result.rows[0].slug },
      ipAddress: req.ip,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Project deletion failed:', error.message);
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = {
  publicRouter,
  adminRouter,
};