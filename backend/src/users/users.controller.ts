import { Controller, Post, Body, Get, UseGuards, Patch, Param, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from './dto/create-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN) // Apenas admin pode ver todos os usuários
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    // Um usuário normal só pode editar o próprio perfil.
    // O admin (rolesGuard) poderia editar qualquer um, mas para manter simples,
    // garantimos que o token é do próprio usuário a ser atualizado.
    if (req.user.id !== id && req.user.role !== Role.ADMIN) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    // Segurança: Impede que usuários normais promovam a si mesmos mudando sua role
    if (updateUserDto.role && req.user.role !== Role.ADMIN) {
      delete updateUserDto.role;
    }

    return this.usersService.update(id, updateUserDto);
  }
}
