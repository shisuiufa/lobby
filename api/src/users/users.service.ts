import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  findByEmailWithPassword(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      omit: {
        passwordHash: false,
      },
    });
  }
}
