process.env.VITE_API_BASE_URL = 'http://127.0.0.1:3101/api';

const { createServer } = await import('vite');
const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
  },
});

await server.listen();
