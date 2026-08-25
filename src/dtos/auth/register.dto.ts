import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'name deve ser uma string' })
  @MinLength(2, { message: 'name deve ter ao menos 2 caracteres' })
  name!: string;

  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  email!: string;

  @IsString({ message: 'password deve ser uma string' })
  @MinLength(6, { message: 'password deve ter ao menos 6 caracteres' })
  password!: string;
}
