const express = require('express');
const router = express.Router();
const axios = require('axios');

// ── Config ───────────────────────────────────────────────────────────────
const GITHUB_OWNER = 'Pantane1';
const GITHUB_REPO = 'pantane-hub';
const GITHUB_BRANCH = 'main';
const SHARP_PATH = 'data/sharp.json';

const githubApi = () => axios.create({
  baseURL: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

// ── Auth middleware ──────────────────────────────────────────────────────
// Same shared admin password and Bearer-token scheme as routes/journal.js.
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

// GET /admin/sharp — fetch current deals (and the file's sha, needed to write later)
router.get('/sharp', requireAdmin, async (req, res) => {
  try {
    const { data } = await githubApi().get(
      `/contents/${SHARP_PATH}?ref=${GITHUB_BRANCH}`
    );
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    res.json({ deals: JSON.parse(content), sha: data.sha });
  } catch (error) {
    console.error('Sharp fetch error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to load Sharp deals from GitHub.' });
  }
});

// POST /admin/sharp — save the full deals array, committed straight to the repo
// Body: { deals: SharpDeal[], sha: string, message?: string }
router.post('/sharp', requireAdmin, async (req, res) => {
  const { deals, sha, message } = req.body;

  if (!Array.isArray(deals)) {
    return res.status(400).json({ error: 'deals must be an array.' });
  }

  // Basic shape validation so a bad form submission can't corrupt the file.
  // reward / dealType are intentionally NOT required -- buying and
  // service-request deals legitimately have no reward value.
  for (const d of deals) {
    if (!d.id || !d.slug || !d.title || !d.category || !d.description ||
        !d.whatYouGet || !d.status || !d.datePosted || !Array.isArray(d.steps)) {
      return res.status(400).json({ error: `Deal "${d.title || d.id || '?'}" is missing a required field.` });
    }
  }

  const slugs = new Set();
  for (const d of deals) {
    if (slugs.has(d.slug)) {
      return res.status(400).json({ error: `Duplicate slug: ${d.slug}` });
    }
    slugs.add(d.slug);
  }

  try {
    const newContent = JSON.stringify(deals, null, 2) + '\n';
    const { data } = await githubApi().put(`/contents/${SHARP_PATH}`, {
      message: message || 'Update Sharp deals via admin panel',
      content: Buffer.from(newContent, 'utf8').toString('base64'),
      sha,
      branch: GITHUB_BRANCH,
    });
    res.json({ success: true, commit: data.commit?.sha });
  } catch (error) {
    console.error('Sharp save error:', error?.response?.data || error.message);
    if (error?.response?.status === 409) {
      return res.status(409).json({ error: 'The Sharp file changed since you loaded it. Refresh and try again.' });
    }
    res.status(500).json({ error: 'Failed to save Sharp deals to GitHub.' });
  }
});

module.exports = router;
