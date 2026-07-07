import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ListOrdersQuery } from './dto';
import { Order } from './order.types';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  list(@Query() query: ListOrdersQuery): Promise<Order[]> {
    return this.ordersService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findById(id);
  }
}
