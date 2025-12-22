import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

import {
  UserRole,
  UserStatus,
} from '../../../../shared/application/dto/auth.dto.js';
import { Type } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Islomjon' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Anvarov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: "Father's name" })
  @IsString()
  @IsNotEmpty()
  fathersName: string;

  @ApiProperty({ example: '2008-09-13' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  birthDay: Date;

  @ApiProperty({ example: 'Uzbek' })
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @ApiProperty({ example: 'https://www.instagram.com/islom_intech' })
  @IsString()
  @IsNotEmpty()
  instagramUsername: string;

  @ApiProperty({ example: 'https://t.me/isamu_web' })
  @IsString()
  @IsNotEmpty()
  telegramUsername: string;

  @ApiProperty({ example: 'https://github.com/anvaroofCoding' })
  @IsString()
  githubUsername: string;

  @ApiProperty({ example: 'https://www.linkedin.com/in/islom-anvar-630706324' })
  @IsString()
  linkedInUsername: string;

  @ApiProperty({ example: 'Tashkent viloyati, Bek Obod tumani' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Frontend Enginner' })
  @IsString()
  bio: string;

  @ApiProperty({ example: '+998947932005' })
  @IsString()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'islomanvarov05@gmail.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  status: UserStatus.pending;

  role: UserRole.student;
}
