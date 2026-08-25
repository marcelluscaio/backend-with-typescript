import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskStatus } from '../../domain/entities/task.entity';

export class CreateTaskDto {
  @IsString({ message: 'title deve ser uma string' })
  @MinLength(3, { message: 'title deve ter ao menos 3 caracteres' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'description deve ser uma string' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: `status deve ser um de: ${Object.values(TaskStatus).join(', ')}` })
  status?: TaskStatus;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate deve ser uma data ISO 8601 válida' })
  dueDate?: string;
}
