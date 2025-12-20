import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Teachers Management')
@Controller('teachers')
export class TeachersController {}
