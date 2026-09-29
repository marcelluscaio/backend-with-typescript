import { Router } from 'express';
import { Container } from '../container';
import { validateDto } from '../middlewares/validate.middleware';
import { CreateTaskDto } from '../dtos/task/create-task.dto';
import { UpdateTaskDto } from '../dtos/task/update-task.dto';
import { asyncHandler } from '../utils/async-handler';

export function createTaskRouter(container: Container): Router {
  const router = Router();
  const { taskController, authMiddleware } = container;

  router.use(authMiddleware);

  /**
   * @openapi
   * /api/tasks:
   *   get:
   *     summary: Lista as tarefas do usuário autenticado
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema: { type: string, enum: [PENDING, IN_PROGRESS, DONE] }
   *       - in: query
   *         name: tag
   *         schema: { type: string, example: "estudo" }
   *       - in: query
   *         name: dueBefore
   *         description: Retorna apenas tarefas com vencimento até esta data
   *         schema: { type: string, format: date-time }
   *     responses:
   *       200: { description: Lista de tarefas }
   *       400: { description: Filtros inválidos }
   *       401: { description: Não autenticado }
   *   post:
   *     summary: Cria uma nova tarefa para o usuário autenticado
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TaskInput'
   *     responses:
   *       201: { description: Tarefa criada }
   *       400: { description: Dados inválidos }
   *       401: { description: Não autenticado }
   */
  router
    .route('/')
    .get(asyncHandler(taskController.list))
    .post(validateDto(CreateTaskDto), asyncHandler(taskController.create));

  /**
   * @openapi
   * /api/tasks/stats:
   *   get:
   *     summary: Resumo das tarefas do usuário (contagem por status, atrasadas e tags mais usadas)
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200:
   *         description: Estatísticas calculadas via aggregation pipeline
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TaskStats'
   *       401: { description: Não autenticado }
   */
  // Registered before "/:id" so that "stats" is not swallowed as a task id.
  router.get('/stats', asyncHandler(taskController.stats));

  /**
   * @openapi
   * /api/tasks/{id}:
   *   get:
   *     summary: Obtém uma tarefa pelo id
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Tarefa encontrada }
   *       403: { description: Tarefa pertence a outro usuário }
   *       404: { description: Tarefa não encontrada }
   *   put:
   *     summary: Atualiza uma tarefa pelo id
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TaskInput'
   *     responses:
   *       200: { description: Tarefa atualizada }
   *       400: { description: Dados inválidos }
   *       403: { description: Tarefa pertence a outro usuário }
   *       404: { description: Tarefa não encontrada }
   *   delete:
   *     summary: Remove uma tarefa pelo id
   *     tags: [Tasks]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       204: { description: Tarefa removida }
   *       403: { description: Tarefa pertence a outro usuário }
   *       404: { description: Tarefa não encontrada }
   */
  router
    .route('/:id')
    .get(asyncHandler(taskController.getById))
    .put(validateDto(UpdateTaskDto), asyncHandler(taskController.update))
    .delete(asyncHandler(taskController.delete));

  return router;
}
