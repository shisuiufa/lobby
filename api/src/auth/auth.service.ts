import {
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingEmail = await this.usersService.findByEmail(
      registerDto.email,
    );

    const existingUsername = await this.usersService.findByUsername(
      registerDto.username,
    );

    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      displayName: registerDto.displayName,
      passwordHash,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      user: user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
    };
  }
}
