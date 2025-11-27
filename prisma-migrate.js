const { exec } = require('child_process');

process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

exec('npx prisma migrate dev --name add_export_history --schema=backend/prisma/schema.prisma', (error, stdout, stderr) => {
  console.log(stdout);
  if (stderr) console.error(stderr);
  if (error) console.error('Error:', error);
});