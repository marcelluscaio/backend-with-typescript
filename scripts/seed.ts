import 'reflect-metadata';
import bcrypt from 'bcryptjs';
import { TaskPriority, TaskStatus } from '../src/domain/entities/task.entity';
import { connectDatabase, disconnectDatabase } from '../src/infra/database/mongoose-connection';
import { TaskModel } from '../src/infra/database/models/task.model';
import { UserModel } from '../src/infra/database/models/user.model';
import { MongooseTaskRepository } from '../src/repositories/mongoose/mongoose-task.repository';
import { MongooseUserRepository } from '../src/repositories/mongoose/mongoose-user.repository';
import { logger } from '../src/services/logger.service';

const SEED_PASSWORD = 'senha123';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function seed(): Promise<void> {
  await connectDatabase();

  // The seed is meant to be re-runnable, so it starts from a clean slate.
  await Promise.all([TaskModel.deleteMany({}), UserModel.deleteMany({})]);

  const userRepository = new MongooseUserRepository();
  const taskRepository = new MongooseTaskRepository();
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const maria = await userRepository.create({
    name: 'Maria Silva',
    email: 'maria@example.com',
    passwordHash,
  });
  const joao = await userRepository.create({
    name: 'João Souza',
    email: 'joao@example.com',
    passwordHash,
  });

  await taskRepository.create({
    title: 'Finalizar o trabalho de backend',
    description: 'Migrar a persistência para MongoDB',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: daysFromNow(2),
    tags: ['faculdade', 'backend'],
    checklist: [
      { title: 'Modelar os documentos', done: true, createdAt: new Date() },
      { title: 'Escrever os testes', done: false, createdAt: new Date() },
    ],
    ownerId: maria.id,
  });

  await taskRepository.create({
    title: 'Revisar aggregation pipeline',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: daysFromNow(-3),
    tags: ['backend', 'estudo'],
    checklist: [],
    ownerId: maria.id,
  });

  await taskRepository.create({
    title: 'Ler documentação do Mongoose',
    status: TaskStatus.DONE,
    priority: TaskPriority.LOW,
    tags: ['estudo'],
    checklist: [],
    ownerId: maria.id,
  });

  await taskRepository.create({
    title: 'Planejar a sprint',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: daysFromNow(5),
    tags: ['trabalho'],
    checklist: [{ title: 'Levantar as pendências', done: false, createdAt: new Date() }],
    ownerId: joao.id,
  });

  logger.info('Base populada com sucesso', {
    usuarios: 2,
    tarefas: 4,
    login: `${maria.email} / ${SEED_PASSWORD}`,
  });
}

seed()
  .catch((error: Error) => {
    logger.error('Falha ao popular a base', { message: error.message });
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
