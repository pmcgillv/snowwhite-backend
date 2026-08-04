import { buildServer } from './server.js';

const PORT = Number(process.env['PORT'] ?? 4000);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const app = buildServer();

app.listen({ port: PORT, host: HOST }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Money Max Advisor API listening at ${address}`);
  console.log('Mode: demo (no bank connections)');
});
