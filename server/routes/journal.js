const express = require('express');
const router = express.Router();
const axios = require('axios');

// ── Config ───────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'Pantane1';
const GITHUB_REPO = 'pantane-hub';
const GITHUB_BRANCH = 'main';
const JOURNAL_PATH = 'data/journal.json';

const githubApi = () => axios.create({
  baseURL: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

// ── Auth middleware ──────────────────────────────────────────────────────
// Single shared admin password, sent as a Bearer token on every request.
// Nothing is stored server-side — the frontend keeps it in sessionStorage
// and resends it each call.
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin panel is not configured on the server.' });
  }
  if (!token || token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password.' });
  }
  next();
};

// POST /admin/login — verify password without doing anything else
router.post('/login', requireAdmin, (req, res) => {
  res.json({ success: true });
});

// GET /admin/journal — fetch current posts (and the file's sha, needed to write later)
router.get('/journal', requireAdmin, async (req, res) => {
  try {
    const { data } = await githubApi().get(
      `/contents/${JOURNAL_PATH}?ref=${GITHUB_BRANCH}`
    );
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    res.json({ posts: JSON.parse(content), sha: data.sha });
  } catch (error) {
    console.error('Journal fetch error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to load journal posts from GitHub.' });
  }
});

// POST /admin/journal — save the full posts array, committed straight to the repo
// Body: { posts: JournalPost[], sha: string, message?: string }
router.post('/journal', requireAdmin, async (req, res) => {
  const { posts, sha, message } = req.body;

  if (!Array.isArray(posts)) {
    return res.status(400).json({ error: 'posts must be an array.' });
  }

  // Basic shape validation so a bad form submission can't corrupt the file.
  for (const p of posts) {
    if (!p.id || !p.slug || !p.title || !p.excerpt || !Array.isArray(p.content) ||
        !p.date || !p.category || !Array.isArray(p.tags)) {
      return res.status(400).json({ error: `Post "${p.title || p.id || '?'}" is missing a required field.` });
    }
  }

  const slugs = new Set();
  for (const p of posts) {
    if (slugs.has(p.slug)) {
      return res.status(400).json({ error: `Duplicate slug: ${p.slug}` });
    }
    slugs.add(p.slug);
  }

  try {
    const newContent = JSON.stringify(posts, null, 2) + '\n';
    const { data } = await githubApi().put(`/contents/${JOURNAL_PATH}`, {
      message: message || 'Update journal via admin panel',
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      sha,
      branch: GITHUB_BRANCH,
    });
    res.json({ success: true, commit: data.commit?.sha });
  } catch (error) {
    console.error('Journal save error:', error?.response?.data || error.message);
    if (error?.response?.status === 409) {
      return res.status(409).json({ error: 'The journal file changed since you loaded it. Refresh and try again.' });
    }
    res.status(500).json({ error: 'Failed to save journal posts to GitHub.' });
  }
});

module.exports = router;
