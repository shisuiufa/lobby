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
import { SessionsService } from '@/sessions/sessions.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OutboxService } from '@/outbox/outbox.service';
import { CryptoUtil } from '@/common/utils/crypto.util';
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_HASH_SALT_ROUNDS,
} from './auth.constant';
import { EmailVerificationService } from '@/email-verification/email-verification.service';
import { VerifyDto } from './dto/verify.dto';
import { UserEntity } from '@/users/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EXCHANGE, ROUTING_KEY } from '@lobby/events';
import { ResendVerificationDto } from '@/auth/dto/resend-verification.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.findByEmail(registerDto.email),
      this.usersService.findByUsername(registerDto.username),
    ]);

    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      PASSWORD_HASH_SALT_ROUNDS,
    );

    const { token, tokenHash, expiresAt } = this.createEmailVerificationToken();

    await this.prisma.$transaction(async (tx) => {
      const user = await this.usersService.create(
        {
          email: registerDto.email,
          username: registerDto.username,
          displayName: registerDto.displayName,
          passwordHash,
        },
        tx,
      );

      await this.emailVerificationService.create(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        tx,
      );

      await this.outboxService.create(
        {
          exchangeName: EXCHANGE.AUTH,
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {
            email: registerDto.email,
            token: token,
          },
        },
        tx,
      );
    });
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
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

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email is not verified');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    const refreshToken = CryptoUtil.generateToken();
    const refreshTokenHash = CryptoUtil.hashToken(refreshToken);

    await this.sessionsService.create({
      userId: user.id,
      refreshTokenHash,
    });

    return new AuthResponseDto({
      user: new UserEntity(user),
      accessToken,
      refreshToken,
    });
  }

  async verifyEmail(verifyDto: VerifyDto): Promise<void> {
    const tokenHash = CryptoUtil.hashToken(verifyDto.token);

    const verification =
      await this.emailVerificationService.findByTokenHash(tokenHash);

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.usersService.markEmailVerified(verification.userId, tx);
      await this.emailVerificationService.delete(verification.id, tx);
    });
  }

  async resendVerificationEmail(dto: ResendVerificationDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return;
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email is already verified');
    }

    const verification = await this.emailVerificationService.findByUserId(
      user.id,
    );

    if (verification && verification.expiresAt > new Date()) {
      throw new BadRequestException(
        'The current verification link has not expired yet',
      );
    }

    const { token, tokenHash, expiresAt } = this.createEmailVerificationToken();

    await this.prisma.$transaction(async (tx) => {
      if (verification) {
        await this.emailVerificationService.delete(verification.id, tx);
      }

      await this.emailVerificationService.create(
        {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
        tx,
      );

      await this.outboxService.create(
        {
          exchangeName: EXCHANGE.AUTH,
          routingKey: ROUTING_KEY.EMAIL_VERIFICATION,
          payload: {
            email: user.email,
            token,
          },
        },
        tx,
      );
    });
  }

  private createEmailVerificationToken(): {
    token: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const token = CryptoUtil.generateToken();

    return {
      token,
      tokenHash: CryptoUtil.hashToken(token),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    };
  }
}
