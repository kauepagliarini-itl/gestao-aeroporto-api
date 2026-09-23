import { Module } from '@nestjs/common';
import { EmbarquesController } from './embarques.controller';
import { EmbarquesService } from './embarques.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmbarquesController],
  providers: [EmbarquesService],
})
export class EmbarquesModule {}