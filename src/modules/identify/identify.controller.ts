import { FastifyInstance } from 'fastify';
import { identify } from './identify.service';

export async function identifyRoutes(app: FastifyInstance) {
  app.post('/identify', async (request, reply) => {
    const body = request.body as any;
    const email = body?.email as string | undefined;
    const phoneNumber = body?.phoneNumber as string | undefined;

    try {
      const result = await identify({ email, phoneNumber });
      return reply.status(200).send(result);
    } catch (err: any) {
      const code = err?.statusCode ?? 500;
      if (code >= 500) request.log.error(err);
      return reply.status(code).send({ error: err?.message ?? 'internal' });
    }
  });
}


