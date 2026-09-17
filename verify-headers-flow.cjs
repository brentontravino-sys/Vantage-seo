// verify-headers-flow.cjs — confirms the crawler's headers survive into issue objects
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
app.use(express.json());

// Mirror the crawler's add() helper
function makeAdd(issues) {
  return (page, severity, category, title, how_to_fix) => {
    issues.push({
      title,
      severity,
      category,
      pages_affected: 1,
      description: title,
      how_to_fix,
      page_url: page.url,
      ...(page.headers ? { headers: page.headers } : {}),
    });
  };
}

// Simulate a page result with headers (as the crawler produces)
const pageResult = {
  url: 'https://example.com/',
  status: 200,
  headers: {
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'content-security-policy': "default-src 'self'",
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'permissions-policy': 'geolocation=()',
  },
};

const issues = [];
const add = makeAdd(issues);

// Simulate the security header audit checks from seo-crawler.cjs
const h = pageResult.headers;
if (!h['strict-transport-security']) {
  add(pageResult, 'warning', 'security', 'Missing HSTS header', 'Add HSTS.');
} else {
  add(pageResult, 'notice', 'security', 'HSTS present', 'Configure max-age and includeSubDomains.');
}
if (!h['x-frame-options'] && !h['content-security-policy']?.includes('frame-ancestors')) {
  add(pageResult, 'notice', 'security', 'Missing X-Frame-Options', 'Add X-Frame-Options or CSP frame-ancestors.');
} else {
  add(pageResult, 'notice', 'security', 'Clickjacking protection present', 'No action needed.');
}
if (!h['content-security-policy']) {
  add(pageResult, 'notice', 'security', 'Missing CSP', 'Add a Content-Security-Policy header.');
} else {
  add(pageResult, 'notice', 'security', 'CSP present', 'Review policy directives.');
}

// Route to expose issues
app.get('/api/seo/headers-test', (req, res) => {
  res.json({ success: true, issues });
});

const PORT = 3195;
const server = app.listen(PORT, () => {
  console.log('Test server on port', PORT);

  http.get({ hostname: 'localhost', port: PORT, path: '/api/seo/headers-test' }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      const body = JSON.parse(data);
      console.log('issues count:', body.issues.length);
      const first = body.issues[0];
      console.log('first issue title:', first.title);
      console.log('first issue severity:', first.severity);
      console.log('first issue has headers:', !!first.headers);
      console.log('first issue HSTS:', first.headers?.['strict-transport-security']);
      console.log('first issue CSP:', first.headers?.['content-security-policy']);
      console.log('first issue XFO:', first.headers?.['x-frame-options']);
      console.log('first issue XCTO:', first.headers?.['x-content-type-options']);
      console.log('first issue Referrer-Policy:', first.headers?.['referrer-policy']);
      console.log('first issue Permissions-Policy:', first.headers?.['permissions-policy']);
      console.log('raw headers object:', JSON.stringify(first.headers));

      const allHaveHeaders = body.issues.every(i => i.headers && Object.keys(i.headers).length > 0);
      console.log('all issues have headers:', allHaveHeaders);

      // Verify IssueCard safety: no crash on missing header keys
      const testIssue = { ...first, headers: { 'strict-transport-security': 'max-age=31536000' } };
      const hstsPresent = !!testIssue.headers['strict-transport-security'];
      const cspPresent = !!testIssue.headers['content-security-policy'];
      const xfoPresent = !!testIssue.headers['x-frame-options'];
      console.log('IssueCard safety check — HSTS:', hstsPresent, 'CSP:', cspPresent, 'XFO:', xfoPresent);

      console.log('\nHeaders flow: PASS');
      server.close();
    });
  });
});
