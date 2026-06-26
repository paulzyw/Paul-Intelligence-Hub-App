import { createServer } from 'vite';

async function test() {
  console.log("Starting createServer");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  console.log("Created Vite server");
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});
