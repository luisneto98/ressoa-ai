import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NotificacoesService } from './notificacoes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RoleUsuario } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

/**
 * NotificacoesController - REST API for notification management
 * Story 4.4 - AC4: REST API Endpoints for Notifications
 *
 * All endpoints require authentication (JwtAuthGuard)
 * All endpoints enforce multi-tenancy via NotificacoesService
 * Code Review MEDIUM-4: Rate limiting added to prevent DoS
 */
@Controller('notificacoes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 req/min per user
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  /**
   * GET /api/v1/notificacoes
   * Get user's notifications with pagination
   *
   * Query params:
   * - limit: Number of notifications to return (default: 50)
   * - offset: Number of notifications to skip (default: 0)
   *
   * @returns Array of notifications (sorted by created_at DESC)
   */
  @Get()
  @Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  async getNotificacoes(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.notificacoesService.getNotificacoes(user.userId, {
      limit,
      offset,
    });
  }

  /**
   * GET /api/v1/notificacoes/unread-count
   * Get count of unread notifications
   *
   * @returns { count: number }
   */
  @Get('unread-count')
  @Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificacoesService.getUnreadCount(user.userId);
    return { count };
  }

  /**
   * PATCH /api/v1/notificacoes/:id/read
   * Mark notification as read
   *
   * CRITICAL: Validates user ownership before updating
   *
   * @param id - Notification ID
   * @returns Updated notification
   */
  @Patch(':id/read')
  @Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificacoesService.markAsRead(id, user.userId);
  }

  /**
   * POST /api/v1/notificacoes/mark-all-read
   * Mark all user's notifications as read
   *
   * @returns Update result
   */
  @Post('mark-all-read')
  @Roles(RoleUsuario.PROFESSOR, RoleUsuario.COORDENADOR, RoleUsuario.DIRETOR)
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificacoesService.markAllAsRead(user.userId);
  }
}
