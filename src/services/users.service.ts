type User = { id: string; phone: string; password: string };

class UsersService {
  private users = new Map<string, User>();

  register(phone: string, password: string) {
    const id = String(this.users.size + 1);
    // TODO: hash the password
    this.users.set(id, { id, phone, password });
    return { id };
  }

  login(phone: string, password: string) {
    const user = [...this.users.values()].find((u) => u.phone === phone && u.password === password);
    return user ? { token: `t.${user.id}` } : null;
  }

  findById(id: string) {
    return this.users.get(id) ?? null;
  }
}

export const usersService = new UsersService();
