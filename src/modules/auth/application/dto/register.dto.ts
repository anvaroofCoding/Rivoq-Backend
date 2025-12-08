import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

import {
  UserRole,
  UserStatus,
} from '../../../../shared/application/dto/auth.dto.js';

export class RegisterDto {
  @ApiProperty({ example: 'Islomjon' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Anvarov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+998947932005' })
  @IsString()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'abdulborimahammadjanov86@gmail.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  status: UserStatus.pending;

  @ApiProperty({
    enum: ['admin', 'superadmin', 'operator', 'teacher', 'student'],
    example: UserRole.admin,
    default: UserRole.admin,
  })
  @IsString()
  @IsNotEmpty()
  role: UserRole;
}
