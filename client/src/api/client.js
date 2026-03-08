async function request(method, path, body) {
  const opts = {
    method,
    headers: {},
    credentials: 'include',
  };

  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(path, opts);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Something went wrong');
  }

  return json.data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
