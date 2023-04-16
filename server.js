'use strict';

const { PeerRPCServer } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');
const uuid = require('uuid');

const link = new Link({
  grape: 'http://127.0.0.1:30001',
});

link.start();

const orderbook = [];

const server = new PeerRPCServer(link, {
  timeout: 30000,
});
server.init();
const port = 1024 + Math.floor(Math.random() * 1000);
const service = server.transport('server');
service.listen(port);

function submitOrder(side, quantity, price) {
  const order = {
    id: uuid.v4(),
    clientId: service.port,
    side,
    quantity,
    price,
  };
  orderbook.push(order);

  // Broadcast the order to all other instances
  link.announce('orderbook', service.port, {});
}

// Function to execute a matching order
function executeOrder(order1, order2) {
  console.log(`Matched ${order1.id} with ${order2.id}`);

  const quantity = Math.min(order1.quantity, order2.quantity);
  order1.quantity -= quantity;
  order2.quantity -= quantity;

  // Add any remainder to the orderbook
  if (order1.quantity > 0) {
    orderbook.push(order1);
  }
  if (order2.quantity > 0) {
    orderbook.push(order2);
  }

  // Broadcast the orderbook update to all other instances
  link.announce('orderbook', service.port, {});
}

function checkOrders() {
  for (let i = 0; i < orderbook.length; i++) {
    const order1 = orderbook[i];
    for (let j = i + 1; j < orderbook.length; j++) {
      const order2 = orderbook[j];
      if (order1.side !== order2.side && order1.price >= order2.price) {
        executeOrder(order1, order2);
      }
    }
  }
}

// Periodically check for matching orders
setInterval(checkOrders, 1000);

// Handle incoming order submissions
service.on('submitOrder', (rid, key, payload, handler) => {
  submitOrder(...payload);
  handler.reply(null, 'Order submitted');
});

// Announce the orderbook to other instances on startup
link.announce('orderbook', service.port, {});

// setInterval(function () {
//   link.announce('rpc_test', service.port, {})
// }, 1000)

// service.on('request', (rid, key, payload, handler) => {
//   console.log(payload) //  { msg: 'hello' }
//   handler.reply(null, { msg: 'world' })
// })

// const { PeerRPCServer }  = require('grenache-nodejs-ws')
// const Link = require('grenache-nodejs-link')

// function fibonacci (n) {
//   if (n <= 1) {
//     return 1
//   }

//   return fibonacci(n - 1) + fibonacci(n - 2)
// }

// const link = new Link({
//   grape: 'http://127.0.0.1:30001'
// })
// link.start()

// const peer = new PeerRPCServer(link, {})
// peer.init()

// const service = peer.transport('server')
// service.listen(1337)

// setInterval(() => {
//   link.announce('fibonacci_worker', service.port, {})
// }, 1000)

// service.on('request', (rid, key, payload, handler) => {
//   const result = fibonacci(payload.number)
//   handler.reply(null, result)
// })
