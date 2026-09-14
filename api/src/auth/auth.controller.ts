import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { VerifyDto } from '@/auth/dto/verify.dto';
import { AuthResponseDto } from '@/auth/dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<void> {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyDto: VerifyDto): Promise<void> {
    return await this.authService.verifyEmail(verifyDto);
  }
}
