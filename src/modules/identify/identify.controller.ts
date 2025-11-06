import { FastifyInstance } from 'fastify';
import { identify } from './identify.service';

export async function identifyRoutes(app: FastifyInstance) {
  const identifySchema = {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', minLength: 1, pattern: '^(?=.*\\S).*$' },
          phoneNumber: { type: 'string', minLength: 1, pattern: '^(?=.*\\S).*$' }
        },
        additionalProperties: false
      },
      response: {
        200: {
          type: 'object',
          properties: {
            contact: {
              type: 'object',
              properties: {
                primaryContatctId: { type: 'number' },
                emails: { type: 'array', items: { type: 'string' } },
                phoneNumbers: { type: 'array', items: { type: 'string' } },
                secondaryContactIds: { type: 'array', items: { type: 'number' } }
              },
              required: ['primaryContatctId', 'emails', 'phoneNumbers', 'secondaryContactIds']
            }
          },
          required: ['contact']
        }
      }
    }
  } as const;

  app.post('/identify', identifySchema, async (request, reply) => {
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


