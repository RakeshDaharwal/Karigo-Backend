import prisma from "../config/db.conn";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../generated/prisma/enums";

export type CreateOrderInput = {
  id: string;
  userId: string;
  deliveryAddress: Record<string, unknown>;
  totalPrice: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
};

export const createOrderWithItems = (input: CreateOrderInput) =>
  prisma.order.create({
    data: {
      id: input.id,
      userId: input.userId,
      deliveryAddress: input.deliveryAddress as any,
      totalPrice: input.totalPrice,
      status: input.status ?? "PENDING",
      paymentStatus: input.paymentStatus ?? "PENDING",
      paymentMethod: input.paymentMethod ?? "COD",
      items: {
        create: input.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          price: it.price,
        })),
      },
    },
    include: { items: true },
  });

export const listOrdersByUser = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

export const findOrderForUser = (orderId: string, userId: string) =>
  prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
