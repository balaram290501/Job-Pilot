import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { tailorResume, generatePrepBrief, analyzeRejectionPatterns, classifyEmailsWithGemini, generateTrackerWithGemini, generateLearningTracker, generateJobSuggestions } from './src/server/geminiService.js';
import { getUserByApiToken, generateSaveJobBookmarkletScript, generateAutofillBookmarkletScript } from './src/server/bookmarkletService.js';
import { adminDb } from './src/lib/serverFirebase.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS middleware specifically for bookmarklet endpoints
  app.use('/api/bookmarklet', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // FEATURE 1: Tailor Resume API
  app.post('/api/tailor-resume', async (req, res) => {
    try {
      const { jobDescription, resumeText, company, role } = req.body;
      if (!jobDescription || !resumeText) {
        return res.status(400).json({ error: 'Job description and resume text are required.' });
      }

      const result = await tailorResume(jobDescription, resumeText, company, role);
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/tailor-resume:', err);
      res.status(500).json({ error: err.message || 'Failed to tailor resume.' });
    }
  });

  // FEATURE 3A: Interview Prep Brief API with Google Search Grounding
  app.post('/api/interview-prep', async (req, res) => {
    try {
      const { company, role, userLogs = [] } = req.body;
      if (!company || !role) {
        return res.status(400).json({ error: 'Company name and role are required.' });
      }

      const brief = await generatePrepBrief(company, role, userLogs);
      res.json(brief);
    } catch (err: any) {
      console.error('Error in /api/interview-prep:', err);
      res.status(500).json({ error: err.message || 'Failed to generate prep brief.' });
    }
  });

  // FEATURE 3B: Rejection Analysis API
  app.post('/api/rejection-analysis', async (req, res) => {
    try {
      const { userLogs = [] } = req.body;
      const analysis = await analyzeRejectionPatterns(userLogs);
      res.json(analysis);
    } catch (err: any) {
      console.error('Error in /api/rejection-analysis:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze rejection patterns.' });
    }
  });

  // FEATURE 4: Email Scan API (Gemini Classification)
  app.post('/api/scan-gmail', async (req, res) => {
    try {
      const { emails = [], existingApps = [] } = req.body;
      const classified = await classifyEmailsWithGemini(emails, existingApps);
      res.json({ classified });
    } catch (err: any) {
      console.error('Error in /api/scan-gmail:', err);
      res.status(500).json({ error: err.message || 'Failed to scan and classify emails.' });
    }
  });

  // FEATURE: Generate Learning Tracker API
  app.post('/api/generate-tracker', async (req, res) => {
    try {
      const { userPrompt, targetDays, query } = req.body;
      const prompt = (userPrompt || query || '').trim();
      if (!prompt) {
        return res.status(400).json({ error: 'userPrompt is required to generate learning tracker.' });
      }

      const days = targetDays ? Number(targetDays) : undefined;
      const result = await generateLearningTracker(prompt, days);
      res.json(result);
    } catch (err: any) {
      console.error('Error in /api/generate-tracker:', err);
      res.status(500).json({ error: err.message || 'Failed to generate learning tracker.' });
    }
  });

  // FEATURE: Generate Learning Tracker Topics API
  app.post('/api/generate-tracker-topics', async (req, res) => {
    try {
      const { query, userPrompt, targetDays } = req.body;
      const promptText = (userPrompt || query || '').trim();
      if (!promptText) {
        return res.status(400).json({ error: 'userPrompt or query is required to generate learning tracker.' });
      }

      const daysNum = targetDays ? Number(targetDays) : undefined;
      const generated = await generateLearningTracker(promptText, daysNum);
      res.json(generated);
    } catch (err: any) {
      console.error('Error in /api/generate-tracker-topics:', err);
      res.status(500).json({ error: err.message || 'Failed to generate learning tracker topics with AI.' });
    }
  });

  // FEATURE: AI Job Suggestions API
  app.post('/api/job-suggestions', async (req, res) => {
    try {
      const {
        resumeMasterText,
        resumeText,
        targetRoles = [],
        locations = [],
        seniority = '',
      } = req.body;

      const effectiveResume = resumeMasterText || resumeText || '';
      const suggestions = await generateJobSuggestions(
        effectiveResume,
        Array.isArray(targetRoles) ? targetRoles : [],
        Array.isArray(locations) ? locations : [],
        seniority
      );
      res.json(suggestions);
    } catch (err: any) {
      console.error('Error in /api/job-suggestions:', err);
      res.status(500).json({ error: err.message || 'Failed to generate job suggestions.' });
    }
  });


  // FEATURE 5: Bookmarklet Save Job API
  app.post('/api/bookmarklet/save-job', async (req, res) => {
    try {
      const { token, company, role, jobDescriptionText, source, url } = req.body;
      if (!token) {
        return res.status(401).json({ error: 'Missing personal API token.' });
      }

      const user = await getUserByApiToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid or revoked personal API token.' });
      }

      const now = new Date().toISOString();
      const newApp = {
        userId: user.uid,
        company: company || 'Unknown Company',
        role: role || 'Unknown Role',
        jobDescriptionText: jobDescriptionText || '',
        status: 'saved',
        appliedDate: now.split('T')[0],
        source: source || 'other',
        tailoredResumeText: '',
        notes: url ? `Saved via Bookmarklet from ${url}` : 'Saved via JobPilot Bookmarklet',
        lastUpdated: now,
      };

      const docRef = await adminDb.collection('applications').add(newApp);

      res.json({ success: true, applicationId: docRef.id, message: 'Application saved successfully.' });
    } catch (err: any) {
      console.error('Error in /api/bookmarklet/save-job:', err);
      res.status(500).json({ error: err.message || 'Failed to save job via bookmarklet.' });
    }
  });

  // FEATURE 5: Bookmarklet Profile Fetch API
  app.get('/api/bookmarklet/profile', async (req, res) => {
    try {
      const token = (req.query.token as string) || '';
      if (!token) {
        return res.status(401).json({ error: 'Missing personal API token.' });
      }

      const user = await getUserByApiToken(token);
      if (!user) {
        return res.status(401).json({ error: 'Invalid personal API token.' });
      }

      const cp = user.candidateProfile || {
        phone: '',
        noticePeriod: '',
        currentCtc: '',
        expectedCtc: '',
        portfolioUrl: '',
        linkedInUrl: '',
        yearsOfExperience: '',
      };

      res.json({
        name: user.name || '',
        email: user.email || '',
        ...cp,
      });
    } catch (err: any) {
      console.error('Error in /api/bookmarklet/profile:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch candidate profile.' });
    }
  });

  // FEATURE 5: Generate Bookmarklets JS Endpoint
  app.get('/api/bookmarklet/generate', async (req, res) => {
    try {
      const token = (req.query.token as string) || '';
      const hostUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;

      if (!token) {
        return res.status(400).json({ error: 'Token is required.' });
      }

      const saveJobBookmarklet = generateSaveJobBookmarkletScript(token, hostUrl);
      const autofillBookmarklet = generateAutofillBookmarkletScript(token, hostUrl);

      res.json({
        saveJobBookmarklet,
        autofillBookmarklet,
        hostUrl,
      });
    } catch (err: any) {
      console.error('Error generating bookmarklets:', err);
      res.status(500).json({ error: 'Failed to generate bookmarklets.' });
    }
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JobPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
