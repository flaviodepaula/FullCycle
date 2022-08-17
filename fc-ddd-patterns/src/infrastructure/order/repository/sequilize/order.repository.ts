import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderModel from "./order.model";
import OrderRepositoryInterface from '../../../../domain/checkout/repository/order-repository.interface';
import Product from '../../../../domain/product/entity/product';
import ProductModel from '../../../product/repository/sequelize/product.model';


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
          order_id: entity.id
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

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({
      where: { id: id },
      include: ["items"],
    }); 

     const orderItens: OrderItem[] = await Promise.all(orderModel.items.map( async (item): Promise<OrderItem>  => {
      let prd = ( await ProductModel.findOne({ where: { id: item.product_id } }));
    
      return new OrderItem(
        item.id,
        item.name,
        prd.price,
        item.product_id,
        item.quantity
      )}));   

    const newOrder: Order = new Order( orderModel.id, 
                      orderModel.customer_id, 
                      orderItens);
                       
    return newOrder;
  }

  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({ include: ["items"] });
 
    const retOrders = await Promise.all(orderModels.map(async (orderModel) : Promise<Order>  => {

      let orderItens: OrderItem[] = await Promise.all(orderModel.items.map( async (item): Promise<OrderItem>  => {
        let prd = ( await ProductModel.findOne({ where: { id: item.product_id } }));
      
        return new OrderItem(
          item.id,
          item.name,
          prd.price,
          item.product_id,
          item.quantity
        )}));   

      return new Order(orderModel.id, orderModel.customer_id, orderItens)

    }));
      
    return retOrders;
  }
}


/*

id: string, customerId: string, items: OrderItem[]


async find(id: string): Promise<Product> {
    const productModel = await ProductModel.findOne({ where: { id } });
    return new Product(productModel.id, productModel.name, productModel.price);
  }

  async findAll(): Promise<Product[]> {
    const productModels = await ProductModel.findAll();
    return productModels.map((productModel) =>
      new Product(productModel.id, productModel.name, productModel.price)
    );
     */