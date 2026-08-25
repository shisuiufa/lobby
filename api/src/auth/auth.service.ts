import {
  BadRequestException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { SessionsService } from '@/sessions/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
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

    await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      displayName: registerDto.displayName,
      passwordHash,
    });
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

    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.createRefreshTokenHash(refreshToken);

    await this.sessionsService.create({
      userId: user.id,
      refreshTokenHash,
    });

    const { passwordHash: _, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  private generateRefreshToken() {
    return randomBytes(32).toString('hex');
  }

  private createRefreshTokenHash(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
