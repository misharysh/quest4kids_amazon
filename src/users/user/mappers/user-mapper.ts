import { User } from '../../user.entity';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from '../../password/password.service';

export async function populate(to: User, from: UpdateUserDto): Promise<void> {
  if (from.password && from.oldPassword) {
    const passwordService = new PasswordService();
    //Compare the old password with the password in db
    if (!(await passwordService.verify(from.oldPassword, to.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //hash new password
    from.password = await passwordService.hash(from.password);
  }
  Object.assign(to, from);
}
