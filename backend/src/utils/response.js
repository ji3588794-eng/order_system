const ok = (res, data = null, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const created = (res, data = null, message = 'Created') => {
  return ok(res, data, message, 201);
};

module.exports = { ok, created };
