import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { message: string } {
    return { message: 'Ressoa AI API - v1' };
  }
}
