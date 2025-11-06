import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
// Use require to avoid type resolution issues if types aren't installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const client: any = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'bitespeed_' });

export default fp(async function metricsPlugin(app: FastifyInstance) {
  app.get('/metrics', async (_req, reply) => {
    const metrics = await register.metrics();
    reply.header('Content-Type', register.contentType);
    return reply.send(metrics);
  });

  // Example histogram for /identify latency (observe in controller if desired)
  app.decorate('metrics', {
    identifyLatency: new client.Histogram({
      name: 'bitespeed_identify_duration_seconds',
      help: 'Latency of identify endpoint',
      registers: [register],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2]
    })
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    metrics: {
      identifyLatency: any;
    };
  }
}


