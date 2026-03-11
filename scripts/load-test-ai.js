const BASE_URL = process.env.AI_LOAD_TEST_BASE_URL || 'http://127.0.0.1:5001/api';
const TOTAL_TASKS = Number(process.env.AI_LOAD_TEST_COUNT || 50);

async function createTask(index) {
  const response = await fetch(`${BASE_URL}/ai/request`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      task: 'chat_handler',
      user_id: `load-user-${Math.floor(index / 5)}`,
      payload: {
        message: `Load test request ${index}`,
        channel: 'load-test',
      },
      metadata: {
        run: 'load-test',
        index,
      },
    }),
  });

  return response.json();
}

async function getTask(taskId) {
  const response = await fetch(`${BASE_URL}/ai/task/${taskId}`);
  return response.json();
}

async function waitForTasks(taskIds) {
  const started = Date.now();
  const timeoutMs = Number(process.env.AI_LOAD_TEST_TIMEOUT_MS || 30000);

  while (Date.now() - started < timeoutMs) {
    const tasks = await Promise.all(taskIds.map(getTask));
    const done = tasks.filter(task => ['completed', 'failed'].includes(task.status));
    if (done.length === taskIds.length) {
      return tasks;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return Promise.all(taskIds.map(getTask));
}

async function main() {
  const queued = await Promise.all(Array.from({ length: TOTAL_TASKS }, (_, index) => createTask(index + 1)));
  const taskIds = queued.map(item => item.task_id).filter(Boolean);
  const results = await waitForTasks(taskIds);

  const summary = results.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    total_requested: TOTAL_TASKS,
    total_queued: taskIds.length,
    summary,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
