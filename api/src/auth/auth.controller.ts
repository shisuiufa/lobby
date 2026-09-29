import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { VerifyDto } from '@/auth/dto/verify.dto';
import { AuthResponseDto } from '@/auth/dto/auth-response.dto';
import { ResendVerificationDto } from '@/auth/dto/resend-verification.dto';
import { UsersEntity } from '@/users/users.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    return new AuthResponseDto({
      ...result,
      user: new UsersEntity(result.user),
    });
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<void> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() verifyDto: VerifyDto): Promise<void> {
    return this.authService.verifyEmail(verifyDto);
  }

  @Public()
  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  resendVerificationEmail(@Body() dto: ResendVerificationDto): Promise<void> {
    return this.authService.resendVerificationEmail(dto);
  }
}
