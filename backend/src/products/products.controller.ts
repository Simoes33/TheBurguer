import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/dto/create-user.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Request() req: any) {
    // Se o usuário estiver autenticado e for ADMIN/EMPLOYEE, mostra todos os produtos
    // Caso contrário, mostra apenas os com estoque.
    // Como a rota é pública, o req.user pode ser nulo.
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'EMPLOYEE';
    return this.productsService.findAll(isAdmin);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      createProductDto.imageUrl = await this.storageService.uploadFile(file, 'product-images');
    }
    // Converte strings do form-data para números se necessário
    if (typeof (createProductDto as any).price === 'string') {
      createProductDto.price = parseFloat((createProductDto as any).price);
    }
    if (typeof (createProductDto as any).stock === 'string') {
      createProductDto.stock = parseInt((createProductDto as any).stock, 10);
    }
    
    return this.productsService.create(createProductDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      updateProductDto.imageUrl = await this.storageService.uploadFile(file, 'product-images');
    }
    if (typeof (updateProductDto as any).price === 'string') {
      updateProductDto.price = parseFloat((updateProductDto as any).price);
    }
    if (typeof (updateProductDto as any).stock === 'string') {
      updateProductDto.stock = parseInt((updateProductDto as any).stock, 10);
    }

    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}

