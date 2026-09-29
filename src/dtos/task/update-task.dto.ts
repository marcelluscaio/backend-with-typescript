import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../domain/entities/task.entity';
import { ChecklistItemDto } from './create-task.dto';

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: 'title deve ser uma string' })
  @MinLength(3, { message: 'title deve ter ao menos 3 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'description deve ser uma string' })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, { message: `status deve ser um de: ${Object.values(TaskStatus).join(', ')}` })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, {
    message: `priority deve ser um de: ${Object.values(TaskPriority).join(', ')}`,
  })
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'dueDate deve ser uma data ISO 8601 válida' })
  dueDate?: string;

  @IsOptional()
  @IsArray({ message: 'tags deve ser uma lista de strings' })
  @ArrayMaxSize(10, { message: 'tags deve ter no máximo 10 itens' })
  @IsString({ each: true, message: 'cada tag deve ser uma string' })
  tags?: string[];

  @IsOptional()
  @IsArray({ message: 'checklist deve ser uma lista de itens' })
  @ArrayMaxSize(50, { message: 'checklist deve ter no máximo 50 itens' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist?: ChecklistItemDto[];
}
