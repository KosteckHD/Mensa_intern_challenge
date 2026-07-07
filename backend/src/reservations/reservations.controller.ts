import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { CreateReservationBody, ListReservationsQuery } from './dto';
import { CheckoutResult, Reservation } from './reservation.types';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
export class ReservationsController {
  constructor(
    @Inject(ReservationsService)
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get()
  list(@Query() query: ListReservationsQuery): Promise<Reservation[]> {
    return this.reservationsService.list(query);
  }

  @Post()
  create(@Body() body: CreateReservationBody): Promise<Reservation> {
    return this.reservationsService.create(body);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Reservation> {
    return this.reservationsService.findById(id);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string): Promise<CheckoutResult> {
    return this.reservationsService.checkout(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string): Promise<Reservation> {
    return this.reservationsService.cancel(id);
  }

  @Post('cleanup/expired')
  expireActiveReservations(): Promise<{ expiredCount: number }> {
    return this.reservationsService.expireActiveReservations();
  }
}
