"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyRoutes = identifyRoutes;
const identify_service_1 = require("./identify.service");
async function identifyRoutes(app) {
    const identifySchema = {
        schema: {
            body: {
                type: 'object',
                properties: {
                    email: { type: 'string' },
                    phoneNumber: { type: 'string' }
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
    };
    app.post('/identify', identifySchema, async (request, reply) => {
        const body = request.body;
        const email = body?.email;
        const phoneNumber = body?.phoneNumber;
        try {
            const result = await (0, identify_service_1.identify)({ email, phoneNumber });
            return reply.status(200).send(result);
        }
        catch (err) {
            const code = err?.statusCode ?? 500;
            if (code >= 500)
                request.log.error(err);
            return reply.status(code).send({ error: err?.message ?? 'internal' });
        }
    });
}
