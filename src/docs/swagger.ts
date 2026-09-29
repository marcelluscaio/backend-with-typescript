import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '2.0.0',
      description:
        'API REST de gerenciamento de tarefas com autenticação JWT e persistência em MongoDB.',
    },
    servers: [{ url: '/', description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ChecklistItem: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Ler o capítulo 3' },
            done: { type: 'boolean', default: false },
            createdAt: { type: 'string', format: 'date-time', readOnly: true },
          },
        },
        TaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Estudar TypeScript' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'DONE'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
            dueDate: { type: 'string', format: 'date-time' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['estudo', 'typescript'],
            },
            checklist: {
              type: 'array',
              items: { $ref: '#/components/schemas/ChecklistItem' },
            },
          },
        },
        TaskStats: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 12 },
            overdue: { type: 'integer', example: 2 },
            byStatus: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'DONE'] },
                  count: { type: 'integer' },
                },
              },
            },
            topTags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tag: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});
