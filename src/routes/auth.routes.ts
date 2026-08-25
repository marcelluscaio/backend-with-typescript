import { Router } from 'express';
import { Container } from '../container';
import { validateDto } from '../middlewares/validate.middleware';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';
import { asyncHandler } from '../utils/async-handler';
import { createAuthRateLimiter } from '../middlewares/rate-limit.middleware';

export function createAuthRouter(container: Container): Router {
  const router = Router();
  const { authController } = container;

  router.use(createAuthRateLimiter());

  /**
   * @openapi
   * /api/auth/register:
   *   post:
   *     summary: Registra um novo usuário
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name: { type: string, example: "Maria Silva" }
   *               email: { type: string, example: "maria@example.com" }
   *               password: { type: string, example: "senha123" }
   *     responses:
   *       201: { description: Usuário criado, retorna o token JWT }
   *       400: { description: Dados inválidos }
   *       409: { description: E-mail já cadastrado }
   *       429: { description: Muitas tentativas, tente novamente mais tarde }
   */
  router.post('/register', validateDto(RegisterDto), asyncHandler(authController.register));

  /**
   * @openapi
   * /api/auth/login:
   *   post:
   *     summary: Autentica um usuário e retorna um token JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, example: "maria@example.com" }
   *               password: { type: string, example: "senha123" }
   *     responses:
   *       200: { description: Login efetuado, retorna o token JWT }
   *       401: { description: Credenciais inválidas }
   *       429: { description: Muitas tentativas, tente novamente mais tarde }
   */
  router.post('/login', validateDto(LoginDto), asyncHandler(authController.login));

  return router;
}
