const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app');
const Participant = require('../../src/models/Participant');
const Question = require('../../src/models/Question');
const generateToken = require('../../src/utils/generateToken');

async function runConcurrencyTest() {
  console.log('🚀 Starting Concurrency & Race-Condition Stress Test...');
  process.env.JWT_SECRET = 'stress_test_secret_key_99999';
  process.env.NODE_ENV = 'test';

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { maxPoolSize: 50 });
  console.log('✅ In-memory MongoDB connected with pool size 50');

  // Start temporary HTTP server on an ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`🌐 Test server listening on port ${port}`);

  // 1. Seed 5 sample questions
  const createdQuestions = await Question.create([
    {
      questionText: 'Q1?',
      options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
      correctOptionKey: 'A',
      marks: 1,
      order: 1,
    },
    {
      questionText: 'Q2?',
      options: [{ key: 'A', text: '1' }, { key: 'B', text: '2' }],
      correctOptionKey: 'B',
      marks: 1,
      order: 2,
    },
  ]);

  const NUM_USERS = 50;
  console.log(`👥 Pre-generating ${NUM_USERS} test participants and JWTs...`);
  const participants = [];
  for (let i = 0; i < NUM_USERS; i++) {
    participants.push({
      name: `Stress User ${i}`,
      email: `user${i}@stress.test`,
      submitted: false,
    });
  }
  const createdParticipants = await Participant.insertMany(participants);

  const tokens = createdParticipants.map((p) => ({
    id: p._id,
    token: generateToken(p),
  }));

  console.log(`⚡ Simulating simultaneous submissions (${NUM_USERS * 2} requests: 1 normal + 1 simultaneous duplicate)...`);

  const answersPayload = (token) => ({
    answers: [
      { questionId: createdQuestions[0]._id.toString(), selectedOptionKey: 'A' },
      { questionId: createdQuestions[1]._id.toString(), selectedOptionKey: 'B' },
    ],
    timeTakenSeconds: Math.floor(Math.random() * 300) + 10,
  });

  const sendSubmit = (token) => {
    return new Promise((resolve) => {
      const payload = JSON.stringify(answersPayload(token));
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/quiz/submit',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body: data });
          });
        }
      );
      req.on('error', (err) => {
        resolve({ error: err.message });
      });
      req.write(payload);
      req.end();
    });
  };

  const startTime = Date.now();

  // Fire requests simultaneously
  const requests = [];
  for (const { token } of tokens) {
    // Fire two identical submit requests at the exact same moment to test race condition
    requests.push(sendSubmit(token));
    requests.push(sendSubmit(token));
  }

  const results = await Promise.all(requests);
  const duration = Date.now() - startTime;

  let successCount = 0;
  let conflict409Count = 0;
  let otherErrorCount = 0;

  for (const res of results) {
    if (res.statusCode === 200) successCount++;
    else if (res.statusCode === 409) conflict409Count++;
    else otherErrorCount++;
  }

  console.log('\n📊 Concurrency Test Results:');
  console.log(`   Total requests sent: ${requests.length}`);
  console.log(`   Total time: ${duration}ms (Avg ${(duration / requests.length).toFixed(2)}ms / req)`);
  console.log(`   Successful Submissions (200 OK): ${successCount} (Expected: ${NUM_USERS})`);
  console.log(`   Blocked Race Duplicates (409 Conflict): ${conflict409Count} (Expected: ${NUM_USERS})`);
  console.log(`   Other Statuses/Errors: ${otherErrorCount}`);

  // Assertions
  const totalSubmittedInDB = await Participant.countDocuments({ submitted: true });
  console.log(`   Participants in DB marked submitted: ${totalSubmittedInDB} (Expected: ${NUM_USERS})`);

  server.close();
  await mongoose.connection.close();
  await mongoServer.stop();

  if (successCount === NUM_USERS && conflict409Count === NUM_USERS && totalSubmittedInDB === NUM_USERS) {
    console.log('🎉 Concurrency & Race-Condition Test PASSED flawlessly!\n');
    process.exit(0);
  } else {
    console.error('❌ Concurrency test did not match expectations!');
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error('❌ Error during stress test:', err);
  process.exit(1);
});
