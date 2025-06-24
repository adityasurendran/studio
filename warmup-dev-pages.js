const http = require('http');

const routes = [
  '/',
  '/about',
  '/faq',
  '/signin',
  '/signup',
  '/subscribe',
  '/dashboard',
  '/dashboard/create-custom',
  '/dashboard/discover',
  '/dashboard/leaderboard',
  '/dashboard/lessons',
  '/dashboard/lessons/new',
  '/dashboard/parent-settings',
  '/dashboard/profiles',
  '/dashboard/recommendations',
];

const PORT = 9002;
const HOST = 'localhost';

function warmup(route) {
  return new Promise((resolve) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: route,
      method: 'GET',
    };
    const req = http.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        console.log(`Warmed up: ${route} [${res.statusCode}]`);
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error(`Error warming up ${route}:`, e.message);
      resolve();
    });
    req.end();
  });
}

(async () => {
  for (const route of routes) {
    await warmup(route);
  }
  console.log('Warmup complete.');
})(); 