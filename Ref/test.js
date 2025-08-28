// test_rabbitmq.js
// Run: npm install amqplib
// Command: node test.js
// ampqlib 0.10.3 fails. 0.10.7 does not fail.

const amqp = require('amqplib');

async function test() {
  const url = 'amqp://username:password@localhost:5672/vhost'; // <- your URL with vhost
  const exchange = 'citrineos_exchange'; // same as CitrineOS expects
  const identifier = 'test_module';
  const queueName = `rabbit_queue_${identifier}_${Date.now()}`;

  try {
    console.log('Connecting to', url);
    const conn = await amqp.connect(url);
    console.log(' Connected');

    const ch = await conn.createChannel();
    console.log('Channel created');

    // 1. Assert exchange (headers type, as in CitrineOS)
    await ch.assertExchange(exchange, 'headers', { durable: false });
    console.log(' Exchange asserted:', exchange);

    // 2. Assert queue
    await ch.assertQueue(queueName, {
      durable: false,
      autoDelete: true,
      exclusive: false,
    });
    console.log(' Queue created:', queueName);

    // 3. Bind queue to exchange with a filter
    const filter = { 'x-match': 'all', role: 'tester' };
    await ch.bindQueue(queueName, exchange, '', filter);
    console.log(` Bound queue ${queueName} to exchange ${exchange} with filter`, filter);

    // 4. Start consuming messages
    await ch.consume(queueName, (msg) => {
      if (msg) {
        console.log(' Received:', msg.content.toString());
        ch.ack(msg);
      }
    });
    console.log(' Consumer started');

    // 5. Send a test message to the exchange
    ch.publish(exchange, '', Buffer.from('Hello CitrineOS!'), {
      headers: { role: 'tester' },
    });
    console.log(' Test message sent');

    // Keep the process alive for a bit to see the message
    setTimeout(async () => {
      await conn.close();
      console.log(' Connection closed');
      process.exit(0);
    }, 3000);
  } catch (err) {
    console.error(' Error:', err.message);
  }
}

test();
