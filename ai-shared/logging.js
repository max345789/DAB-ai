function structuredLog(service, event, fields = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    service,
    event,
    ...fields,
  };

  const line = JSON.stringify(payload);
  if (fields.level === 'error') {
    console.error(line);
    return;
  }

  if (fields.level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = { structuredLog };
