import { usersService } from '../src/services/users.service';

describe('usersService', () => {
  it('registers and finds a user', () => {
    const { id } = usersService.register('080', 'pw');
    expect(usersService.findById(id)?.phone).toBe('080');
  });
});
