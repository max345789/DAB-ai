const { spawn } = require('child_process');

function maybeMockResponse(promptPayload) {
  if ((process.env.CLAUDE_WORKER_MOCK || '').toLowerCase() !== 'true') {
    return null;
  }

  const parsed = {
    summary: 'Mock Claude worker response',
    input: promptPayload.userPrompt,
  };

  return {
    content: JSON.stringify(parsed),
    provider: 'claude-mock',
  };
}

async function sendPromptViaOllama(promptPayload) {
  const { systemPrompt, userPrompt } = promptPayload;
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const maxTokens = Number(promptPayload.maxTokens || 900);

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: {
        num_predict: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${response.status} ${text}`);
  }

  const data = await response.json();
  const content = data?.message?.content?.trim();
  if (!content) throw new Error('Ollama returned an empty response');
  return content;
}

function execClaude(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.CLAUDE_WORKER_BIN || 'claude', args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
    }, Number(process.env.CLAUDE_WORKER_TIMEOUT_MS || 15000));

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      const cleanStdout = stdout.trim();
      const cleanStderr = stderr.trim();

      if (code !== 0) {
        reject(new Error(cleanStderr || cleanStdout || 'Claude CLI execution failed'));
        return;
      }

      resolve({
        stdout: cleanStdout,
        stderr: cleanStderr,
      });
    });
  });
}

async function sendPrompt(promptPayload) {
  // Allow running the worker with a local LLM (no API cost).
  if ((process.env.AI_PROVIDER || '').toLowerCase() === 'ollama') {
    return sendPromptViaOllama(promptPayload);
  }

  const { systemPrompt, userPrompt } = promptPayload;
  const args = [
    '-p',
    '--permission-mode',
    'bypassPermissions',
    '--output-format',
    'text',
    '--system-prompt',
    systemPrompt,
    userPrompt,
  ];

  if (process.env.CLAUDE_WORKER_MODEL) {
    args.splice(2, 0, '--model', process.env.CLAUDE_WORKER_MODEL);
  }

  const { stdout } = await execClaude(args, {
    env: {
      ...process.env,
      CLAUDE_WORKER_KEY: process.env.CLAUDE_WORKER_KEY || '',
    },
  });

  if (!stdout) {
    throw new Error('Claude CLI returned an empty response');
  }

  return stdout;
}

async function receiveResponse(taskEnvelope) {
  const mock = maybeMockResponse(taskEnvelope);
  if (mock) return mock;

  const content = await sendPrompt(taskEnvelope);
  return {
    content,
    provider: (process.env.AI_PROVIDER || '').toLowerCase() === 'ollama' ? 'ollama' : 'claude-code',
  };
}

module.exports = {
  receiveResponse,
  sendPrompt,
};
