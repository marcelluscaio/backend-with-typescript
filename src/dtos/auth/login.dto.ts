import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  email!: string;

  @IsString({ message: 'password deve ser uma string' })
  @MinLength(6, { message: 'password deve ter ao menos 6 caracteres' })
  password!: string;
}
