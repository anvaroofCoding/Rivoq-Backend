import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteProfileDto {
  @ApiProperty({
    example: 'Islomjon',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    example: 'Anvarov',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    example: 'Anvar',
    description: "Father's name",
  })
  @IsString()
  @IsNotEmpty({ message: "Father's name is required" })
  fathersName: string;

  @ApiProperty({
    example: '2008-09-13',
    description: 'Date of birth (YYYY-MM-DD format)',
  })
  @Type(() => Date)
  @IsDate({ message: 'Invalid date format for birthday' })
  @IsNotEmpty({ message: 'Birthday is required' })
  birthDay: Date;

  @ApiProperty({
    example: 'Uzbek',
    description: 'Nationality',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nationality is required' })
  nationality: string;

  @ApiProperty({
    example: 'https://www.instagram.com/islom_intech',
    description: 'Instagram profile URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  instagramUsername?: string;

  @ApiProperty({
    example: 'https://t.me/isamu_web',
    description: 'Telegram profile URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  telegramUsername?: string;

  @ApiProperty({
    example: 'https://github.com/anvaroofCoding',
    description: 'GitHub profile URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  githubUsername?: string;

  @ApiProperty({
    example: 'https://www.linkedin.com/in/islom-anvar-630706324',
    description: 'LinkedIn profile URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  linkedInUsername?: string;

  @ApiProperty({
    example: 'Tashkent viloyati, Bek Obod tumani',
    description: 'Residential address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'Frontend Engineer',
    description: 'Short biography or professional information',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
