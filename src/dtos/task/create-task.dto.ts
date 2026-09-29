import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../domain/entities/task.entity';

export class ChecklistItemDto {
  @IsString({ message: 'checklist.title deve ser uma string' })
  @MinLength(1, { message: 'checklist.title não pode ser vazio' })
  @MaxLength(120, { message: 'checklist.title deve ter no máximo 120 caracteres' })
  title!: string;

  @IsOptional()
  @IsBoolean({ message: 'checklist.done deve ser booleano' })
  done?: boolean;
}

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
