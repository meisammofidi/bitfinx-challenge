'use strict'
const { PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

const link = new Link({
  grape: 'http://127.0.0.1:30001'
});
link.start();

const client = new PeerRPCClient(link, {});
client.init();

// Function to submit an order to the orderbook via the RPC server
function submitOrder(side, quantity, price) {
  client.request('server', 'submitOrder', [side, quantity, price], { timeout: 10000 }, (err, res) => {
    if (err) {
      console.error(err);
    } else {
      console.log(res);
    }
  });
}

// Handle incoming order submissions from other nodes in the network
link.announce('orderbook', () => {
  link.lookup('orderbook', (peer) => {
    const sub = link.subscribe('orderbook');
    sub.on('message', (data) => {
      console.log(`Received order: ${JSON.stringify(data)}`);
    });
  });
});


// const { PeerRPCClient }  = require('grenache-nodejs-ws')
// const Link = require('grenache-nodejs-link')

// const link = new Link({
//   grape: 'http://127.0.0.1:30001',
//   requestTimeout: 10000
// })
// link.start()

// const peer = new PeerRPCClient(link, {})
// peer.init()

// const payload = { number: 10 }
// peer.request('fibonacci_worker', payload, { timeout: 100000 }, (err, result) => {
//   if (err) throw err
//   console.log(
//     'Fibonacci number at place',
//     payload.number,
//     'in the sequence:',
//     result
//   )
// })