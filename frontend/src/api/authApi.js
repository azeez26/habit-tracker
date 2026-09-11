import { authClient } from './axiosClient';

export async function loginUser({ email, password }) {
  const res = await authClient.post('/login', { email, password });
  return res.data; // { success, user, token, timezone }
}
