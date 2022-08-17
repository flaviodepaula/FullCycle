import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from './order.repository';

describe("Order repository test", () => {
  let sequelize: Sequelize; 

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    sequelize.addModels([
      ProductModel,
      CustomerModel,
      OrderModel,
      OrderItemModel,      
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const ordemItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [ordemItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: ordemItem.id,
          name: ordemItem.name,
          price: ordemItem.price,
          quantity: ordemItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("Product1", "Product 1", 10);
    await productRepository.create(product);

    const product2 = new Product("Product2","Product 2", 1);
    await productRepository.create(product2);

    const ordemItem = new OrderItem(
      "Item1",
      product.name,
      product.price,
      product.id,
      2
    );

    let order = new Order("Ordem123", "123", [ordemItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    let orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "Ordem123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: ordemItem.id,
          name: ordemItem.name,
          price: ordemItem.price,
          quantity: ordemItem.quantity,
          order_id: "Ordem123",
          product_id: "Product1",
        },
      ],
    });

   // update the item with new orderitems
    let ordemItemListNew : OrderItem[] = [];

    const ordemItem2 = new OrderItem(
       'Item2',
       product2.name,
       product2.price,
       product2.id,
       100 
    );

    ordemItemListNew.push(ordemItem2);     
    order.replaceItems(ordemItemListNew);

    await orderRepository.update(order);

    orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });
  
    expect(orderModel.toJSON()).toStrictEqual({
      id: "Ordem123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: ordemItem2.id,
          name: ordemItem2.name,
          price: ordemItem2.price,
          quantity: ordemItem2.quantity,
          order_id: "Ordem123",
          product_id: product2.id,
        }
      ],
    });

  });

  it("should find a order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("Product1", "Product 1", 15);
    await productRepository.create(product);
  
    const ordemItem = new OrderItem(
      "Item1",
      product.name,
      product.price,
      product.id,
      2
    );

    let order = new Order("Ordem123", "123", [ordemItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);
    const orderModel = await OrderModel.findOne({ where: { id: "Ordem123" }, include: ["items"]  });

    let foundOrder = await orderRepository.find("Ordem123");

    expect(orderModel.toJSON()).toStrictEqual({
      id: foundOrder.id,
      customer_id: foundOrder.customerId,
      total: foundOrder.total(),
      items: [
        {
          id: foundOrder.items[0].id,
          name: foundOrder.items[0].name,
          price: foundOrder.items[0].price,
          quantity: foundOrder.items[0].quantity,
          order_id: foundOrder.id,
          product_id: foundOrder.items[0].productId,
        },
      ],
    });
  });

  
  it("should find all order", async () => {

    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("Product1", "Product 1", 15);
    await productRepository.create(product);
  
    const ordemItem = new OrderItem(
      "Item1",
      product.name,
      product.price,
      product.id,
      2
    );     

    const ordemItem2 = new OrderItem(
      "Item2",
      product.name,
      product.price,
      product.id,
      2
    );     
 

    const orderRepository = new OrderRepository();
    
    const order = new Order("Ordem1", "123", [ordemItem]);
    await orderRepository.create(order);

    const order2 = new Order("Ordem2", "123", [ordemItem2]);
    await orderRepository.create(order2);

    const orders = [order, order2,];    
    const foundOrder = await orderRepository.findAll();

    expect(orders).toEqual(foundOrder);
  });

});
