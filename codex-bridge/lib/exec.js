const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

async function runCommand(bin, args, options = {}) {
  const { timeoutMs, ...execOptions } = options;

  try {
    return await execFileAsync(bin, args, {
      maxBuffer: 10 * 1024 * 1024,
      env: process.env,
      timeout: timeoutMs,
      killSignal: 'SIGTERM',
      ...execOptions,
    });
  } catch (error) {
    if (timeoutMs && (error.killed || error.signal === 'SIGTERM')) {
      const wrapped = new Error(
        `Command timed out after ${timeoutMs}ms: ${bin} ${args.join(' ')}`
      );
      wrapped.code = 'ETIMEDOUT';
      wrapped.signal = error.signal;
      wrapped.killed = error.killed;
      wrapped.stdout = error.stdout;
      wrapped.stderr = error.stderr;
      wrapped.cause = error;
      throw wrapped;
    }

    throw error;
  }
}

module.exports = {
  runCommand,
};
