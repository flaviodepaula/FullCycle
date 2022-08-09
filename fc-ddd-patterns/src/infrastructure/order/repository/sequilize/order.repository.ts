import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepositoryInterface from '../../../../domain/checkout/repository/order-repository.interface';


export default class OrderRepository implements OrderRepositoryInterface {

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {

    const sequelize = OrderModel.sequelize;
    await sequelize.transaction(async (t) => {

      await OrderItemModel.destroy({
        where:{ order_id: entity.id },
        transaction: t,
      }); 

      const items = entity.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        product_id: item.productId,
        quantity: item.quantity,
        order_id: entity.id,
      }));

      await OrderItemModel.bulkCreate(items, { transaction: t});
      await OrderModel.update(
        { total: entity.total() },
        { where: {id: entity.id }, transaction: t  }
      );
    });
  }

  find(id: string): Promise<Order> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<Order[]> {
    throw new Error("Method not implemented.");
  }
}
