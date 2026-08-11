import { app } from './app.js';
import { config } from './libraries/config/index.js';
import { initWorker } from './libraries/queue/ingestionQueue.js';

const worker = initWorker();

const server = app.listen(config.port, () => {
  console.log(`RAG MVP server running on port ${config.port}`);
  console.log(`BullMQ worker initialized`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  await worker.close();

  server.close(() => {
    console.log('HTTP server closed.');
    // Exit clean
    process.exit(0);
  });

  // Force shutdown after 10s if connections persist
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: Error) => {
  console.error('❌ Unhandled Rejection at Promise:', reason);
  // Unhandled promise rejections are programmer errors, crash to restart
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception thrown:', error);
  // Uncaught exceptions are programmer errors, crash to restart
  process.exit(1);
});
