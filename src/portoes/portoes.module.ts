import { Module } from '@nestjs/common';
import { PortoesService } from './portoes.service';
import { PortoesController } from './portoes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PortoesController],
  providers: [PortoesService],
})
export class PortoesModule {}