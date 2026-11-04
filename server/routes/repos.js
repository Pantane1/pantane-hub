const express = require('express');
const router = express.Router();
const axios = require('axios');

const GITHUB_USER = 'pantane1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cache = { data: null, fetchedAt: 0 };

// GET /repos — list of the user's repos, cached server-side.
// Uses GITHUB_TOKEN (already set for the journal admin route) to get the
// 5,000 req/hr authenticated rate limit — but since only this server calls
// GitHub, and results are cached, it's essentially never hit anyway.
router.get('/', async (req, res) => {
  const now = Date.now();

  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json(cache.data);
  }

  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const { data } = await axios.get(
      `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=12`,
      { headers }
    );

    cache = { data, fetchedAt: now };
    res.json(data);
  } catch (error) {
    console.error('Repos fetch error:', error?.response?.data || error.message);

    // Serve stale cache rather than failing outright, if we have one.
    if (cache.data) {
      return res.json(cache.data);
    }
    res.status(502).json({ error: 'Failed to load repositories from GitHub.' });
  }
});

module.exports = router;
